const { z } = require('zod');

const phone = z.string().trim().min(8).max(30).regex(/^[+0-9() .-]+$/).nullable().optional();
const url = z.string().trim().url().max(500).nullable().optional();

const updateAccountSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone,
  avatarUrl: url
}).strict().refine((value) => Object.keys(value).length > 0, 'Cần cung cấp ít nhất một trường để cập nhật');

const updateStudentProfileSchema = z.object({
  studentCode: z.string().trim().min(1).max(50).nullable().optional(),
  universityId: z.coerce.number().int().positive().nullable().optional(),
  schoolEmail: z.string().trim().toLowerCase().email().max(191).nullable().optional(),
  faculty: z.string().trim().max(120).nullable().optional(),
  academicYear: z.string().trim().max(30).nullable().optional(),
  hometown: z.string().trim().max(120).nullable().optional(),
  bio: z.string().trim().max(5000).nullable().optional()
}).strict();

const updateLandlordProfileSchema = z.object({
  businessName: z.string().trim().max(191).nullable().optional(),
  nationalId: z.string().trim().min(6).max(32).nullable().optional(),
  contactAddress: z.string().trim().max(500).nullable().optional(),
  bio: z.string().trim().max(5000).nullable().optional()
}).strict();

module.exports = { updateAccountSchema, updateStudentProfileSchema, updateLandlordProfileSchema };
