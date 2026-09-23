const { PrismaClient } = require('@prisma/client');

const prisma = global.__studentRentalPrisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  global.__studentRentalPrisma = prisma;
}

module.exports = { prisma };
