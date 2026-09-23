const https = require('https');
const { prisma } = require('../../lib/prisma');
const { AppError } = require('../../utils/AppError');
const { parseId, listOptions, listData, uniqueText } = require('../_shared/common');
const { propertySelect } = require('../_shared/selects');

// The host is deliberately fixed: the client supplies an address, never a URL.
// This prevents the address lookup endpoint from becoming an SSRF proxy.
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const PHOTON_SEARCH_URL = 'https://photon.komoot.io/api/';
const NOMINATIM_MIN_INTERVAL_MS = 1_100;
const GEOCODE_CACHE_TTL_MS = 15 * 60 * 1000;
const GEOCODE_CACHE_MAX_ENTRIES = 100;
const GEOCODE_RESPONSE_MAX_BYTES = 1_000_000;
const GEOCODE_ALLOWED_ORIGINS = new Set([
  'https://nominatim.openstreetmap.org',
  'https://photon.komoot.io'
]);
const LOCATION_PHRASE_EXCLUSIONS = new Set(['ha noi', 'ho chi', 'chi minh', 'viet nam', 'thanh pho']);
const geocodeCache = new Map();
let lastNominatimRequestAt = 0;

function normalizedAddress(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function locationWords(value) {
  return normalizedAddress(value)
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 && !/^\d+$/.test(token));
}

function locationPhrases(value) {
  const words = locationWords(value);
  const phrases = [];
  for (let index = 0; index < words.length - 1; index += 1) {
    const phrase = `${words[index]} ${words[index + 1]}`;
    if (!LOCATION_PHRASE_EXCLUSIONS.has(phrase)) phrases.push(phrase);
  }
  return [...new Set(phrases)];
}

function textOrNull(value, maxLength = 120) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : null;
}

function addressPart(address, keys) {
  for (const key of keys) {
    const value = textOrNull(address?.[key]);
    if (value) return value;
  }
  return null;
}

function normalizeGeocodeResults(payload) {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((place) => {
    const latitude = Number(place?.lat);
    const longitude = Number(place?.lon);
    const displayName = textOrNull(place?.display_name, 500);
    if (!displayName || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return [];

    const sourceAddress = place.address && typeof place.address === 'object' ? place.address : null;
    return [{
      displayName,
      latitude,
      longitude,
      ward: addressPart(sourceAddress, ['quarter', 'neighbourhood', 'suburb']),
      district: addressPart(sourceAddress, ['city_district', 'district', 'county', 'suburb']),
      city: addressPart(sourceAddress, ['city', 'town', 'village', 'municipality', 'state_district'])
    }];
  }).slice(0, 5);
}

function uniqueDisplayName(parts) {
  const seen = new Set();
  return parts.flatMap((part) => {
    const text = textOrNull(part, 160);
    const key = text?.toLocaleLowerCase('vi-VN');
    if (!text || seen.has(key)) return [];
    seen.add(key);
    return [text];
  }).join(', ');
}

function normalizePhotonResults(payload) {
  const features = Array.isArray(payload?.features) ? payload.features : [];
  return features.flatMap((feature) => {
    const properties = feature?.properties && typeof feature.properties === 'object' ? feature.properties : null;
    const coordinates = Array.isArray(feature?.geometry?.coordinates) ? feature.geometry.coordinates : [];
    const longitude = Number(coordinates[0]);
    const latitude = Number(coordinates[1]);
    const displayName = uniqueDisplayName([
      properties?.name,
      properties?.street,
      properties?.locality,
      properties?.district,
      properties?.city,
      properties?.state,
      properties?.country
    ]);
    if (!displayName || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return [];

    return [{
      displayName: displayName.slice(0, 500),
      latitude,
      longitude,
      ward: textOrNull(properties?.locality),
      district: textOrNull(properties?.district),
      city: textOrNull(properties?.city) || textOrNull(properties?.state) || textOrNull(properties?.county)
    }];
  }).slice(0, 5);
}

async function searchNominatim(address) {
  const params = new URLSearchParams({
    q: address,
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'vn',
    limit: '5',
    'accept-language': 'vi'
  });
  const response = await requestGeocodeJson(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
    Accept: 'application/json',
    'User-Agent': process.env.NOMINATIM_USER_AGENT || 'TroSinhVien/1.0 (local-development)'
  });
  return { available: response.available, items: normalizeGeocodeResults(response.payload) };
}

async function searchPhoton(address) {
  const params = new URLSearchParams({
    q: address,
    limit: '5',
    // Bounds of Việt Nam keep a broad query from returning another country.
    bbox: '102.14,8.18,109.47,23.40'
  });
  const response = await requestGeocodeJson(`${PHOTON_SEARCH_URL}?${params.toString()}`, {
    Accept: 'application/json',
    'User-Agent': process.env.NOMINATIM_USER_AGENT || 'TroSinhVien/1.0 (local-development)'
  });
  return { available: response.available, items: normalizePhotonResults(response.payload) };
}

async function searchOwnedProperties(user, address) {
  if (!user?.id) return [];
  const inputPhrases = locationPhrases(address);
  if (!inputPhrases.length) return [];

  const properties = await prisma.property.findMany({
    where: { landlordId: user.id },
    select: { address: true, ward: true, district: true, city: true, latitude: true, longitude: true },
    take: 50
  });

  return properties.flatMap((property) => {
    const latitude = Number(property.latitude);
    const longitude = Number(property.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return [];

    const propertyPhrases = new Set(locationPhrases([property.address, property.ward, property.district, property.city].filter(Boolean).join(' ')));
    const matches = inputPhrases.filter((phrase) => propertyPhrases.has(phrase));
    if (!matches.length) return [];

    return [{
      displayName: textOrNull(property.address, 500),
      latitude,
      longitude,
      ward: textOrNull(property.ward),
      district: textOrNull(property.district),
      city: textOrNull(property.city),
      score: matches.length
    }];
  }).filter((item) => item.displayName).sort((left, right) => right.score - left.score).slice(0, 5).map(({ score, ...item }) => item);
}

function cachedGeocode(key) {
  const entry = geocodeCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > GEOCODE_CACHE_TTL_MS) {
    geocodeCache.delete(key);
    return null;
  }
  return entry.items;
}

function cacheGeocode(key, items) {
  if (geocodeCache.size >= GEOCODE_CACHE_MAX_ENTRIES) {
    const oldestKey = geocodeCache.keys().next().value;
    if (oldestKey) geocodeCache.delete(oldestKey);
  }
  geocodeCache.set(key, { createdAt: Date.now(), items });
}

function requestGeocodeJson(url, headers) {
  const target = new URL(url);
  if (!GEOCODE_ALLOWED_ORIGINS.has(target.origin)) return Promise.resolve({ available: false, payload: null });

  return new Promise((resolve) => {
    const request = https.get(target, { headers, timeout: 8_000 }, (response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume?.();
        resolve({ available: false, payload: null });
        return;
      }

      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
        if (body.length > GEOCODE_RESPONSE_MAX_BYTES) request.destroy();
      });
      response.on('error', () => resolve({ available: false, payload: null }));
      response.on('end', () => {
        if (body.length > GEOCODE_RESPONSE_MAX_BYTES) {
          resolve({ available: false, payload: null });
          return;
        }
        try {
          resolve({ available: true, payload: JSON.parse(body) });
        } catch {
          resolve({ available: false, payload: null });
        }
      });
    });
    request.on('timeout', () => request.destroy());
    request.on('error', () => resolve({ available: false, payload: null }));
  });
}

async function assertPropertyOwner(user, value) {
  const id = parseId(value, 'propertyId');
  const property = await prisma.property.findUnique({ where: { id }, select: { id: true, landlordId: true } });
  if (!property) throw new AppError('Không tìm thấy khu trọ', 404);
  if (user.role !== 'ADMIN' && (user.role !== 'LANDLORD' || property.landlordId !== user.id)) {
    throw new AppError('Bạn không có quyền thao tác khu trọ này', 403);
  }
  return property;
}

async function uniqueSlug(raw, excludeId) {
  const base = uniqueText(raw) || 'khu-tro';
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const slug = suffix ? `${base}-${suffix}` : base;
    const found = await prisma.property.findUnique({ where: { slug }, select: { id: true } });
    if (!found || found.id === excludeId) return slug;
  }
  throw new AppError('Không thể tạo đường dẫn duy nhất cho khu trọ', 409);
}

async function list(query, user) {
  const pagination = listOptions(query);
  const where = {};
  if (query.city) where.city = query.city;
  if (query.district) where.district = query.district;
  if (query.landlordId) where.landlordId = query.landlordId;
  if (user && user.role === 'LANDLORD') where.landlordId = user.id;
  const select = { ...propertySelect, _count: { select: { rooms: true } } };
  const [items, total] = await prisma.$transaction([
    prisma.property.findMany({ where, select, orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.limit }),
    prisma.property.count({ where })
  ]);
  return listData(items, pagination, total);
}

async function get(value) {
  const property = await prisma.property.findUnique({
    where: { id: parseId(value, 'propertyId') },
    select: { ...propertySelect, rooms: { select: { id: true, code: true, name: true, price: true, status: true, availableSlots: true } }, nearbyPlaces: true }
  });
  if (!property) throw new AppError('Không tìm thấy khu trọ', 404);
  return property;
}

async function geocodeAddress(rawAddress, user) {
  const address = normalizedAddress(rawAddress);
  const cacheKey = `${user?.id || 'anonymous'}:${address.toLocaleLowerCase('vi-VN')}`;
  const cached = cachedGeocode(cacheKey);
  if (cached) return cached;

  // Nominatim's public policy permits only one request per second per app.
  if (Date.now() - lastNominatimRequestAt < NOMINATIM_MIN_INTERVAL_MS) {
    throw new AppError('Vui lòng chờ khoảng một giây rồi tìm lại vị trí.', 429);
  }
  lastNominatimRequestAt = Date.now();

  const nominatim = await searchNominatim(address);
  // A landlord's own saved locations are a private, accurate fallback for a
  // familiar neighborhood when an external source is unavailable.
  const ownedProperties = nominatim.items.length ? [] : await searchOwnedProperties(user, address);
  // Photon is an OpenStreetMap-backed fallback for networks where the primary
  // public Nominatim source is unavailable. All provider hosts are fixed.
  const photon = nominatim.items.length || ownedProperties.length ? null : await searchPhoton(address);
  const items = nominatim.items.length ? nominatim.items : ownedProperties.length ? ownedProperties : photon.items;
  if (!items.length) {
    if (![nominatim, photon].some((source) => source?.available)) {
      throw new AppError('Không thể kết nối dịch vụ bản đồ. Vui lòng thử lại sau.', 503);
    }
    throw new AppError('Không tìm thấy vị trí. Hãy nhập địa chỉ cụ thể hơn.', 404);
  }

  cacheGeocode(cacheKey, items);
  return items;
}

async function create(user, input) {
  if (user.role !== 'LANDLORD') throw new AppError('Chỉ chủ trọ có thể tạo khu trọ', 403);
  const slug = await uniqueSlug(input.slug || input.name);
  return prisma.property.create({ data: { ...input, slug, landlordId: user.id, verificationStatus: 'PENDING' }, select: propertySelect });
}

async function update(user, value, input) {
  const property = await assertPropertyOwner(user, value);
  const data = { ...input };
  if (input.slug) data.slug = await uniqueSlug(input.slug, property.id);
  return prisma.property.update({ where: { id: property.id }, data, select: propertySelect });
}

async function remove(user, value) {
  const property = await assertPropertyOwner(user, value);
  const roomCount = await prisma.room.count({ where: { propertyId: property.id } });
  if (roomCount) throw new AppError('Không thể xóa khu trọ còn phòng. Hãy ẩn hoặc xóa phòng trước.', 409);
  await prisma.property.delete({ where: { id: property.id } });
}

async function listNearbyPlaces(value) {
  const propertyId = parseId(value, 'propertyId');
  const places = await prisma.nearbyPlace.findMany({ where: { propertyId }, orderBy: [{ distanceMeters: 'asc' }, { name: 'asc' }] });
  return places;
}

async function createNearbyPlace(user, value, input) {
  const property = await assertPropertyOwner(user, value);
  return prisma.nearbyPlace.create({ data: { ...input, propertyId: property.id } });
}

async function removeNearbyPlace(user, propertyValue, placeValue) {
  const property = await assertPropertyOwner(user, propertyValue);
  const id = parseId(placeValue, 'nearbyPlaceId');
  const place = await prisma.nearbyPlace.findUnique({ where: { id }, select: { propertyId: true } });
  if (!place || place.propertyId !== property.id) throw new AppError('Không tìm thấy tiện ích xung quanh', 404);
  await prisma.nearbyPlace.delete({ where: { id } });
}

module.exports = { list, get, geocodeAddress, create, update, remove, listNearbyPlaces, createNearbyPlace, removeNearbyPlace };
