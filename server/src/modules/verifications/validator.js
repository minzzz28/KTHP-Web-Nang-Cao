const { z } = require('zod');
const documentUrlSchema = z.string().trim().url().max(500).refine((value) => /^https?:\/\//i.test(value), 'Liên kết tài liệu phải dùng http hoặc https');
const requestSchema = z.object({ type: z.enum(['STUDENT', 'LANDLORD']), studentCode: z.string().trim().min(1).max(50).nullable().optional(), schoolEmail: z.string().trim().toLowerCase().email().max(191).nullable().optional(), documentUrl: documentUrlSchema.nullable().optional(), note: z.string().trim().max(5000).nullable().optional() }).strict();
const listSchema = z.object({ status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'UNVERIFIED']).optional(), type: z.enum(['STUDENT', 'LANDLORD']).optional(), page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional() }).strip();
const reviewSchema = z.object({ status: z.enum(['VERIFIED', 'REJECTED']), reviewerNote: z.string().trim().max(5000).nullable().optional() }).strict();
module.exports = { requestSchema, listSchema, reviewSchema };
