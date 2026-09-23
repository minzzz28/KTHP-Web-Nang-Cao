const { z } = require('zod');

const coordinate = z.coerce.number().finite();
const listUniversitiesSchema = z.object({
  q: z.string().trim().max(191).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional()
}).strip();
const universitySchema = z.object({
  code: z.string().trim().toUpperCase().min(2).max(30),
  name: z.string().trim().min(2).max(191),
  address: z.string().trim().min(2).max(500),
  latitude: coordinate.min(-90).max(90),
  longitude: coordinate.min(-180).max(180),
  website: z.string().trim().url().max(500).nullable().optional(),
  isPrimary: z.boolean().optional()
}).strict();
const universityUpdateSchema = universitySchema.partial().refine((value) => Object.keys(value).length > 0, 'Cần có dữ liệu cập nhật');

module.exports = { listUniversitiesSchema, universitySchema, universityUpdateSchema };
