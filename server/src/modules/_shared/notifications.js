const { prisma } = require('../../lib/prisma');

async function createNotification(userId, { type, title, content, linkUrl = null }) {
  return prisma.notification.create({
    data: { userId, type, title, content, linkUrl }
  });
}

module.exports = { createNotification };
