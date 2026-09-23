const { prisma } = require('../../lib/prisma');
const { AppError } = require('../../utils/AppError');
const { parseId, directPairKey, listOptions, listData } = require('../_shared/common');
const { publicUserSelect } = require('../_shared/selects');
const { createNotification } = require('../_shared/notifications');

const messageInclude = { sender: { select: publicUserSelect } };
const conversationInclude = {
  rentalGroup: { select: { id: true, name: true, status: true } },
  members: { where: { leftAt: null }, include: { user: { select: publicUserSelect } }, orderBy: { joinedAt: 'asc' } },
  messages: { where: { isDeleted: false }, include: messageInclude, orderBy: { sentAt: 'desc' }, take: 1 }
};
async function membership(userId, value) {
  const conversationId = parseId(value, 'conversationId');
  const member = await prisma.conversationMember.findFirst({ where: { conversationId, userId, leftAt: null } });
  if (!member) throw new AppError('Bạn không thuộc cuộc trò chuyện này', 403);
  return member;
}
async function list(user, query) {
  const pagination = listOptions(query); const where = { members: { some: { userId: user.id, leftAt: null } } };
  const [items, total] = await prisma.$transaction([prisma.conversation.findMany({ where, include: conversationInclude, orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }], skip: pagination.skip, take: pagination.limit }), prisma.conversation.count({ where })]);
  return listData(items.map((item) => ({ ...item, lastMessage: item.messages[0] || null, messages: undefined })), pagination, total);
}
async function get(user, value) { await membership(user.id, value); const conversation = await prisma.conversation.findUnique({ where: { id: parseId(value, 'conversationId') }, include: conversationInclude }); if (!conversation) throw new AppError('Không tìm thấy cuộc trò chuyện', 404); return { ...conversation, lastMessage: conversation.messages[0] || null, messages: undefined }; }
async function createDirect(user, input) {
  if (input.participantId === user.id) throw new AppError('Không thể tạo cuộc trò chuyện với chính bạn', 422);
  const participant = await prisma.user.findUnique({ where: { id: input.participantId }, select: { id: true, role: true, status: true } });
  if (!participant || participant.status !== 'ACTIVE' || participant.role === 'ADMIN' || user.role === 'ADMIN') throw new AppError('Người nhận không thể trò chuyện', 422);
  const pairKey = directPairKey(user.id, participant.id);
  const existing = await prisma.conversation.findUnique({ where: { directPairKey: pairKey }, include: conversationInclude });
  if (existing) return existing;
  return prisma.conversation.create({ data: { type: 'DIRECT', directPairKey: pairKey, members: { create: [{ userId: user.id }, { userId: participant.id }] } }, include: conversationInclude });
}
async function listMessages(user, value, query) {
  const member = await membership(user.id, value); const pagination = listOptions(query); const where = { conversationId: member.conversationId, isDeleted: false };
  const [items, total] = await prisma.$transaction([prisma.message.findMany({ where, include: messageInclude, orderBy: { sentAt: 'desc' }, skip: pagination.skip, take: pagination.limit }), prisma.message.count({ where }), prisma.conversationMember.update({ where: { id: member.id }, data: { lastReadAt: new Date() } })]);
  return listData(items.reverse(), pagination, total);
}
async function send(user, value, input) {
  const member = await membership(user.id, value);
  const result = await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({ data: { conversationId: member.conversationId, senderId: user.id, content: input.content }, include: messageInclude });
    await tx.conversation.update({ where: { id: member.conversationId }, data: { lastMessageAt: message.sentAt } });
    const recipients = await tx.conversationMember.findMany({ where: { conversationId: member.conversationId, userId: { not: user.id }, leftAt: null }, select: { userId: true } });
    return { message, recipientIds: recipients.map((entry) => entry.userId) };
  });
  await Promise.all(result.recipientIds.map((recipientId) => createNotification(recipientId, { type: 'MESSAGE', title: 'Bạn có tin nhắn mới', content: `${user.fullName} đã gửi cho bạn một tin nhắn.`, linkUrl: `/conversations/${member.conversationId}` })));
  return { ...result, conversationId: member.conversationId };
}
async function edit(user, conversationValue, messageValue, input) {
  const member = await membership(user.id, conversationValue); const messageId = parseId(messageValue, 'messageId'); const message = await prisma.message.findUnique({ where: { id: messageId }, select: { id: true, senderId: true, conversationId: true, isDeleted: true } });
  if (!message || message.conversationId !== member.conversationId || message.isDeleted) throw new AppError('Không tìm thấy tin nhắn', 404); if (message.senderId !== user.id) throw new AppError('Chỉ người gửi có thể sửa tin nhắn', 403);
  return prisma.message.update({ where: { id: messageId }, data: { content: input.content, editedAt: new Date() }, include: messageInclude });
}
async function remove(user, conversationValue, messageValue) {
  const member = await membership(user.id, conversationValue); const messageId = parseId(messageValue, 'messageId'); const message = await prisma.message.findUnique({ where: { id: messageId }, select: { id: true, senderId: true, conversationId: true, isDeleted: true } });
  if (!message || message.conversationId !== member.conversationId || message.isDeleted) throw new AppError('Không tìm thấy tin nhắn', 404); if (message.senderId !== user.id) throw new AppError('Chỉ người gửi có thể xóa tin nhắn', 403);
  await prisma.message.update({ where: { id: messageId }, data: { isDeleted: true, content: 'Tin nhắn đã được xóa', editedAt: new Date() } });
}
module.exports = { list, get, createDirect, listMessages, send, edit, remove };
