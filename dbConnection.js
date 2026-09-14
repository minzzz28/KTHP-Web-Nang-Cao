const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../../../.env')
});

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function connectDatabase() {
    try {
        await prisma.$connect();

        const result = await prisma.$queryRaw`
            SELECT DATABASE() AS database_name
        `;

        console.log('====================================');
        console.log('KẾT NỐI CƠ SỞ DỮ LIỆU THÀNH CÔNG');
        console.log('Hệ quản trị CSDL: MySQL');
        console.log('Database:', result[0].database_name);
        console.log('Trạng thái: Connected');
        console.log('====================================');

        return prisma;
    } catch (error) {
        console.error('KẾT NỐI CƠ SỞ DỮ LIỆU THẤT BẠI');
        console.error(error);
        throw error;
    }
}

async function disconnectDatabase() {
    await prisma.$disconnect();
}

if (require.main === module) {
    connectDatabase()
        .then(async () => {
            await disconnectDatabase();
            process.exit(0);
        })
        .catch(async () => {
            await disconnectDatabase();
            process.exit(1);
        });
}

module.exports = {
    prisma,
    connectDatabase,
    disconnectDatabase
};