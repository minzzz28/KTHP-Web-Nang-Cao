const { prisma } = require('../../lib/prisma');
const { AppError } = require('../../utils/AppError');
const { parseId, listOptions, listData } = require('../_shared/common');
const { publicUserSelect } = require('../_shared/selects');
const { createNotification } = require('../_shared/notifications');

const requestInclude = {
  sender: { select: publicUserSelect }, recipient: { select: publicUserSelect },
  post: { select: { id: true, title: true, status: true } }, room: { select: { id: true, name: true, status: true } }
};
function serializeRequest(request) {
  if (!request) return request;
  return {
    ...request,
    // Keep the canonical sender/recipient fields and expose UI-friendly aliases.
    sender: request.sender ? { ...request.sender, user: request.sender } : null,
    recipient: request.recipient ? { ...request.recipient, user: request.recipient } : null,
    receiver: request.recipient ? { ...request.recipient, user: request.recipient } : null
  };
}
function ensureStudent(user) { if (user.role !== 'STUDENT') throw new AppError('Chỉ sinh viên có thể quản lý lời mời ở ghép', 403); }
async function send(user, input) {
  ensureStudent(user);
  if (input.recipientId === user.id) throw new AppError('Không thể gửi lời mời cho chính bạn', 422);
  const recipient = await prisma.user.findUnique({ where: { id: input.recipientId }, select: { id: true, role: true, status: true } });
  if (!recipient || recipient.role !== 'STUDENT' || recipient.status !== 'ACTIVE') throw new AppError('Người nhận không hợp lệ', 422);
  if (input.postId) {
    const post = await prisma.roommatePost.findUnique({ where: { id: input.postId }, select: { studentId: true, status: true } });
    if (!post || post.status !== 'OPEN') throw new AppError('Bài đăng ở ghép không còn mở', 422);
    if (post.studentId !== input.recipientId) throw new AppError('Người nhận phải là tác giả bài đăng', 422);
  }
  if (input.roomId) {
    const room = await prisma.room.findUnique({ where: { id: input.roomId }, select: { id: true, status: true } });
    if (!room || room.status === 'HIDDEN') throw new AppError('Không tìm thấy phòng được chọn', 404);
  }
  const activePairKey = [user.id, input.recipientId].sort((left, right) => left - right).join(':');
  const duplicate = await prisma.roommateRequest.findUnique({ where: { activePairKey }, select: { id: true } });
  if (duplicate) throw new AppError('Đã có lời mời đang chờ với người này', 409);
  const request = await prisma.roommateRequest.create({ data: { ...input, senderId: user.id, activePairKey }, include: requestInclude });
  await createNotification(input.recipientId, { type: 'ROOMMATE_REQUEST', title: 'Bạn có lời mời ở ghép mới', content: `${user.fullName} đã gửi lời mời ở ghép cho bạn.`, linkUrl: '/roommate-requests/received' });
  return serializeRequest(request);
}
async function list(user, direction, query) {
  ensureStudent(user);
  const pagination = listOptions(query);
  const where = { [direction === 'sent' ? 'senderId' : 'recipientId']: user.id, ...(query.status ? { status: query.status } : {}) };
  const [items, total] = await prisma.$transaction([
    prisma.roommateRequest.findMany({ where, include: requestInclude, orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.limit }),
    prisma.roommateRequest.count({ where })
  ]);
  return listData(items.map(serializeRequest), pagination, total);
}
async function listAll(user, query) {
  ensureStudent(user);
  const pagination = listOptions(query);
  const where = {
    OR: [{ senderId: user.id }, { recipientId: user.id }],
    ...(query.status ? { status: query.status } : {})
  };
  const [items, total] = await prisma.$transaction([
    prisma.roommateRequest.findMany({ where, include: requestInclude, orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.limit }),
    prisma.roommateRequest.count({ where })
  ]);
  return listData(items.map(serializeRequest), pagination, total);
}
async function act(user, value, action) {
  ensureStudent(user);
  const id = parseId(value, 'requestId');
  const request = await prisma.roommateRequest.findUnique({ where: { id }, include: requestInclude });
  if (!request) throw new AppError('Không tìm thấy lời mời ở ghép', 404);
  if (request.status !== 'PENDING') throw new AppError('Lời mời này đã được xử lý', 409);
  let status;
  if (action === 'CANCEL') {
    if (request.senderId !== user.id) throw new AppError('Chỉ người gửi mới có thể hủy lời mời', 403);
    status = 'CANCELLED';
  } else {
    if (request.recipientId !== user.id) throw new AppError('Chỉ người nhận mới có thể phản hồi lời mời', 403);
    status = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
  }
  const updated = await prisma.roommateRequest.update({ where: { id }, data: { status, activePairKey: null, respondedAt: new Date() }, include: requestInclude });
  if (action !== 'CANCEL') await createNotification(request.senderId, { type: 'ROOMMATE_REQUEST_RESPONSE', title: 'Lời mời ở ghép đã được phản hồi', content: `${user.fullName} đã ${status === 'ACCEPTED' ? 'chấp nhận' : 'từ chối'} lời mời ở ghép.`, linkUrl: '/roommate-requests/sent' });
  return serializeRequest(updated);
}
module.exports = { send, list, listAll, act };
