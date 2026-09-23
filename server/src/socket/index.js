const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { prisma } = require('../lib/prisma');
const { getEnv } = require('../config/env');
const chatService = require('../modules/chat/service');

const joinSchema = z.object({ conversationId: z.coerce.number().int().positive() });
const messageSchema = z.object({
  conversationId: z.coerce.number().int().positive(),
  content: z.string().trim().min(1).max(2000)
});

function initSocket(httpServer) {
  const env = getEnv();
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('Unauthorized'));
      const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
      const userId = Number(payload.sub);
      if (!Number.isSafeInteger(userId) || userId < 1) return next(new Error('Unauthorized'));
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, status: true }
      });
      if (!user || user.status !== 'ACTIVE') return next(new Error('Unauthorized'));
      socket.userId = user.id;
      socket.chatUser = { id: user.id, fullName: user.fullName };
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join('user:' + socket.userId);

    socket.on('conversation:join', async (payload, callback) => {
      const parsed = joinSchema.safeParse(payload);
      if (!parsed.success) return callback && callback({ ok: false, message: 'Dữ liệu không hợp lệ' });
      try {
        const membership = await prisma.conversationMember.findFirst({
          where: {
            conversationId: parsed.data.conversationId,
            userId: socket.userId,
            leftAt: null
          },
          select: { id: true }
        });
        if (!membership) return callback && callback({ ok: false, message: 'Bạn không thuộc cuộc trò chuyện này' });
        socket.join('conversation:' + parsed.data.conversationId);
        return callback && callback({ ok: true });
      } catch {
        return callback && callback({ ok: false, message: 'Không thể tham gia cuộc trò chuyện' });
      }
    });

    socket.on('message:send', async (payload, callback) => {
      const parsed = messageSchema.safeParse(payload);
      if (!parsed.success) return callback && callback({ ok: false, message: 'Tin nhắn không hợp lệ' });
      try {
        const result = await chatService.send(socket.chatUser, parsed.data.conversationId, { content: parsed.data.content });
        io.to('conversation:' + result.conversationId).emit('message:new', result.message);
        result.recipientIds.forEach((recipientId) => {
          io.to('user:' + recipientId).emit('conversation:updated', { conversationId: result.conversationId });
        });
        return callback && callback({ ok: true, message: result.message });
      } catch {
        return callback && callback({ ok: false, message: 'Không thể gửi tin nhắn' });
      }
    });
  });

  return io;
}

module.exports = { initSocket };
