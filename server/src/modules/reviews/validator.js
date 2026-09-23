const { z } = require('zod');
const rating = z.coerce.number().int().min(1).max(5);
const mineBoolean = z.preprocess((value) => value === true || value === 'true' || value === '1', z.boolean().optional());
const reviewBaseSchema = z.object({ contractId: z.coerce.number().int().positive(), rating, roomQuality: rating, security: rating, cleanliness: rating, wifiQuality: rating, utilityPrice: rating, listingAccuracy: rating, landlordAttitude: rating, comment: z.string().trim().max(5000).nullable().optional() }).strict();
const reviewSchema = reviewBaseSchema; const reviewUpdateSchema = reviewBaseSchema.omit({ contractId: true }).partial().refine((value) => Object.keys(value).length > 0, 'Cần có dữ liệu cập nhật');
const reviewListSchema = z.object({ roomId: z.coerce.number().int().positive().optional(), landlordId: z.coerce.number().int().positive().optional(), mine: mineBoolean, page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional() }).strip();
const moderationSchema = z.object({ status: z.enum(['PUBLISHED', 'HIDDEN']), moderationNote: z.string().trim().max(5000).nullable().optional() }).strict();
module.exports = { reviewSchema, reviewUpdateSchema, reviewListSchema, moderationSchema };
