const { z } = require('zod');
const money = z.coerce.number().finite().nonnegative().max(9999999999);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ phải có dạng HH:mm').nullable().optional();
const profileBaseSchema = z.object({
  universityId: z.coerce.number().int().positive().nullable().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  hometown: z.string().trim().max(120).nullable().optional(),
  faculty: z.string().trim().max(120).nullable().optional(), academicYear: z.string().trim().max(30).nullable().optional(), cohort: z.string().trim().max(30).nullable().optional(),
  budgetMin: money, budgetMax: money, minBudget: money.optional(), maxBudget: money.optional(),
  preferredArea: z.string().trim().max(255).nullable().optional(), maxDistanceKm: z.coerce.number().finite().positive().max(50).nullable().optional(),
  isSmoking: z.boolean().default(false), smoking: z.boolean().optional(), acceptsSmoking: z.boolean().default(false), hasPets: z.boolean().default(false), acceptsPets: z.boolean().default(false), cooksOften: z.boolean().default(false),
  sleepTime: time, wakeUpTime: time, wakeTime: time,
  cleanlinessLevel: z.coerce.number().int().min(1).max(5).default(3),
  socialPreference: z.enum(['QUIET', 'BALANCED', 'SOCIAL']).default('BALANCED'),
  preferredRoommates: z.coerce.number().int().min(1).max(10).default(1), desiredRoommates: z.coerce.number().int().min(1).max(10).optional(),
  bio: z.string().trim().max(5000).nullable().optional(), isVisible: z.boolean().default(true)
}).strict();
const profileSchema = profileBaseSchema.superRefine((value, context) => {
  if (value.budgetMin > value.budgetMax) context.addIssue({ code: z.ZodIssueCode.custom, path: ['budgetMax'], message: 'Ngân sách tối đa phải lớn hơn hoặc bằng tối thiểu' });
});
const profileUpdateSchema = profileBaseSchema.partial().superRefine((value, context) => {
  if (Object.keys(value).length === 0) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Cần có dữ liệu cập nhật' });
  if (value.budgetMin !== undefined && value.budgetMax !== undefined && value.budgetMin > value.budgetMax) context.addIssue({ code: z.ZodIssueCode.custom, path: ['budgetMax'], message: 'Ngân sách tối đa phải lớn hơn hoặc bằng tối thiểu' });
});
const roommateListSchema = z.object({
  universityId: z.coerce.number().int().positive().optional(), gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  minBudget: money.optional(), maxBudget: money.optional(), preferredArea: z.string().trim().max(255).optional(),
  isSmoking: z.enum(['true', 'false']).optional(), hasPets: z.enum(['true', 'false']).optional(), socialPreference: z.enum(['QUIET', 'BALANCED', 'SOCIAL']).optional(),
  page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional()
}).strip();
module.exports = { profileSchema, profileUpdateSchema, roommateListSchema };
