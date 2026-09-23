/*
 * Opt-in real-DB Socket.IO coverage. This uses an ephemeral HTTP server so the
 * REST controller and Socket.IO server share the same `io` instance.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'mysql://test:test@localhost:3306/test';
process.env.JWT_SECRET ||= 'test-secret-that-is-long-enough-for-jwt-validation';
process.env.CLIENT_URL ||= 'http://localhost:5173';

const http = require('http');
const request = require('supertest');
const { io: createSocketClient } = require('socket.io-client');
const { prisma } = require('./lib/prisma');
const { createApp } = require('./app');
const { initSocket } = require('./socket');

const describeDatabase = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;

function listen(server) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(0, '127.0.0.1');
  });
}

function connectClient(url, token) {
  return new Promise((resolve, reject) => {
    const socket = createSocketClient(url, {
      auth: { token },
      forceNew: true,
      transports: ['websocket']
    });
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket client did not connect in time'));
    }, 4000);
    socket.once('connect', () => {
      clearTimeout(timeout);
      resolve(socket);
    });
    socket.once('connect_error', (error) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(error);
    });
  });
}

function waitForConversationUpdate(socket, conversationId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off('conversation:updated', onUpdate);
      reject(new Error('Recipient did not receive conversation:updated in time'));
    }, 4000);
    const onUpdate = (payload) => {
      if (payload?.conversationId !== conversationId) return;
      clearTimeout(timeout);
      socket.off('conversation:updated', onUpdate);
      resolve(payload);
    };
    socket.on('conversation:updated', onUpdate);
  });
}

describeDatabase('Socket.IO REST message integration', () => {
  jest.setTimeout(15000);

  const conversationTitle = `IT-SOCKET-${Date.now().toString(36)}-${process.pid}`;
  let app;
  let httpServer;
  let io;
  let baseUrl;
  let sender;
  let recipient;
  let senderToken;
  let recipientToken;
  let recipientSocket;

  async function cleanupConversation() {
    const conversations = await prisma.conversation.findMany({
      where: { title: conversationTitle },
      select: { id: true }
    });
    const conversationIds = conversations.map((conversation) => conversation.id);
    const notificationLinks = conversationIds.map((conversationId) => `/conversations/${conversationId}`);

    await prisma.$transaction(async (tx) => {
      if (notificationLinks.length) {
        await tx.notification.deleteMany({
          where: { userId: recipient?.id, linkUrl: { in: notificationLinks } }
        });
      }
      if (conversationIds.length) {
        await tx.message.deleteMany({ where: { conversationId: { in: conversationIds } } });
        await tx.conversationMember.deleteMany({ where: { conversationId: { in: conversationIds } } });
        await tx.conversation.deleteMany({ where: { id: { in: conversationIds } } });
      }
    });

    expect(await prisma.conversation.count({ where: { title: conversationTitle } })).toBe(0);
    if (notificationLinks.length) {
      expect(await prisma.notification.count({
        where: { userId: recipient?.id, linkUrl: { in: notificationLinks } }
      })).toBe(0);
    }
  }

  beforeAll(async () => {
    app = createApp();
    httpServer = http.createServer(app);
    io = initSocket(httpServer);
    app.set('io', io);
    baseUrl = await listen(httpServer);

    const [senderLogin, recipientLogin] = await Promise.all([
      request(baseUrl).post('/api/auth/login').send({ email: 'chutro@gmail.com', password: '123' }),
      request(baseUrl).post('/api/auth/login').send({ email: 'linh.nguyen@gmail.com', password: '123' })
    ]);
    expect(senderLogin.status).toBe(200);
    expect(recipientLogin.status).toBe(200);
    senderToken = senderLogin.body.data.accessToken;
    recipientToken = recipientLogin.body.data.accessToken;
    sender = senderLogin.body.data.user;
    recipient = recipientLogin.body.data.user;
  });

  afterEach(async () => {
    await cleanupConversation();
  });

  afterAll(async () => {
    recipientSocket?.disconnect();
    if (io) await io.close();
  });

  test('notifies a recipient through their user room when a sender posts a REST message without joining the conversation room', async () => {
    const conversation = await prisma.conversation.create({
      data: {
        type: 'GROUP',
        title: conversationTitle,
        members: { create: [{ userId: sender.id }, { userId: recipient.id }] }
      },
      select: { id: true }
    });
    const conversationId = conversation.id;

    recipientSocket = await connectClient(baseUrl, recipientToken);
    const receivedMessages = [];
    recipientSocket.on('message:new', (payload) => receivedMessages.push(payload));
    const updated = waitForConversationUpdate(recipientSocket, conversationId);

    const messageResponse = await request(baseUrl)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ content: 'Tin nhắn Socket.IO chỉ dành cho kiểm thử tích hợp.' });

    expect(messageResponse.status).toBe(201);
    expect(messageResponse.body).toMatchObject({
      success: true,
      data: { conversationId, senderId: sender.id }
    });
    await expect(updated).resolves.toEqual({ conversationId });
    // The test never emits `conversation:join`; user-room delivery must still work.
    expect(receivedMessages).toEqual([]);
  });
});
