const publicUserSelect = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  verificationStatus: true
};

const universitySelect = {
  id: true,
  code: true,
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  website: true,
  isPrimary: true
};

const propertySelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  address: true,
  ward: true,
  district: true,
  city: true,
  latitude: true,
  longitude: true,
  rules: true,
  openingHours: true,
  contactPhone: true,
  verificationStatus: true,
  createdAt: true,
  updatedAt: true,
  landlord: { select: publicUserSelect }
};

const roomInclude = {
  property: { select: propertySelect },
  images: { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }] },
  amenities: { include: { amenity: true } },
  reviews: {
    where: { status: 'PUBLISHED' },
    select: { id: true, rating: true, comment: true, createdAt: true, student: { select: publicUserSelect } },
    orderBy: { createdAt: 'desc' }
  }
};

const roomListInclude = {
  property: { select: propertySelect },
  images: { where: { isCover: true }, take: 1, orderBy: { sortOrder: 'asc' } },
  amenities: { include: { amenity: true } },
  reviews: { where: { status: 'PUBLISHED' }, select: { rating: true } }
};

module.exports = { publicUserSelect, universitySelect, propertySelect, roomInclude, roomListInclude };
