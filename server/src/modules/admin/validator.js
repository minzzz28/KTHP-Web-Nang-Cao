const { z } = require('zod');
const userListSchema = z.object({ role: z.enum(['STUDENT', 'LANDLORD', 'ADMIN']).optional(), status: z.enum(['ACTIVE', 'DISABLED']).optional(), q: z.string().trim().max(191).optional(), page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional() }).strip();
const userStatusSchema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) }).strict();
const roomStatusSchema = z.object({ status: z.enum(['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'HIDDEN']) }).strict();
const propertyVerificationSchema = z.object({ status: z.enum(['VERIFIED', 'REJECTED']) }).strict();
module.exports = { userListSchema, userStatusSchema, roomStatusSchema, propertyVerificationSchema };
