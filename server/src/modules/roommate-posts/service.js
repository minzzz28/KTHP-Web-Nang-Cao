const { prisma } = require('../../lib/prisma');
const { AppError } = require('../../utils/AppError');
const { parseId, listOptions, listData } = require('../_shared/common');
const { publicUserSelect } = require('../_shared/selects');

const postInclude = { student: { select: publicUserSelect }, room: { select: { id: true, name: true, code: true, price: true, status: true, property: { select: { name: true, address: true } } } } };
function ensureStudent(user) { if (user.role !== 'STUDENT') throw new AppError('Chỉ sinh viên có thể quản lý bài tìm người ở ghép', 403); }

async function ensureRoom(roomId) {
  if (!roomId) return;
  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { id: true, status: true } });
  if (!room || room.status === 'HIDDEN') throw new AppError('Không tìm thấy phòng được chọn', 404);
}
async function list(query, user) {
  const pagination = listOptions(query);
  const where = { status: query.status || 'OPEN' };
  if (query.keyword) where.OR = [
    { title: { contains: query.keyword } },
    { content: { contains: query.keyword } },
    { area: { contains: query.keyword } },
    { student: { is: { fullName: { contains: query.keyword } } } }
  ];
  if (query.area) where.area = { contains: query.area };
  if (query.preferredGender) where.preferredGender = query.preferredGender;
  if (query.minBudget !== undefined || query.maxBudget !== undefined) where.budgetPerPerson = { ...(query.minBudget !== undefined ? { gte: query.minBudget } : {}), ...(query.maxBudget !== undefined ? { lte: query.maxBudget } : {}) };
  const [items, total] = await prisma.$transaction([
    prisma.roommatePost.findMany({ where, include: postInclude, orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.limit }),
    prisma.roommatePost.count({ where })
  ]);
  return listData(items, pagination, total);
}
async function mine(user, query) {
  ensureStudent(user);
  const pagination = listOptions(query);
  const where = { studentId: user.id };
  const [items, total] = await prisma.$transaction([
    prisma.roommatePost.findMany({ where, include: postInclude, orderBy: { updatedAt: 'desc' }, skip: pagination.skip, take: pagination.limit }),
    prisma.roommatePost.count({ where })
  ]);
  return listData(items, pagination, total);
}
async function get(value) {
  const post = await prisma.roommatePost.findUnique({ where: { id: parseId(value, 'postId') }, include: postInclude });
  if (!post || post.status === 'ARCHIVED') throw new AppError('Không tìm thấy bài đăng', 404);
  return post;
}
async function create(user, input) {
  ensureStudent(user); await ensureRoom(input.roomId);
  return prisma.roommatePost.create({ data: { ...input, studentId: user.id }, include: postInclude });
}
async function assertOwner(user, value) {
  ensureStudent(user);
  const post = await prisma.roommatePost.findUnique({ where: { id: parseId(value, 'postId') }, select: { id: true, studentId: true } });
  if (!post) throw new AppError('Không tìm thấy bài đăng', 404);
  if (post.studentId !== user.id) throw new AppError('Bạn không có quyền thao tác bài đăng này', 403);
  return post;
}
async function update(user, value, input) { const post = await assertOwner(user, value); await ensureRoom(input.roomId); return prisma.roommatePost.update({ where: { id: post.id }, data: input, include: postInclude }); }
async function close(user, value) { const post = await assertOwner(user, value); return prisma.roommatePost.update({ where: { id: post.id }, data: { status: 'CLOSED' }, include: postInclude }); }
async function remove(user, value) { const post = await assertOwner(user, value); return prisma.roommatePost.update({ where: { id: post.id }, data: { status: 'ARCHIVED' }, include: postInclude }); }
module.exports = { list, mine, get, create, update, close, remove };
