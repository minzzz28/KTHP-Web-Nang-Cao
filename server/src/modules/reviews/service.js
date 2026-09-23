const { prisma } = require('../../lib/prisma'); const { AppError } = require('../../utils/AppError'); const { parseId, listOptions, listData } = require('../_shared/common'); const { publicUserSelect } = require('../_shared/selects'); const { createNotification } = require('../_shared/notifications');
const reviewInclude = { student: { select: publicUserSelect }, room: { select: { id: true, name: true, code: true } }, landlord: { select: publicUserSelect }, contract: { select: { id: true, contractNumber: true } } };
async function list(query, user) {
  const pagination = listOptions(query);
  if (query.mine && !user) throw new AppError('Vui lòng đăng nhập để xem đánh giá của mình', 401);
  const mineWhere = query.mine && user
    ? user.role === 'LANDLORD' ? { landlordId: user.id }
      : user.role === 'STUDENT' ? { studentId: user.id }
        : {}
    : {};
  const where = { status: 'PUBLISHED', ...mineWhere, ...(query.roomId ? { roomId: query.roomId } : {}), ...(query.landlordId ? { landlordId: query.landlordId } : {}) };
  const [items, total] = await prisma.$transaction([
    prisma.review.findMany({ where, include: reviewInclude, orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.limit }),
    prisma.review.count({ where })
  ]);
  return listData(items, pagination, total);
}
async function create(user, input) { if (user.role !== 'STUDENT') throw new AppError('Chỉ sinh viên có thể đánh giá', 403); const contract = await prisma.contract.findUnique({ where: { id: input.contractId }, include: { tenants: { where: { studentId: user.id } }, room: { select: { id: true } } } }); if (!contract || !contract.tenants.length || !['ACTIVE', 'EXPIRED', 'TERMINATED'].includes(contract.status)) throw new AppError('Bạn chỉ có thể đánh giá hợp đồng đã hoặc đang thuê', 403); const existing = await prisma.review.findUnique({ where: { contractId_studentId: { contractId: contract.id, studentId: user.id } }, select: { id: true } }); if (existing) throw new AppError('Bạn đã đánh giá hợp đồng này', 409); const { contractId, ...data } = input; const review = await prisma.review.create({ data: { ...data, contractId, studentId: user.id, roomId: contract.roomId, landlordId: contract.landlordId }, include: reviewInclude }); await createNotification(contract.landlordId, { type: 'REPORT', title: 'Có đánh giá mới', content: `${user.fullName} đã gửi đánh giá cho phòng của bạn.`, linkUrl: `/reviews?roomId=${contract.roomId}` }); return review; }
async function assertOwner(user, value) { const review = await prisma.review.findUnique({ where: { id: parseId(value, 'reviewId') }, include: reviewInclude }); if (!review) throw new AppError('Không tìm thấy đánh giá', 404); if (review.studentId !== user.id) throw new AppError('Bạn không có quyền thao tác đánh giá này', 403); return review; }
async function update(user, value, input) { if (user.role !== 'STUDENT') throw new AppError('Chỉ sinh viên có thể sửa đánh giá', 403); const review = await assertOwner(user, value); return prisma.review.update({ where: { id: review.id }, data: input, include: reviewInclude }); }
async function moderate(user, value, input) { if (user.role !== 'ADMIN') throw new AppError('Chỉ admin có thể kiểm duyệt đánh giá', 403); const review = await prisma.review.findUnique({ where: { id: parseId(value, 'reviewId') }, include: reviewInclude }); if (!review) throw new AppError('Không tìm thấy đánh giá', 404); const updated = await prisma.review.update({ where: { id: review.id }, data: { status: input.status, moderatedById: user.id, moderationNote: input.moderationNote || null, moderatedAt: new Date() }, include: reviewInclude }); await createNotification(review.studentId, { type: 'REPORT', title: 'Đánh giá đã được kiểm duyệt', content: `Đánh giá của bạn đã được ${input.status === 'PUBLISHED' ? 'hiển thị' : 'ẩn'}.`, linkUrl: `/reviews/${review.id}` }); return updated; }
async function remove(user, value) { const review = await assertOwner(user, value); return prisma.review.update({ where: { id: review.id }, data: { status: 'HIDDEN' }, include: reviewInclude }); }
module.exports = { list, create, update, moderate, remove };
