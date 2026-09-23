const { z } = require('zod');
const targetTypes = ['ROOM', 'USER', 'ROOMMATE_POST', 'REVIEW'];
const reportSchema = z.object({
  targetType: z.enum(targetTypes), targetUserId: z.coerce.number().int().positive().nullable().optional(), roomId: z.coerce.number().int().positive().nullable().optional(), roommatePostId: z.coerce.number().int().positive().nullable().optional(), reviewId: z.coerce.number().int().positive().nullable().optional(),
  reason: z.enum(['WRONG_INFO', 'WRONG_IMAGE', 'WRONG_PRICE', 'ROOM_UNAVAILABLE', 'WRONG_ADDRESS', 'SCAM', 'FAKE_ACCOUNT', 'INAPPROPRIATE_CONTENT', 'OTHER']), description: z.string().trim().max(5000).nullable().optional(), evidenceUrl: z.string().trim().url().max(500).nullable().optional()
}).strict().superRefine((value, context) => { const map = { ROOM: 'roomId', USER: 'targetUserId', ROOMMATE_POST: 'roommatePostId', REVIEW: 'reviewId' }; const expected = map[value.targetType]; const supplied = ['targetUserId', 'roomId', 'roommatePostId', 'reviewId'].filter((field) => value[field] !== undefined && value[field] !== null); if (supplied.length !== 1 || supplied[0] !== expected) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Loại báo cáo phải khớp chính xác với một đối tượng báo cáo' }); });
const reportListSchema = z.object({ status: z.enum(['PENDING', 'PROCESSING', 'RESOLVED', 'REJECTED']).optional(), page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional() }).strip();
const reportActionSchema = z.object({ status: z.enum(['PROCESSING', 'RESOLVED', 'REJECTED']), adminNote: z.string().trim().min(1).max(5000) }).strict();
module.exports = { reportSchema, reportListSchema, reportActionSchema };
