const { z } = require('zod');

const coordinate = z.coerce.number().finite();
const optionalText = (max) => z.string().trim().max(max).nullable().optional();
const geocodeAddressSchema = z.object({
  address: z.string().trim().min(5).max(250).refine((value) => !/^[a-z][a-z0-9+.-]*:\/\//i.test(value), 'Địa chỉ không được là URL')
}).strict();
const propertySchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(191).optional(),
  name: z.string().trim().min(2).max(191),
  description: optionalText(10000),
  address: z.string().trim().min(5).max(500),
  ward: optionalText(120),
  district: optionalText(120),
  city: z.string().trim().min(2).max(120).default('Hà Nội'),
  latitude: coordinate.min(-90).max(90),
  longitude: coordinate.min(-180).max(180),
  rules: optionalText(10000),
  openingHours: optionalText(120),
  contactPhone: z.string().trim().min(8).max(30).nullable().optional()
}).strict();
const propertyUpdateSchema = propertySchema.partial().refine((value) => Object.keys(value).length > 0, 'Cần có dữ liệu cập nhật');
const listPropertiesSchema = z.object({
  city: z.string().trim().max(120).optional(),
  district: z.string().trim().max(120).optional(),
  landlordId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional()
}).strip();
const nearbyPlaceSchema = z.object({
  name: z.string().trim().min(2).max(191),
  category: z.enum(['MARKET', 'SUPERMARKET', 'PHARMACY', 'HOSPITAL', 'BUS_STOP', 'RESTAURANT', 'CONVENIENCE_STORE', 'SCHOOL']),
  address: z.string().trim().max(500).nullable().optional(),
  latitude: coordinate.min(-90).max(90),
  longitude: coordinate.min(-180).max(180),
  distanceMeters: z.coerce.number().int().nonnegative().max(100000).nullable().optional()
}).strict();
module.exports = { propertySchema, propertyUpdateSchema, listPropertiesSchema, nearbyPlaceSchema, geocodeAddressSchema };
