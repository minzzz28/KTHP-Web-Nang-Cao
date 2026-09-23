const { z } = require('zod');
const requestSchema = z.object({
  recipientId: z.coerce.number().int().positive(), postId: z.coerce.number().int().positive().nullable().optional(), roomId: z.coerce.number().int().positive().nullable().optional(),
  message: z.string().trim().max(2000).nullable().optional()
}).strict();
const listSchema = z.object({ status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']).optional(), page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional() }).strip();
const responseSchema = z.object({ action: z.enum(['ACCEPT', 'REJECT', 'CANCEL']) }).strict();
const compatibilityUpdateSchema = z.object({ status: z.enum(['ACCEPTED', 'REJECTED', 'CANCELLED']) }).strict().transform((value) => ({
  action: value.status === 'ACCEPTED' ? 'ACCEPT' : value.status === 'REJECTED' ? 'REJECT' : 'CANCEL'
}));
module.exports = { requestSchema, listSchema, responseSchema, compatibilityUpdateSchema };
