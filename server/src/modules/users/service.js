const { prisma } = require('../../lib/prisma');
const { AppError } = require('../../utils/AppError');
const { publicUser } = require('../../utils/serializers');
const { parseId } = require('../_shared/common');
const { universitySelect } = require('../_shared/selects');

const ownUserInclude = {
  studentProfile: { include: { university: { select: universitySelect } } },
  landlordProfile: true
};

async function getOwnProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: ownUserInclude });
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);
  return publicUser(user);
}

async function getPublicProfile(value) {
  const id = parseId(value, 'userId');
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, username: true, fullName: true, avatarUrl: true, role: true, verificationStatus: true, createdAt: true,
      studentProfile: { select: { faculty: true, academicYear: true, hometown: true, bio: true, university: { select: universitySelect } } },
      landlordProfile: { select: { businessName: true, contactAddress: true, bio: true } }
    }
  });
  if (!user || user.role === 'ADMIN') throw new AppError('Không tìm thấy người dùng', 404);
  return user;
}

async function updateAccount(userId, input) {
  if (input.phone) {
    const owner = await prisma.user.findUnique({ where: { phone: input.phone }, select: { id: true } });
    if (owner && owner.id !== userId) throw new AppError('Số điện thoại đã được sử dụng', 409);
  }
  const user = await prisma.user.update({ where: { id: userId }, data: input, include: ownUserInclude });
  return publicUser(user);
}

async function updateProfile(user, input) {
  if (user.role === 'STUDENT') {
    if (input.universityId) {
      const university = await prisma.university.findUnique({ where: { id: input.universityId }, select: { id: true } });
      if (!university) throw new AppError('Không tìm thấy trường đại học', 404);
    }
    if (input.studentCode) {
      const owner = await prisma.studentProfile.findUnique({ where: { studentCode: input.studentCode }, select: { userId: true } });
      if (owner && owner.userId !== user.id) throw new AppError('Mã sinh viên đã được sử dụng', 409);
    }
    if (input.schoolEmail) {
      const owner = await prisma.studentProfile.findUnique({ where: { schoolEmail: input.schoolEmail }, select: { userId: true } });
      if (owner && owner.userId !== user.id) throw new AppError('Email trường đã được sử dụng', 409);
    }
    await prisma.studentProfile.upsert({ where: { userId: user.id }, update: input, create: { userId: user.id, ...input } });
  } else if (user.role === 'LANDLORD') {
    if (input.nationalId) {
      const owner = await prisma.landlordProfile.findUnique({ where: { nationalId: input.nationalId }, select: { userId: true } });
      if (owner && owner.userId !== user.id) throw new AppError('CCCD đã được sử dụng', 409);
    }
    await prisma.landlordProfile.upsert({ where: { userId: user.id }, update: input, create: { userId: user.id, ...input } });
  } else {
    throw new AppError('Tài khoản quản trị không có hồ sơ nghiệp vụ', 403);
  }
  return getOwnProfile(user.id);
}

module.exports = { getOwnProfile, getPublicProfile, updateAccount, updateProfile };
