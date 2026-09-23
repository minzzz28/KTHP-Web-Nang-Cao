const { z } = require('zod');
const money = z.coerce.number().finite().nonnegative().max(9999999999);
const invoiceSchema = z.object({
  contractId: z.coerce.number().int().positive(), periodStart: z.coerce.date(), periodEnd: z.coerce.date(), dueDate: z.coerce.date(),
  electricityStart: money.default(0), electricityEnd: money.default(0), electricityUnitPrice: money.default(0), waterStart: money.default(0), waterEnd: money.default(0), waterUnitPrice: money.default(0),
  rentAmount: money.optional(), internetAmount: money.default(0), parkingAmount: money.default(0), serviceAmount: money.default(0), otherAmount: money.default(0)
}).strict().superRefine((value, context) => { if (value.periodEnd < value.periodStart) context.addIssue({ code: z.ZodIssueCode.custom, path: ['periodEnd'], message: 'Kỳ hóa đơn không hợp lệ' }); if (value.dueDate < value.periodStart) context.addIssue({ code: z.ZodIssueCode.custom, path: ['dueDate'], message: 'Hạn thanh toán không hợp lệ' }); if (value.electricityEnd < value.electricityStart) context.addIssue({ code: z.ZodIssueCode.custom, path: ['electricityEnd'], message: 'Chỉ số điện cuối không thể nhỏ hơn đầu' }); if (value.waterEnd < value.waterStart) context.addIssue({ code: z.ZodIssueCode.custom, path: ['waterEnd'], message: 'Chỉ số nước cuối không thể nhỏ hơn đầu' }); });
const invoiceActionSchema = z.object({ status: z.enum(['PAID', 'CANCELLED']) }).strict();
const invoiceListSchema = z.object({ status: z.enum(['UNPAID', 'PAID', 'OVERDUE', 'CANCELLED']).optional(), page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional() }).strip();
module.exports = { invoiceSchema, invoiceActionSchema, invoiceListSchema };
