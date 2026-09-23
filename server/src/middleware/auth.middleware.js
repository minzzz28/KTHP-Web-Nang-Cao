const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const { getEnv } = require('../config/env');
const { AppError } = require('../utils/AppError');
const { asyncHandler } = require('../utils/asyncHandler');

function extractBearerToken(header = '') {
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) throw new AppError('Vui lòng đăng nhập để tiếp tục', 401);

  let payload;
  try {
    payload = jwt.verify(token, getEnv().JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new AppError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn', 401);
  }
  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw new AppError('Phiên đăng nhập không hợp lệ', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, role: true, status: true, fullName: true }
  });
  if (!user || user.status !== 'ACTIVE') {
    throw new AppError('Tài khoản không còn hoạt động', 401);
  }

  req.user = user;
  next();
});

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện thao tác này', 403));
    }
    return next();
  };
}

module.exports = { authenticate, authorize, extractBearerToken };
