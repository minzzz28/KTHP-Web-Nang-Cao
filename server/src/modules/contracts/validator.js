const { z } = require('zod');
const money = z.coerce.number().finite().nonnegative().max(9999999999);
const tenantSchema = z.object({ studentId: z.coerce.number().int().positive(), isPrimaryTenant: z.boolean().default(false), moveInDate: z.coerce.date().nullable().optional(), moveOutDate: z.coerce.date().nullable().optional() }).strict();
const contractSchema = z.object({
  contractNumber: z.string().trim().min(4).max(80).optional(), roomId: z.coerce.number().int().positive(), startDate: z.coerce.date(), endDate: z.coerce.date(), rent: money.positive(), deposit: money, terms: z.string().trim().min(10).max(30000),
  tenants: z.array(tenantSchema).min(1).max(20).optional(), studentIds: z.array(z.coerce.number().int().positive()).min(1).max(20).optional()
}).strict().superRefine((value, context) => {
  if (value.endDate <= value.startDate) context.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Ngày kết thúc phải sau ngày bắt đầu' });
  const tenants = value.tenants || value.studentIds?.map((studentId, index) => ({ studentId, isPrimaryTenant: index === 0 })) || [];
  if (!tenants.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['tenants'], message: 'Cần có ít nhất một người thuê' });
  const ids = tenants.map((tenant) => tenant.studentId); if (new Set(ids).size !== ids.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['tenants'], message: 'Không được lặp sinh viên trong hợp đồng' }); if (tenants.filter((tenant) => tenant.isPrimaryTenant).length > 1) context.addIssue({ code: z.ZodIssueCode.custom, path: ['tenants'], message: 'Chỉ được có một người thuê chính' });
}).transform((value) => {
  const { studentIds, ...data } = value;
  return { ...data, tenants: data.tenants || studentIds.map((studentId, index) => ({ studentId, isPrimaryTenant: index === 0 })) };
});
const contractActionSchema = z.object({ status: z.enum(['ACTIVE', 'TERMINATED', 'EXPIRED']) }).strict();
const contractListSchema = z.object({ status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']).optional(), page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional() }).strip();
module.exports = { contractSchema, contractActionSchema, contractListSchema };
