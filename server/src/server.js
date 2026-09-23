const http = require('http');
const { createApp } = require('./app');
const { prisma } = require('./lib/prisma');
const { getEnv } = require('./config/env');
const { initSocket } = require('./socket');

async function start() {
  const env = getEnv();
  await prisma.$connect();

  const app = createApp();
  const httpServer = http.createServer(app);
  const io = initSocket(httpServer);
  app.set('io', io);

  const close = async () => {
    io.close();
    await prisma.$disconnect();
    httpServer.close(() => process.exit(0));
  };
  process.once('SIGTERM', close);
  process.once('SIGINT', close);

  httpServer.listen(env.PORT, () => {
    console.log('API đang chạy tại http://localhost:' + env.PORT);
  });
}

start().catch(async (error) => {
  console.error('Không thể khởi động server', error.message);
  await prisma.$disconnect();
  process.exit(1);
});
