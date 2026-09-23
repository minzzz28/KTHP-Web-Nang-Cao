const { z } = require('zod');
const favoriteSchema = z.object({ roomId: z.coerce.number().int().positive() }).strict();
const listFavoritesSchema = z.object({ page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional() }).strip();
module.exports = { favoriteSchema, listFavoritesSchema };
