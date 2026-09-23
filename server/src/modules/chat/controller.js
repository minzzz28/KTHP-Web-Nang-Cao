const { asyncHandler } = require('../../utils/asyncHandler'); const { success, created } = require('../../utils/response'); const service = require('./service');
const list = asyncHandler(async (req, res) => success(res, await service.list(req.user, req.query)));
const show = asyncHandler(async (req, res) => success(res, { data: await service.get(req.user, req.params.id) }));
const createDirect = asyncHandler(async (req, res) => created(res, { message: 'Đã mở cuộc trò chuyện', data: await service.createDirect(req.user, req.body) }));
const messages = asyncHandler(async (req, res) => success(res, await service.listMessages(req.user, req.params.id, req.query)));
const send = asyncHandler(async (req, res) => { const result = await service.send(req.user, req.params.id, req.body); const io = req.app.get('io'); if (io) { io.to(`conversation:${result.conversationId}`).emit('message:new', result.message); result.recipientIds.forEach((recipientId) => io.to(`user:${recipientId}`).emit('conversation:updated', { conversationId: result.conversationId })); } return created(res, { message: 'Đã gửi tin nhắn', data: result.message }); });
const edit = asyncHandler(async (req, res) => success(res, { message: 'Đã sửa tin nhắn', data: await service.edit(req.user, req.params.id, req.params.messageId, req.body) }));
const remove = asyncHandler(async (req, res) => { await service.remove(req.user, req.params.id, req.params.messageId); return success(res, { message: 'Đã xóa tin nhắn' }); });
module.exports = { list, show, createDirect, messages, send, edit, remove };
