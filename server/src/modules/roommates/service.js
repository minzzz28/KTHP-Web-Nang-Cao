const { prisma } = require('../../lib/prisma');
const { AppError } = require('../../utils/AppError');
const { roommateMatchScore } = require('../../services/calculation.service');
const { parseId, listOptions, listData } = require('../_shared/common');
const { publicUserSelect, universitySelect } = require('../_shared/selects');

const profileInclude = { student: { select: publicUserSelect }, university: { select: universitySelect } };

function normalizeInput(input) {
  const { cohort, minBudget, maxBudget, smoking, wakeTime, desiredRoommates, ...data } = input;
  return {
    ...data,
    ...(data.academicYear === undefined && cohort !== undefined ? { academicYear: cohort } : {}),
    ...(data.budgetMin === undefined && minBudget !== undefined ? { budgetMin: minBudget } : {}),
    ...(data.budgetMax === undefined && maxBudget !== undefined ? { budgetMax: maxBudget } : {}),
    ...(data.isSmoking === undefined && smoking !== undefined ? { isSmoking: smoking } : {}),
    ...(data.wakeUpTime === undefined && wakeTime !== undefined ? { wakeUpTime: wakeTime } : {}),
    ...(data.preferredRoommates === undefined && desiredRoommates !== undefined ? { preferredRoommates: desiredRoommates } : {})
  };
}

function serializeProfile(profile) {
  if (!profile) return profile;
  const student = profile.student ? { ...profile.student, user: profile.student } : null;
  return {
    ...profile,
    student,
    user: profile.student || null,
    cohort: profile.academicYear,
    minBudget: profile.budgetMin,
    maxBudget: profile.budgetMax,
    smoking: profile.isSmoking,
    wakeTime: profile.wakeUpTime,
    desiredRoommates: profile.preferredRoommates
  };
}

function ensureStudent(user) {
  if (user.role !== 'STUDENT') throw new AppError('Chỉ sinh viên có thể sử dụng chức năng ở ghép', 403);
}

async function mine(user) {
  ensureStudent(user);
  const profile = await prisma.roommateProfile.findUnique({ where: { studentId: user.id }, include: profileInclude });
  return serializeProfile(profile);
}

async function upsert(user, input) {
  ensureStudent(user);
  const data = normalizeInput(input);
  if (data.universityId) {
    const university = await prisma.university.findUnique({ where: { id: data.universityId }, select: { id: true } });
    if (!university) throw new AppError('Không tìm thấy trường đại học', 404);
  }
  const profile = await prisma.roommateProfile.upsert({ where: { studentId: user.id }, update: data, create: { ...data, studentId: user.id }, include: profileInclude });
  return serializeProfile(profile);
}

async function update(user, input) {
  ensureStudent(user);
  const data = normalizeInput(input);
  const existing = await prisma.roommateProfile.findUnique({ where: { studentId: user.id }, select: { id: true, budgetMin: true, budgetMax: true } });
  const budgetMin = data.budgetMin ?? (existing ? Number(existing.budgetMin) : 0);
  const budgetMax = data.budgetMax ?? (existing ? Number(existing.budgetMax) : 10000000);
  if (budgetMin > budgetMax) throw new AppError('Ngân sách tối đa phải lớn hơn hoặc bằng tối thiểu', 422);
  if (data.universityId) {
    const university = await prisma.university.findUnique({ where: { id: data.universityId }, select: { id: true } });
    if (!university) throw new AppError('Không tìm thấy trường đại học', 404);
  }
  const profile = existing
    ? await prisma.roommateProfile.update({ where: { studentId: user.id }, data, include: profileInclude })
    : await prisma.roommateProfile.create({
      data: {
        ...data,
        studentId: user.id,
        gender: data.gender || 'PREFER_NOT_TO_SAY',
        budgetMin,
        budgetMax,
        isVisible: data.isVisible ?? true
      },
      include: profileInclude
    });
  return serializeProfile(profile);
}

async function list(query, viewer) {
  const pagination = listOptions(query);
  const where = { isVisible: true };
  if (viewer?.role === 'STUDENT') where.studentId = { not: viewer.id };
  if (query.universityId) where.universityId = query.universityId;
  if (query.gender) where.gender = query.gender;
  if (query.preferredArea) where.preferredArea = { contains: query.preferredArea };
  if (query.isSmoking !== undefined) where.isSmoking = query.isSmoking === 'true';
  if (query.hasPets !== undefined) where.hasPets = query.hasPets === 'true';
  if (query.socialPreference) where.socialPreference = query.socialPreference;
  if (query.minBudget !== undefined || query.maxBudget !== undefined) {
    where.AND = [
      ...(query.minBudget !== undefined ? [{ budgetMax: { gte: query.minBudget } }] : []),
      ...(query.maxBudget !== undefined ? [{ budgetMin: { lte: query.maxBudget } }] : [])
    ];
  }
  const [items, total] = await prisma.$transaction([
    prisma.roommateProfile.findMany({ where, include: profileInclude, orderBy: { updatedAt: 'desc' }, skip: pagination.skip, take: pagination.limit }),
    prisma.roommateProfile.count({ where })
  ]);
  return listData(items.map(serializeProfile), pagination, total);
}

async function match(user, value) {
  ensureStudent(user);
  const studentId = parseId(value, 'studentId');
  if (studentId === user.id) throw new AppError('Không thể so khớp với chính bạn', 422);
  const [current, candidate] = await Promise.all([
    prisma.roommateProfile.findUnique({ where: { studentId: user.id }, include: profileInclude }),
    prisma.roommateProfile.findUnique({ where: { studentId }, include: profileInclude })
  ]);
  if (!current) throw new AppError('Hãy tạo hồ sơ ở ghép trước', 404);
  if (!candidate || !candidate.isVisible) throw new AppError('Không tìm thấy hồ sơ ở ghép', 404);
  return { candidate: serializeProfile(candidate), ...roommateMatchScore(current, candidate) };
}

module.exports = { mine, upsert, update, list, match };
