const path = require('path');
const crypto = require('crypto');
const fs = require('fs/promises');
const multer = require('multer');
const { AppError } = require('../utils/AppError');

const uploadDir = path.resolve(__dirname, '../../uploads');
const extensionByMimeType = Object.freeze({
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
});
const allowedMimeTypes = new Set(Object.keys(extensionByMimeType));

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, callback) => {
    callback(null, crypto.randomUUID() + extensionByMimeType[file.mimetype]);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new AppError('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP', 422));
    }
    return callback(null, true);
  }
});

async function removeUploadedFiles(files) {
  const paths = (Array.isArray(files) ? files : [])
    .map((file) => file?.path)
    .filter(Boolean);
  await Promise.all([...new Set(paths)].map((filePath) => fs.unlink(filePath).catch(() => undefined)));
}

function uploadRoomImages(req, res, next) {
  upload.array('images', 8)(req, res, (error) => {
    if (!error) return next();
    const normalized = error instanceof multer.MulterError
      ? new AppError(
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Mỗi ảnh có dung lượng tối đa 5 MB'
          : 'Chỉ được tải lên tối đa 8 ảnh cho mỗi lần',
        error.code === 'LIMIT_FILE_SIZE' ? 413 : 422
      )
      : error;
    return removeUploadedFiles(req.files).finally(() => next(normalized));
  });
}

module.exports = { uploadRoomImages, uploadDir, removeUploadedFiles };
