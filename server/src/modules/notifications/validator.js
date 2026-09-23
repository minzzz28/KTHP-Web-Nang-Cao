const { z } = require('zod');
const listSchema = z.object({ isRead: z.enum(['true', 'false']).optional(), page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional() }).strip();
const markReadSchema = z.object({ isRead: z.literal(true).optional() }).strip();
module.exports = { listSchema, markReadSchema };
