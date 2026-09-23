const { prisma } = require('../../lib/prisma');
const { AppError } = require('../../utils/AppError');
const { parseId, listOptions, listData } = require('../_shared/common');
const { publicUserSelect } = require('../_shared/selects');
const { createNotification } = require('../_shared/notifications');

const groupInclude = {
  creator: { select: publicUserSelect }, room: { select: { id: true, name: true, code: true, price: true, status: true, property: { select: { name: true, address: true } } } },
  members: { where: { leftAt: null }, include: { student: { select: publicUserSelect } }, orderBy: { joinedAt: 'asc' } },
  conversation: { select: { id: true } }
};
function ensureStudent(user) { if (user.role !== 'STUDENT') throw new AppError('Chỉ sinh viên có thể quản lý nhóm thuê trọ', 403); }
async function activeMember(groupId, userId) { return prisma.groupMember.findFirst({ where: { groupId, studentId: userId, leftAt: null } }); }
async function get(value) { const group = await prisma.rentalGroup.findUnique({ where: { id: parseId(value, 'groupId') }, include: groupInclude }); if (!group) throw new AppError('Không tìm thấy nhóm thuê trọ', 404); return group; }
async function list(query) {
  const pagination = listOptions(query); const where = { ...(query.status ? { status: query.status } : { status: { in: ['OPEN', 'FULL'] } }), ...(query.roomId ? { roomId: query.roomId } : {}) };
  const [items, total] = await prisma.$transaction([prisma.rentalGroup.findMany({ where, include: groupInclude, orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.limit }), prisma.rentalGroup.count({ where })]);
  return listData(items, pagination, total);
}
async function mine(user, query) {
  ensureStudent(user); const pagination = listOptions(query); const where = { members: { some: { studentId: user.id, leftAt: null } } };
  const [items, total] = await prisma.$transaction([prisma.rentalGroup.findMany({ where, include: groupInclude, orderBy: { updatedAt: 'desc' }, skip: pagination.skip, take: pagination.limit }), prisma.rentalGroup.count({ where })]);
  return listData(items, pagination, total);
}
async function create(user, input) {
  ensureStudent(user);
  if (input.roomId) { const room = await prisma.room.findUnique({ where: { id: input.roomId }, select: { id: true, status: true } }); if (!room || room.status === 'HIDDEN') throw new AppError('Không tìm thấy phòng được chọn', 404); }
  return prisma.$transaction(async (tx) => {
    const group = await tx.rentalGroup.create({ data: { ...input, creatorId: user.id, members: { create: { studentId: user.id, role: 'LEADER' } } } });
    await tx.conversation.create({ data: { type: 'GROUP', title: group.name, rentalGroupId: group.id, members: { create: { userId: user.id } } } });
    return tx.rentalGroup.findUnique({ where: { id: group.id }, include: groupInclude });
  });
}
async function assertLeader(user, value) {
  ensureStudent(user); const groupId = parseId(value, 'groupId'); const member = await activeMember(groupId, user.id); if (!member) throw new AppError('Bạn không thuộc nhóm này', 403); if (member.role !== 'LEADER') throw new AppError('Chỉ trưởng nhóm có thể thực hiện thao tác này', 403); const group = await get(groupId); return { group, member };
}
async function update(user, value, input) {
  const { group } = await assertLeader(user, value); const activeCount = group.members.length;
  if (input.maxMembers !== undefined && input.maxMembers < activeCount) throw new AppError('Số thành viên tối đa không thể nhỏ hơn số thành viên hiện tại', 422);
  return prisma.rentalGroup.update({ where: { id: group.id }, data: input, include: groupInclude });
}
async function addMember(user, value, input) {
  const { group } = await assertLeader(user, value);
  if (group.status !== 'OPEN') throw new AppError('Nhóm hiện không nhận thành viên mới', 409);
  if (group.members.length >= group.maxMembers) throw new AppError('Nhóm đã đủ thành viên', 409);
  const candidate = await prisma.user.findUnique({ where: { id: input.studentId }, select: { id: true, role: true, status: true, fullName: true } });
  if (!candidate || candidate.role !== 'STUDENT' || candidate.status !== 'ACTIVE') throw new AppError('Sinh viên không hợp lệ', 422);
  const existing = await prisma.groupMember.findUnique({ where: { groupId_studentId: { groupId: group.id, studentId: candidate.id } }, select: { id: true, leftAt: true } });
  if (existing && !existing.leftAt) throw new AppError('Sinh viên này đã là thành viên nhóm', 409);
  const membership = existing ? await prisma.groupMember.update({ where: { id: existing.id }, data: { leftAt: null, joinedAt: new Date(), role: 'MEMBER' } }) : await prisma.groupMember.create({ data: { groupId: group.id, studentId: candidate.id } });
  if (group.conversation) {
    const conversationMember = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: group.conversation.id, userId: candidate.id } }, select: { id: true } });
    if (conversationMember) await prisma.conversationMember.update({ where: { id: conversationMember.id }, data: { leftAt: null, joinedAt: new Date() } });
    else await prisma.conversationMember.create({ data: { conversationId: group.conversation.id, userId: candidate.id } });
  }
  const nowFull = group.members.length + 1 >= group.maxMembers;
  if (nowFull) await prisma.rentalGroup.update({ where: { id: group.id }, data: { status: 'FULL' } });
  await createNotification(candidate.id, { type: 'ROOMMATE_REQUEST_RESPONSE', title: 'Bạn đã được thêm vào nhóm thuê trọ', content: `Bạn đã được thêm vào nhóm ${group.name}.`, linkUrl: `/groups/${group.id}` });
  return membership;
}
async function leave(user, value) {
  ensureStudent(user); const group = await get(value); const member = await activeMember(group.id, user.id); if (!member) throw new AppError('Bạn không thuộc nhóm này', 403); if (member.role === 'LEADER') throw new AppError('Trưởng nhóm cần chuyển quyền trước khi rời nhóm', 422);
  await prisma.$transaction(async (tx) => { await tx.groupMember.update({ where: { id: member.id }, data: { leftAt: new Date() } }); if (group.conversation) await tx.conversationMember.updateMany({ where: { conversationId: group.conversation.id, userId: user.id }, data: { leftAt: new Date() } }); if (group.status === 'FULL') await tx.rentalGroup.update({ where: { id: group.id }, data: { status: 'OPEN' } }); });
}
async function removeMember(user, value, studentValue) {
  const { group } = await assertLeader(user, value); const studentId = parseId(studentValue, 'studentId'); if (studentId === user.id) throw new AppError('Trưởng nhóm không thể tự xóa mình', 422); const member = await activeMember(group.id, studentId); if (!member) throw new AppError('Sinh viên không thuộc nhóm', 404);
  await prisma.$transaction(async (tx) => { await tx.groupMember.update({ where: { id: member.id }, data: { leftAt: new Date() } }); if (group.conversation) await tx.conversationMember.updateMany({ where: { conversationId: group.conversation.id, userId: studentId }, data: { leftAt: new Date() } }); if (group.status === 'FULL') await tx.rentalGroup.update({ where: { id: group.id }, data: { status: 'OPEN' } }); });
}
async function transferLeadership(user, value, input) {
  const { group } = await assertLeader(user, value); const target = await activeMember(group.id, input.studentId); if (!target) throw new AppError('Người được chọn không thuộc nhóm', 422); if (target.studentId === user.id) throw new AppError('Người này đã là trưởng nhóm', 422);
  await prisma.$transaction([prisma.groupMember.updateMany({ where: { groupId: group.id, role: 'LEADER', leftAt: null }, data: { role: 'MEMBER' } }), prisma.groupMember.update({ where: { id: target.id }, data: { role: 'LEADER' } }), prisma.rentalGroup.update({ where: { id: group.id }, data: { creatorId: target.studentId } })]);
  return get(group.id);
}
module.exports = { list, mine, get, create, update, addMember, leave, removeMember, transferLeadership };
