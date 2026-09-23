const { prisma } = require('../../lib/prisma');
const { AppError } = require('../../utils/AppError');
const { publicRoom } = require('../../utils/serializers');
const { parseId, listOptions, listData } = require('../_shared/common');
const { roomListInclude } = require('../_shared/selects');

function assertStudent(user) {
  if (user.role !== 'STUDENT') throw new AppError('Chỉ sinh viên có thể quản lý phòng yêu thích', 403);
}

async function list(user, query) {
  assertStudent(user);
  const pagination = listOptions(query);
  const where = { studentId: user.id };
  const [favorites, total] = await prisma.$transaction([
    prisma.favorite.findMany({ where, include: { room: { include: roomListInclude } }, orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.limit }),
    prisma.favorite.count({ where })
  ]);
  return listData(favorites.map((favorite) => ({ ...favorite, room: publicRoom(favorite.room) })), pagination, total);
}

async function add(user, input) {
  assertStudent(user);
  const room = await prisma.room.findUnique({ where: { id: input.roomId }, select: { id: true, status: true } });
  if (!room || room.status === 'HIDDEN') throw new AppError('Không tìm thấy phòng', 404);
  const existing = await prisma.favorite.findUnique({ where: { studentId_roomId: { studentId: user.id, roomId: room.id } }, select: { id: true } });
  if (existing) throw new AppError('Phòng này đã có trong danh sách yêu thích', 409);
  return prisma.favorite.create({ data: { studentId: user.id, roomId: room.id } });
}

async function remove(user, value) {
  assertStudent(user);
  const roomId = parseId(value, 'roomId');
  const favorite = await prisma.favorite.findUnique({ where: { studentId_roomId: { studentId: user.id, roomId } }, select: { id: true } });
  if (!favorite) throw new AppError('Phòng không có trong danh sách yêu thích', 404);
  await prisma.favorite.delete({ where: { id: favorite.id } });
}

module.exports = { list, add, remove };
