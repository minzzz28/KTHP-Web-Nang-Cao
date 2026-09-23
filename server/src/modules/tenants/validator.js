const { z } = require('zod');

const bool = z.preprocess((value) => value === true || value === 'true' || value === '1', z.boolean().optional());
const tenantListSchema = z.object({
  candidates: bool,
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
}).strip();

module.exports = { tenantListSchema };
