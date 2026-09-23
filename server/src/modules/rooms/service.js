const { prisma } = require('../../lib/prisma');
const fs = require('fs/promises');
const { AppError } = require('../../utils/AppError');
const { removeUploadedFiles } = require('../../middleware/upload.middleware');
const { publicRoom } = require('../../utils/serializers');
const { haversineDistanceKm, estimateTravelTimes, roomMatchScore } = require('../../services/calculation.service');
const { parseId, csvIntegers, listOptions, listData } = require('../_shared/common');
const { roomInclude, roomListInclude, universitySelect } = require('../_shared/selects');
const { createNotification } = require('../_shared/notifications');

function roomSummary(room) {
  return publicRoom(room);
}

async function roomWhere(query = {}) {
  const where = {};
  const clauses = [];
  if (query.q) clauses.push({ OR: [
    { name: { contains: query.q } }, { code: { contains: query.q } }, { description: { contains: query.q } },
    { property: { is: { name: { contains: query.q } } } }, { property: { is: { address: { contains: query.q } } } }
  ] });
  if (query.minPrice !== undefined || query.maxPrice !== undefined) where.price = { ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}), ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}) };
  if (query.minArea !== undefined || query.maxArea !== undefined) where.area = { ...(query.minArea !== undefined ? { gte: query.minArea } : {}), ...(query.maxArea !== undefined ? { lte: query.maxArea } : {}) };
  const normalizeType = (value) => ({ ROOM: 'PRIVATE_ROOM', PRIVATE: 'PRIVATE_ROOM', SHARED: 'SHARED_ROOM' })[String(value).trim().toUpperCase()] || String(value).trim().toUpperCase();
  const types = query.types ? String(query.types).split(',').map(normalizeType).filter(Boolean) : query.type ? [query.type] : [];
  if (types.length) where.type = { in: types };
  if (query.minCapacity !== undefined) where.capacity = { gte: query.minCapacity };
  if (query.availableOnly !== false) {
    where.status = 'AVAILABLE';
    where.availableSlots = { gt: 0 };
  } else {
    // Public search may include unavailable listings for comparison, but
    // a hidden listing is never publicly discoverable.
    where.status = { not: 'HIDDEN' };
  }
  if (query.city || query.district) where.property = { is: { ...(query.city ? { city: query.city } : {}), ...(query.district ? { district: query.district } : {}) } };
  const amenityIds = csvIntegers(query.amenityIds, 'amenityIds');
  if (query.amenitySlugs) {
    const slugs = [...new Set(String(query.amenitySlugs).split(',').map((slug) => slug.trim()).filter(Boolean))];
    if (slugs.some((slug) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) throw new AppError('amenitySlugs không hợp lệ', 422);
    const amenities = await prisma.amenity.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
    if (amenities.length !== slugs.length) throw new AppError('Có tiện ích không tồn tại', 422);
    amenityIds.push(...amenities.map((amenity) => amenity.id));
  }
  for (const amenityId of [...new Set(amenityIds)]) clauses.push({ amenities: { some: { amenityId } } });
  if (clauses.length) where.AND = clauses;
  return where;
}

async function universityFrom(value) {
  if (!value) return null;
  const university = await prisma.university.findUnique({ where: { id: parseId(value, 'universityId') }, select: universitySelect });
  if (!university) throw new AppError('Không tìm thấy trường đại học', 404);
  return university;
}

function enrichRoom(room, university) {
  const data = roomSummary(room);
  if (!university) return data;
  const distanceKm = haversineDistanceKm(room.property, university);
  return { ...data, distanceKm, travelTimes: estimateTravelTimes(distanceKm) };
}

function locationInsight(places, distanceKm) {
  const categories = new Set(places.map((place) => place.category));
  const points = Math.min(10, 4 + (distanceKm === null || distanceKm < 3 ? 2 : distanceKm < 5 ? 1 : 0) + Math.min(4, categories.size * 0.7));
  const reasons = [];
  if (distanceKm !== null) reasons.push(`Cách trường ${distanceKm.toFixed(1)} km`);
  if (categories.has('BUS_STOP')) reasons.push('Có trạm xe buýt lân cận');
  if (categories.has('MARKET') || categories.has('SUPERMARKET') || categories.has('CONVENIENCE_STORE')) reasons.push('Thuận tiện mua sắm');
  if (categories.has('PHARMACY') || categories.has('HOSPITAL')) reasons.push('Có dịch vụ y tế lân cận');
  return { score: Number(points.toFixed(1)), reasons };
}

async function list(query) {
  const pagination = listOptions(query);
  const university = await universityFrom(query.universityId);
  const where = await roomWhere(query);
  const requiresMemorySort = Boolean(university) || ['RATING_DESC', 'MATCH_DESC', 'DISTANCE_ASC'].includes(query.sort);
  if (!requiresMemorySort) {
    const orderBy = query.sort === 'PRICE_ASC' ? { price: 'asc' } : query.sort === 'PRICE_DESC' ? { price: 'desc' } : { createdAt: 'desc' };
    const [items, total] = await prisma.$transaction([
      prisma.room.findMany({ where, include: roomListInclude, orderBy, skip: pagination.skip, take: pagination.limit }),
      prisma.room.count({ where })
    ]);
    return listData(items.map(roomSummary), pagination, total);
  }
  const candidates = await prisma.room.findMany({ where, include: roomListInclude, orderBy: { createdAt: 'desc' }, take: 500 });
  let items = candidates.map((room) => enrichRoom(room, university));
  if (query.radiusKm && university) items = items.filter((room) => room.distanceKm <= query.radiusKm);
  if (query.sort === 'RATING_DESC') items.sort((a, b) => b.averageRating - a.averageRating);
  else if (query.sort === 'DISTANCE_ASC') items.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  else if (query.sort === 'PRICE_ASC') items.sort((a, b) => Number(a.price) - Number(b.price));
  else if (query.sort === 'PRICE_DESC') items.sort((a, b) => Number(b.price) - Number(a.price));
  const total = items.length;
  items = items.slice(pagination.skip, pagination.skip + pagination.limit);
  return listData(items, pagination, total);
}

async function get(value, query = {}) {
  const room = await prisma.room.findUnique({ where: { id: parseId(value, 'roomId') }, include: roomInclude });
  if (!room || room.status === 'HIDDEN') throw new AppError('Không tìm thấy phòng', 404);
  const university = await universityFrom(query.universityId);
  const places = await prisma.nearbyPlace.findMany({ where: { propertyId: room.propertyId }, orderBy: [{ distanceMeters: 'asc' }, { name: 'asc' }] });
  const item = enrichRoom(room, university);
  return { ...item, nearbyPlaces: places, location: locationInsight(places, item.distanceKm ?? null) };
}

async function assertRoomOwner(user, value) {
  const id = parseId(value, 'roomId');
  const room = await prisma.room.findUnique({ where: { id }, include: { property: { select: { landlordId: true } } } });
  if (!room) throw new AppError('Không tìm thấy phòng', 404);
  if (user.role !== 'ADMIN' && (user.role !== 'LANDLORD' || room.property.landlordId !== user.id)) throw new AppError('Bạn không có quyền thao tác phòng này', 403);
  return room;
}

async function ensurePropertyOwnership(user, propertyId) {
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, landlordId: true } });
  if (!property) throw new AppError('Không tìm thấy khu trọ', 404);
  if (user.role !== 'ADMIN' && property.landlordId !== user.id) throw new AppError('Bạn không có quyền thêm phòng vào khu trọ này', 403);
  return property;
}

async function ensureAmenities(amenityIds = []) {
  if (!amenityIds.length) return;
  const count = await prisma.amenity.count({ where: { id: { in: amenityIds } } });
  if (count !== amenityIds.length) throw new AppError('Có tiện ích không tồn tại', 422);
}

function imageRows(images = []) {
  return images.map((image, index) => ({ url: image.url, altText: image.altText || null, isCover: Boolean(image.isCover) || (!images.some((item) => item.isCover) && index === 0), sortOrder: index }));
}

function normalizedImages(images, imageUrls) {
  if (images !== undefined) return images;
  if (imageUrls === undefined) return undefined;
  return imageUrls.map((url) => ({ url }));
}

async function create(user, input) {
  if (user.role !== 'LANDLORD' && user.role !== 'ADMIN') throw new AppError('Chỉ chủ trọ có thể tạo phòng', 403);
  await ensurePropertyOwnership(user, input.propertyId);
  await ensureAmenities(input.amenityIds || []);
  const { amenityIds = [], images, imageUrls, ...data } = input;
  const imageData = normalizedImages(images, imageUrls) || [];
  const room = await prisma.room.create({
    data: {
      ...data,
      publishedAt: data.status === 'HIDDEN' ? null : new Date(),
      amenities: { create: amenityIds.map((amenityId) => ({ amenityId })) },
      images: { create: imageRows(imageData) },
      priceHistories: { create: { oldPrice: null, newPrice: data.price, changedById: user.id, reason: 'Giá đăng ban đầu' } }
    },
    include: roomInclude
  });
  return roomSummary(room);
}

async function update(user, value, input) {
  const existing = await assertRoomOwner(user, value);
  await ensureAmenities(input.amenityIds || []);
  const { amenityIds, images, imageUrls, ...data } = input;
  const imageData = normalizedImages(images, imageUrls);
  if (data.availableSlots !== undefined && data.capacity === undefined && data.availableSlots > existing.capacity) throw new AppError('Số chỗ trống không thể lớn hơn sức chứa', 422);
  const room = await prisma.$transaction(async (tx) => {
    const updateData = { ...data };
    if (data.status && data.status !== 'HIDDEN' && !existing.publishedAt) updateData.publishedAt = new Date();
    if (data.price !== undefined && Number(data.price) !== Number(existing.price)) {
      updateData.priceHistories = { create: { oldPrice: existing.price, newPrice: data.price, changedById: user.id, reason: 'Chủ trọ cập nhật giá' } };
    }
    if (amenityIds !== undefined) {
      updateData.amenities = { deleteMany: {}, create: amenityIds.map((amenityId) => ({ amenityId })) };
    }
    if (imageData !== undefined) updateData.images = { deleteMany: {}, create: imageRows(imageData) };
    return tx.room.update({ where: { id: existing.id }, data: updateData, include: roomInclude });
  });
  if (data.price !== undefined && Number(data.price) !== Number(existing.price)) {
    const favorites = await prisma.favorite.findMany({ where: { roomId: existing.id }, select: { studentId: true } });
    await Promise.all(favorites.map((favorite) => createNotification(favorite.studentId, {
      type: 'PRICE_CHANGED', title: 'Giá phòng yêu thích đã thay đổi', content: `Giá phòng ${room.name} vừa được cập nhật.`, linkUrl: `/rooms/${room.id}`
    })));
  }
  return roomSummary(room);
}

async function hide(user, value) {
  const room = await assertRoomOwner(user, value);
  return prisma.room.update({ where: { id: room.id }, data: { status: 'HIDDEN' }, select: { id: true, status: true } });
}

async function priceHistory(value) {
  const roomId = parseId(value, 'roomId');
  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { id: true, status: true } });
  if (!room || room.status === 'HIDDEN') throw new AppError('Không tìm thấy phòng', 404);
  return prisma.roomPriceHistory.findMany({ where: { roomId }, orderBy: { changedAt: 'asc' }, select: { id: true, oldPrice: true, newPrice: true, reason: true, changedAt: true } });
}

async function nearbyPlaces(value) {
  const room = await prisma.room.findUnique({
    where: { id: parseId(value, 'roomId') },
    select: { propertyId: true, status: true }
  });
  if (!room || room.status === 'HIDDEN') throw new AppError('Không tìm thấy phòng', 404);
  return prisma.nearbyPlace.findMany({
    where: { propertyId: room.propertyId },
    orderBy: [{ distanceMeters: 'asc' }, { name: 'asc' }]
  });
}

function hasExpectedImageSignature(file, header) {
  if (file.mimetype === 'image/jpeg') return header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (file.mimetype === 'image/png') return header.length >= 8 && header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (file.mimetype === 'image/webp') return header.length >= 12 && header.subarray(0, 4).equals(Buffer.from('RIFF')) && header.subarray(8, 12).equals(Buffer.from('WEBP'));
  return false;
}

async function validateUploadedImages(files) {
  for (const file of files) {
    const handle = await fs.open(file.path, 'r');
    try {
      const header = Buffer.alloc(12);
      const { bytesRead } = await handle.read(header, 0, header.length, 0);
      if (!hasExpectedImageSignature(file, header.subarray(0, bytesRead))) {
        throw new AppError('Nội dung tệp không khớp với định dạng ảnh đã khai báo', 422);
      }
    } finally {
      await handle.close();
    }
  }
}

async function uploadImages(user, value, files) {
  const uploadFiles = Array.isArray(files) ? files : [];
  try {
    const room = await assertRoomOwner(user, value);
    if (!uploadFiles.length) throw new AppError('Cần tải lên ít nhất một ảnh', 422);
    await validateUploadedImages(uploadFiles);
    const existing = await prisma.roomImage.findMany({
      where: { roomId: room.id },
      select: { sortOrder: true, isCover: true }
    });
    const startOrder = existing.length ? Math.max(...existing.map((image) => image.sortOrder)) + 1 : 0;
    const hasCover = existing.some((image) => image.isCover);
    return await prisma.$transaction(async (tx) => {
      const created = [];
      for (const [index, file] of uploadFiles.entries()) {
        const image = await tx.roomImage.create({
          data: {
            roomId: room.id,
            url: `/uploads/${encodeURIComponent(file.filename)}`,
            altText: file.originalname ? `Ảnh phòng ${room.id}` : null,
            sortOrder: startOrder + index,
            isCover: !hasCover && index === 0
          }
        });
        created.push(image);
      }
      return created;
    });
  } catch (error) {
    await removeUploadedFiles(uploadFiles);
    throw error;
  }
}

async function compare(query) {
  const ids = csvIntegers(query.ids, 'ids');
  if (ids.length < 2 || ids.length > 4) throw new AppError('Chỉ có thể so sánh từ 2 đến 4 phòng', 422);
  const rooms = await prisma.room.findMany({ where: { id: { in: ids }, status: { not: 'HIDDEN' } }, include: roomListInclude });
  if (rooms.length !== ids.length) throw new AppError('Có phòng không tồn tại hoặc không thể xem', 404);
  const university = await universityFrom(query.universityId);
  return ids.map((id) => enrichRoom(rooms.find((room) => room.id === id), university));
}

async function recommendations(user, preference) {
  if (user.role !== 'STUDENT') throw new AppError('Chỉ sinh viên có thể nhận gợi ý phòng', 403);
  const [profile, roommateProfile] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: user.id }, select: { universityId: true } }),
    prisma.roommateProfile.findUnique({ where: { studentId: user.id }, select: { universityId: true, budgetMin: true, budgetMax: true, maxDistanceKm: true } })
  ]);
  const storedPreference = roommateProfile ? {
    budgetMin: Number(roommateProfile.budgetMin),
    budgetMax: Number(roommateProfile.budgetMax),
    maxDistanceKm: roommateProfile.maxDistanceKm === null ? undefined : Number(roommateProfile.maxDistanceKm),
    universityId: roommateProfile.universityId || undefined
  } : {};
  const effectivePreference = Object.fromEntries(Object.entries({ ...storedPreference, ...preference }).filter(([, value]) => value !== undefined));
  const university = await universityFrom(effectivePreference.universityId || profile?.universityId);
  const query = {
    ...effectivePreference,
    minPrice: effectivePreference.budgetMin,
    maxPrice: effectivePreference.budgetMax,
    availableOnly: true,
    sort: 'MATCH_DESC'
  };
  const where = await roomWhere(query);
  const rooms = await prisma.room.findMany({ where, include: roomListInclude, take: 500 });
  const pagination = listOptions(effectivePreference);
  let items = rooms.map((room) => {
    const enriched = enrichRoom(room, university);
    const matched = roomMatchScore(enriched, effectivePreference, enriched.distanceKm ?? null);
    return { ...enriched, matchScore: matched.score, matchReasons: matched.reasons };
  });
  if (effectivePreference.maxDistanceKm && university) items = items.filter((room) => room.distanceKm <= effectivePreference.maxDistanceKm);
  items.sort((a, b) => b.matchScore - a.matchScore || Number(a.price) - Number(b.price));
  const total = items.length;
  return listData(items.slice(pagination.skip, pagination.skip + pagination.limit), pagination, total);
}

async function mine(user, query) {
  if (user.role !== 'LANDLORD' && user.role !== 'ADMIN') throw new AppError('Chỉ chủ trọ có thể xem phòng quản lý', 403);
  const pagination = listOptions(query);
  const where = user.role === 'ADMIN' ? {} : { property: { is: { landlordId: user.id } } };
  const [items, total] = await prisma.$transaction([
    prisma.room.findMany({ where, include: roomListInclude, orderBy: { updatedAt: 'desc' }, skip: pagination.skip, take: pagination.limit }),
    prisma.room.count({ where })
  ]);
  return listData(items.map(roomSummary), pagination, total);
}

module.exports = { list, get, create, update, hide, priceHistory, nearbyPlaces, uploadImages, compare, recommendations, mine };
