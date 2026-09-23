const { z } = require('zod');
const directSchema = z.object({ participantId: z.coerce.number().int().positive() }).strict();
const directCompatibilitySchema = z.object({
  participantId: z.coerce.number().int().positive().optional(),
  recipientId: z.coerce.number().int().positive().optional(),
  participantIds: z.array(z.coerce.number().int().positive()).length(1).optional()
}).strip().superRefine((value, context) => {
  if (!value.participantId && !value.recipientId && !value.participantIds) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['participantId'], message: 'Cần chọn đúng một người nhận' });
  }
}).transform((value) => ({ participantId: value.participantId || value.recipientId || value.participantIds[0] }));
const messageSchema = z.object({ content: z.string().trim().min(1).max(2000) }).strict();
const messageUpdateSchema = messageSchema;
const listSchema = z.object({ page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional() }).strip();
module.exports = { directSchema, directCompatibilitySchema, messageSchema, messageUpdateSchema, listSchema };
