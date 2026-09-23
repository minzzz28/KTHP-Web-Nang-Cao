const { z } = require('zod');
const money = z.coerce.number().finite().positive().max(9999999999);
const postStatus = z.preprocess((value) => typeof value === 'string' && value.trim().toUpperCase() === 'ACTIVE' ? 'OPEN' : value, z.enum(['OPEN', 'CLOSED', 'ARCHIVED']));
const mineBoolean = z.preprocess((value) => value === true || value === 'true' || value === '1', z.boolean().optional());
const postBaseSchema = z.object({
  roomId: z.coerce.number().int().positive().nullable().optional(),
  title: z.string().trim().min(5).max(191), content: z.string().trim().min(10).max(10000),
  area: z.string().trim().max(255).nullable().optional(), budgetPerPerson: money,
  neededPeople: z.coerce.number().int().min(1).max(20), preferredGender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).nullable().optional(),
  moveInDate: z.coerce.date().nullable().optional(), requirements: z.string().trim().max(5000).nullable().optional()
}).strict();
const postSchema = postBaseSchema;
const postUpdateSchema = postBaseSchema.partial().refine((value) => Object.keys(value).length > 0, 'Cần có dữ liệu cập nhật');
const postListSchema = z.object({
  status: postStatus.optional(), area: z.string().trim().max(255).optional(), keyword: z.string().trim().max(191).optional(), mine: mineBoolean,
  minBudget: money.optional(), maxBudget: money.optional(), preferredGender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional()
}).strip().superRefine((value, context) => {
  if (value.minBudget !== undefined && value.maxBudget !== undefined && value.minBudget > value.maxBudget) context.addIssue({ code: z.ZodIssueCode.custom, path: ['maxBudget'], message: 'Ngân sách tối đa không hợp lệ' });
});
module.exports = { postSchema, postUpdateSchema, postListSchema };
