const { Prisma } = require('@prisma/client');
const { AppError } = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError('Không tìm thấy endpoint ' + req.method + ' ' + req.originalUrl, 404));
}

function errorHandler(error, req, res, next) {
  let normalized = error;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') normalized = new AppError('Dữ liệu đã tồn tại', 409);
    if (error.code === 'P2025') normalized = new AppError('Không tìm thấy dữ liệu cần thao tác', 404);
  }
  if (!(normalized instanceof AppError)) {
    normalized = new AppError('Đã xảy ra lỗi máy chủ', 500);
  }

  const response = {
    success: false,
    message: normalized.message
  };
  if (normalized.details) response.errors = normalized.details;
  if (process.env.NODE_ENV === 'development' && !normalized.isOperational) response.debug = normalized.stack;
  return res.status(normalized.statusCode).json(response);
}

module.exports = { notFound, errorHandler };
