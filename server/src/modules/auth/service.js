const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../lib/prisma');
const { getEnv } = require('../../config/env');
const { AppError } = require('../../utils/AppError');
const { publicUser } = require('../../utils/serializers');

const SALT_ROUNDS = 12;
const INVALID_CREDENTIALS_MESSAGE = 'Tên đăng nhập/email hoặc mật khẩu không hợp lệ';
// Keep the failed-login path expensive even when no account is found, so the
// response time does not reveal whether an identifier belongs to an account.
const DUMMY_PASSWORD_HASH = '$2b$12$ERTdvdpInr4yAfyMpzaJseBDNOzce9Lh8/uj4xWppq48K7kdPpZOa';
const userWithProfiles = {
  studentProfile: { include: { university: { select: { id: true, code: true, name: true } } } },
  landlordProfile: true
};

function signToken(user) {
  const env = getEnv();
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: String(user.id),
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN
  });
}

function serializeUser(user) {
  return publicUser(user);
}

async function register(input) {
  const [existingUsername, existingEmail] = await Promise.all([
    input.username
      ? prisma.user.findUnique({ where: { username: input.username }, select: { id: true } })
      : null,
    input.email
      ? prisma.user.findUnique({ where: { email: input.email }, select: { id: true } })
      : null
  ]);
  if (existingUsername || existingEmail) throw new AppError('Tên đăng nhập hoặc email đã được sử dụng', 409);
  if (input.phone) {
    const phoneOwner = await prisma.user.findUnique({ where: { phone: input.phone }, select: { id: true } });
    if (phoneOwner) throw new AppError('Số điện thoại đã được sử dụng', 409);
  }
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      username: input.username || null,
      email: input.email || null,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone || null,
      role: input.role,
      ...(input.role === 'STUDENT'
        ? { studentProfile: { create: {} } }
        : { landlordProfile: { create: {} } })
    },
    include: userWithProfiles
  });
  return { user: serializeUser(user), accessToken: signToken(user) };
}

async function login(input) {
  const identifier = input.identifier || input.email;
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: identifier },
        { email: identifier }
      ]
    },
    include: userWithProfiles
  });
  const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash || DUMMY_PASSWORD_HASH);
  if (!user || !passwordMatches || user.status !== 'ACTIVE') {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
  }
  return { user: serializeUser(user), accessToken: signToken(user) };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: userWithProfiles });
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);
  return serializeUser(user);
}

async function changePassword(userId, input) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    throw new AppError('Mật khẩu hiện tại không đúng', 422);
  }
  if (input.currentPassword === input.newPassword) {
    throw new AppError('Mật khẩu mới phải khác mật khẩu hiện tại', 422);
  }
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(input.newPassword, SALT_ROUNDS) } });
}

module.exports = { register, login, getMe, changePassword };
