import { UnprocessableEntityException } from '@nestjs/common';
import { mkdirSync } from 'node:fs';
import { open, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

type StorageFactory = (options: {
  destination: string;
  filename: (_request: unknown, file: { mimetype: string }, callback: (error: Error | null, filename: string) => void) => void;
}) => unknown;

const multer = require('multer') as { diskStorage: StorageFactory };

export type UploadedRoomImage = {
  filename: string;
  mimetype: string;
  size: number;
};

const extensionByMimeType = Object.freeze({
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
});
const allowedMimeTypes = new Set(Object.keys(extensionByMimeType));
const uploadFileNamePattern = /^[0-9a-f-]{36}\.(?:jpg|png|webp)$/i;

// This resolves to server/uploads from both src/ and a compiled dist/ build.
export const roomImageUploadDirectory = resolve(__dirname, '../../../uploads');
mkdirSync(roomImageUploadDirectory, { recursive: true });

function generatedFileName(mimeType: string): string {
  const extension = extensionByMimeType[mimeType as keyof typeof extensionByMimeType];
  if (!extension) throw new UnprocessableEntityException('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP');
  return `${randomUUID()}${extension}`;
}

export const roomImageUploadOptions: MulterOptions = {
  storage: multer.diskStorage({
    destination: roomImageUploadDirectory,
    filename: (_request, file, callback) => callback(null, generatedFileName(file.mimetype)),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 8, fields: 0 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new UnprocessableEntityException('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP'), false);
      return;
    }
    callback(null, true);
  },
};

function safeUploadPath(file: UploadedRoomImage): string | null {
  if (!uploadFileNamePattern.test(file.filename)) return null;
  const filePath = resolve(roomImageUploadDirectory, file.filename);
  return filePath.startsWith(`${roomImageUploadDirectory}\\`) || filePath.startsWith(`${roomImageUploadDirectory}/`)
    ? filePath
    : null;
}

export function uploadedRoomImageUrl(file: UploadedRoomImage): string {
  if (!safeUploadPath(file)) throw new UnprocessableEntityException('Tệp ảnh không hợp lệ');
  return `/uploads/${encodeURIComponent(file.filename)}`;
}

export async function validateUploadedRoomImages(files: UploadedRoomImage[]): Promise<void> {
  for (const file of files) {
    const filePath = safeUploadPath(file);
    if (!filePath || !allowedMimeTypes.has(file.mimetype)) {
      throw new UnprocessableEntityException('Tệp ảnh không hợp lệ');
    }
    const handle = await open(filePath, 'r');
    try {
      const header = Buffer.alloc(12);
      const { bytesRead } = await handle.read(header, 0, header.length, 0);
      if (!hasExpectedImageSignature(file.mimetype, header.subarray(0, bytesRead))) {
        throw new UnprocessableEntityException('Nội dung tệp không khớp với định dạng ảnh đã khai báo');
      }
    } finally {
      await handle.close();
    }
  }
}

export async function removeUploadedRoomImages(files: UploadedRoomImage[]): Promise<void> {
  await Promise.all(files.map((file) => {
    const filePath = safeUploadPath(file);
    return filePath ? unlink(filePath).catch(() => undefined) : Promise.resolve();
  }));
}

export function hasExpectedImageSignature(mimeType: string, header: Buffer): boolean {
  if (mimeType === 'image/jpeg') return header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (mimeType === 'image/png') return header.length >= 8 && header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return mimeType === 'image/webp' && header.length >= 12 && header.subarray(0, 4).equals(Buffer.from('RIFF')) && header.subarray(8, 12).equals(Buffer.from('WEBP'));
}
