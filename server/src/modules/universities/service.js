const { prisma } = require('../../lib/prisma');
const { AppError } = require('../../utils/AppError');
const { parseId, listOptions, listData } = require('../_shared/common');
const { universitySelect } = require('../_shared/selects');

async function list(query) {
  const pagination = listOptions(query);
  const where = query.q ? { OR: [{ name: { contains: query.q } }, { code: { contains: query.q } }, { address: { contains: query.q } }] } : {};
  const [items, total] = await prisma.$transaction([
    prisma.university.findMany({ where, select: universitySelect, orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }], skip: pagination.skip, take: pagination.limit }),
    prisma.university.count({ where })
  ]);
  return listData(items, pagination, total);
}

async function get(value) {
  const university = await prisma.university.findUnique({ where: { id: parseId(value, 'universityId') }, select: universitySelect });
  if (!university) throw new AppError('Không tìm thấy trường đại học', 404);
  return university;
}

async function create(input) {
  return prisma.$transaction(async (tx) => {
    const isFirstUniversity = (await tx.university.count()) === 0;
    // A freshly initialized catalogue must always have a center campus.
    // After that, callers may explicitly choose whether a new university is primary.
    const isPrimary = isFirstUniversity || input.isPrimary === true;
    if (isPrimary) await tx.university.updateMany({ data: { isPrimary: false } });
    return tx.university.create({ data: { ...input, isPrimary }, select: universitySelect });
  });
}

async function update(value, input) {
  const id = parseId(value, 'universityId');
  const current = await get(id);
  return prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.university.updateMany({ where: { id: { not: id } }, data: { isPrimary: false } });
    }
    if (current.isPrimary && input.isPrimary === false) {
      const replacementCount = await tx.university.count({ where: { id: { not: id }, isPrimary: true } });
      if (!replacementCount) throw new AppError('Cần chọn một trường khác làm trung tâm trước khi bỏ ưu tiên trường này', 422);
    }
    return tx.university.update({ where: { id }, data: input, select: universitySelect });
  });
}

async function remove(value) {
  const university = await get(value);
  const id = university.id;
  if (university.isPrimary) throw new AppError('Không thể xóa trường đang là trung tâm hệ thống', 422);
  const usage = await prisma.studentProfile.count({ where: { universityId: id } }) + await prisma.roommateProfile.count({ where: { universityId: id } });
  if (usage) throw new AppError('Không thể xóa trường đang được hồ sơ sử dụng', 409);
  await prisma.university.delete({ where: { id } });
}

module.exports = { list, get, create, update, remove };
