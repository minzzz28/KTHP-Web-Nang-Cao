const { z } = require('zod');

const money = z.coerce.number().finite().nonnegative().max(9999999999);
const coordinateId = z.coerce.number().int().positive();
const roomTypes = ['PRIVATE_ROOM', 'SHARED_ROOM', 'STUDIO', 'APARTMENT', 'DORMITORY'];
const roomStatuses = ['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'HIDDEN'];
const roomType = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toUpperCase().replace(/[ -]/g, '_');
  return ({ ROOM: 'PRIVATE_ROOM', PRIVATE: 'PRIVATE_ROOM', SHARED: 'SHARED_ROOM' })[normalized] || normalized;
}, z.enum(roomTypes));
const queryBoolean = z.preprocess((value) => {
  if (value === true || value === false) return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return value;
}, z.boolean().optional());
const roomSort = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toUpperCase().replace(/-/g, '_');
  return ({ PRICE_ASC: 'PRICE_ASC', PRICE_DESC: 'PRICE_DESC', RATING_DESC: 'RATING_DESC', NEWEST: 'NEWEST', DISTANCE_ASC: 'DISTANCE_ASC', MATCH_DESC: 'MATCH_DESC', PRICELOW: 'PRICE_ASC', PRICE_LOW: 'PRICE_ASC', PRICEHIGH: 'PRICE_DESC', PRICE_HIGH: 'PRICE_DESC', RATING: 'RATING_DESC', DISTANCE: 'DISTANCE_ASC', NEAREST: 'DISTANCE_ASC', MATCH: 'MATCH_DESC' })[normalized] || normalized;
}, z.enum(['PRICE_ASC', 'PRICE_DESC', 'RATING_DESC', 'NEWEST', 'DISTANCE_ASC', 'MATCH_DESC']).default('NEWEST'));
const imageSchema = z.object({
  url: z.string().trim().url().max(500),
  altText: z.string().trim().max(255).nullable().optional(),
  isCover: z.boolean().optional()
}).strict();

const roomBaseSchema = z.object({
  propertyId: coordinateId,
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(2).max(191),
  description: z.string().trim().max(10000).nullable().optional(),
  price: money.positive(),
  deposit: money,
  area: z.coerce.number().finite().positive().max(10000),
  capacity: z.coerce.number().int().min(1).max(100),
  availableSlots: z.coerce.number().int().min(0).max(100),
  type: roomType,
  status: z.enum(roomStatuses).default('AVAILABLE'),
  electricityPrice: money,
  waterPrice: money,
  internetFee: money,
  parkingFee: money,
  serviceFee: money.default(0),
  locationScore: z.coerce.number().finite().min(0).max(10).nullable().optional(),
  amenityIds: z.array(coordinateId).max(30).optional(),
  images: z.array(imageSchema).max(8).optional(),
  // Compatibility with the landlord form: URL-only images are normalized in the service.
  imageUrls: z.array(z.string().trim().url().max(500)).max(8).optional()
}).strict();

const roomSchema = roomBaseSchema.superRefine((value, context) => {
  if (value.availableSlots > value.capacity) context.addIssue({ code: z.ZodIssueCode.custom, path: ['availableSlots'], message: 'Số chỗ trống không thể lớn hơn sức chứa' });
  if (value.images && value.images.filter((image) => image.isCover).length > 1) context.addIssue({ code: z.ZodIssueCode.custom, path: ['images'], message: 'Chỉ được chọn một ảnh đại diện' });
});

const roomUpdateSchema = roomBaseSchema.omit({ propertyId: true }).partial().superRefine((value, context) => {
  if (Object.keys(value).length === 0) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Cần có dữ liệu cập nhật' });
  if (value.capacity !== undefined && value.availableSlots !== undefined && value.availableSlots > value.capacity) context.addIssue({ code: z.ZodIssueCode.custom, path: ['availableSlots'], message: 'Số chỗ trống không thể lớn hơn sức chứa' });
  if (value.images && value.images.filter((image) => image.isCover).length > 1) context.addIssue({ code: z.ZodIssueCode.custom, path: ['images'], message: 'Chỉ được chọn một ảnh đại diện' });
});

const roomListQueryBaseSchema = z.object({
  q: z.string().trim().max(191).optional(), keyword: z.string().trim().max(191).optional(), search: z.string().trim().max(191).optional(),
  minPrice: money.optional(), maxPrice: money.optional(), priceMin: money.optional(), priceMax: money.optional(), min_price: money.optional(), max_price: money.optional(),
  minArea: z.coerce.number().finite().positive().optional(), maxArea: z.coerce.number().finite().positive().optional(), areaMin: z.coerce.number().finite().positive().optional(), areaMax: z.coerce.number().finite().positive().optional(),
  type: roomType.optional(), types: z.string().trim().max(200).optional(),
  minCapacity: z.coerce.number().int().positive().max(100).optional(), capacity: z.coerce.number().int().positive().max(100).optional(),
  availableOnly: queryBoolean, available: queryBoolean, featured: queryBoolean, mine: queryBoolean,
  amenityIds: z.string().trim().max(300).optional(), amenities: z.string().trim().max(300).optional(), amenitySlugs: z.string().trim().max(500).optional(),
  city: z.string().trim().max(120).optional(), district: z.string().trim().max(120).optional(), area: z.string().trim().max(120).optional(), location: z.string().trim().max(120).optional(),
  sort: roomSort,
  universityId: coordinateId.optional(), radiusKm: z.coerce.number().finite().positive().max(50).optional(), radius: z.coerce.number().finite().positive().max(50).optional(),
  page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional()
}).strip();
const roomListQuerySchema = roomListQueryBaseSchema.superRefine((value, context) => {
  if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) context.addIssue({ code: z.ZodIssueCode.custom, path: ['maxPrice'], message: 'Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu' });
  if (value.minArea !== undefined && value.maxArea !== undefined && value.minArea > value.maxArea) context.addIssue({ code: z.ZodIssueCode.custom, path: ['maxArea'], message: 'Diện tích tối đa phải lớn hơn hoặc bằng diện tích tối thiểu' });
}).transform((value) => ({
  ...value,
  q: value.q || value.keyword || value.search,
  minPrice: value.minPrice ?? value.priceMin ?? value.min_price,
  maxPrice: value.maxPrice ?? value.priceMax ?? value.max_price,
  minArea: value.minArea ?? value.areaMin,
  maxArea: value.maxArea ?? value.areaMax,
  minCapacity: value.minCapacity ?? value.capacity,
  availableOnly: value.availableOnly ?? value.available,
  district: value.district || value.area || value.location,
  radiusKm: value.radiusKm ?? value.radius,
  amenityIds: value.amenityIds || value.amenities,
  sort: value.featured && value.sort === 'NEWEST' ? 'RATING_DESC' : value.sort
}));

const roomDetailQuerySchema = z.object({ universityId: coordinateId.optional() }).strip();
const recommendationShape = {
  budgetMin: money.optional(), budgetMax: money.optional(), minPrice: money.optional(), maxPrice: money.optional(),
  preferredArea: z.coerce.number().finite().positive().optional(), minArea: z.coerce.number().finite().positive().optional(),
  amenityIds: z.array(coordinateId).max(30).optional(), amenitySlugs: z.string().trim().max(500).optional(),
  maxDistanceKm: z.coerce.number().finite().positive().max(50).optional(), radiusKm: z.coerce.number().finite().positive().max(50).optional(),
  universityId: coordinateId.optional(), page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(50).optional()
};
function recommendationValidator(mode) {
  return z.object(recommendationShape)[mode]().superRefine((value, context) => {
    const min = value.budgetMin ?? value.minPrice;
    const max = value.budgetMax ?? value.maxPrice;
    if (min !== undefined && max !== undefined && min > max) context.addIssue({ code: z.ZodIssueCode.custom, path: ['budgetMax'], message: 'Ngân sách tối đa phải lớn hơn hoặc bằng tối thiểu' });
  }).transform((value) => ({
    ...value,
    budgetMin: value.budgetMin ?? value.minPrice,
    budgetMax: value.budgetMax ?? value.maxPrice,
    preferredArea: value.preferredArea ?? value.minArea,
    maxDistanceKm: value.maxDistanceKm ?? value.radiusKm
  }));
}
const recommendationSchema = recommendationValidator('strict');
const recommendationQuerySchema = recommendationValidator('strip');
const compareQuerySchema = z.object({ ids: z.string().trim().min(1).max(100), universityId: coordinateId.optional() }).strip();

module.exports = { roomSchema, roomUpdateSchema, roomListQuerySchema, roomDetailQuerySchema, recommendationSchema, recommendationQuerySchema, compareQuerySchema };
