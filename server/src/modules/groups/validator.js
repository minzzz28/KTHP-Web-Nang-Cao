const { z } = require('zod');
const money = z.coerce.number().finite().positive().max(9999999999);
const groupSchema = z.object({
  roomId: z.coerce.number().int().positive().nullable().optional(), name: z.string().trim().min(2).max(191),
  maxMembers: z.coerce.number().int().min(2).max(20), budgetPerPerson: money, moveInDate: z.coerce.date().nullable().optional(),
  rules: z.string().trim().max(10000).nullable().optional(), zaloGroupUrl: z.string().trim().url().max(500).nullable().optional(), telegramGroupUrl: z.string().trim().url().max(500).nullable().optional()
}).strict();
const groupUpdateSchema = groupSchema.omit({ roomId: true }).partial().refine((value) => Object.keys(value).length > 0, 'Cần có dữ liệu cập nhật');
const mineBoolean = z.preprocess((value) => value === true || value === 'true' || value === '1', z.boolean().optional());
const listGroupsSchema = z.object({ status: z.enum(['OPEN', 'FULL', 'CLOSED', 'CANCELLED']).optional(), roomId: z.coerce.number().int().positive().optional(), mine: mineBoolean, page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional() }).strip();
const memberSchema = z.object({ studentId: z.coerce.number().int().positive() }).strict();
const transferSchema = z.object({ studentId: z.coerce.number().int().positive() }).strict();
module.exports = { groupSchema, groupUpdateSchema, listGroupsSchema, memberSchema, transferSchema };
