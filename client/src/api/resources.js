import { api, apiPath, responseData } from './client';

function query(path, params, signal) {
  return api.get(path, { params, signal }).then(responseData);
}

function create(path, body) {
  return api.post(path, body).then(responseData);
}

function update(path, body) {
  return api.patch(path, body).then(responseData);
}

function remove(path) {
  return api.delete(path).then(responseData);
}

const ROOM_SORTS = {
  newest: 'NEWEST',
  price_asc: 'PRICE_ASC',
  price_desc: 'PRICE_DESC',
  nearest: 'DISTANCE_ASC',
  rating_desc: 'RATING_DESC',
  match_desc: 'MATCH_DESC',
};

function csvValue(value) {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null && String(item).trim()).join(',');
  return typeof value === 'string' ? value.trim() : value;
}

function roomQuery(params = {}) {
  if (!params || typeof params !== 'object') return undefined;
  const {
    q,
    keyword,
    district,
    area,
    radiusKm,
    radius,
    minCapacity,
    capacity,
    amenityIds,
    amenitySlugs,
    amenities,
    sort,
    ...rest
  } = params;
  const normalized = { ...rest };
  if (q || keyword) normalized.q = q || keyword;
  if (district || area) normalized.district = district || area;
  if (radiusKm || radius) normalized.radiusKm = radiusKm || radius;
  if (minCapacity || capacity) normalized.minCapacity = minCapacity || capacity;
  if (sort) normalized.sort = ROOM_SORTS[sort] || sort;
  const ids = csvValue(amenityIds);
  const slugs = csvValue(amenitySlugs || amenities);
  if (ids) normalized.amenityIds = ids;
  if (slugs) normalized.amenitySlugs = slugs;
  return normalized;
}

export const authApi = {
  login: (credentials) => create('/auth/login', credentials),
  register: (payload) => create('/auth/register', payload),
  logout: () => create('/auth/logout'),
  me: (signal) => query('/users/me', undefined, signal),
};

export const roomApi = {
  list: (params, signal) => query('/rooms', roomQuery(params), signal),
  search: (params, signal) => query('/rooms/search', roomQuery(params), signal),
  nearby: (params, signal) => query('/rooms/nearby', roomQuery(params), signal),
  mine: (params, signal) => query('/rooms/mine', roomQuery(params), signal),
  recommendations: (params, signal) => api.post('/rooms/recommendations', params || {}, { signal }).then(responseData),
  detail: (id, params, signal) => query(apiPath('/rooms', id), params, signal),
  priceHistory: (id, signal) => query(`${apiPath('/rooms', id)}/price-history`, undefined, signal),
  nearbyPlaces: async (id, signal) => {
    const payload = await query(apiPath('/rooms', id), undefined, signal);
    const room = payload?.data || payload;
    return { items: Array.isArray(room?.nearbyPlaces) ? room.nearbyPlaces : [] };
  },
  reviews: (id, params, signal) => query('/reviews', { ...params, roomId: id }, signal),
  favorite: (roomId) => create('/favorites', { roomId }),
  unfavorite: (roomId) => remove(apiPath('/favorites', roomId)),
};

export const universityApi = {
  list: (params, signal) => query('/universities', params, signal),
};

export const dashboardApi = {
  student: (signal) => query('/students/dashboard', undefined, signal),
  landlord: (signal) => query('/landlords/dashboard', undefined, signal),
  admin: (signal) => query('/admin/dashboard', undefined, signal),
};

export const userApi = {
  me: (signal) => query('/users/me', undefined, signal),
  updateAccount: (body) => update('/users/me', body),
  updateProfile: (body) => update('/users/me/profile', body),
  changePassword: (body) => api.patch('/auth/change-password', body).then(responseData),
};

export const favoriteApi = {
  list: (params, signal) => query('/favorites', params, signal),
};

export const propertyApi = {
  list: (params, signal) => query('/properties', params, signal),
  get: (id, signal) => query(apiPath('/properties', id), undefined, signal),
  geocode: (address) => api.post('/properties/geocode', { address }).then(responseData),
  create: (body) => create('/properties', body),
  update: (id, body) => update(apiPath('/properties', id), body),
  remove: (id) => remove(apiPath('/properties', id)),
};

export const landlordRoomApi = {
  create: (body) => create('/rooms', body),
  update: (id, body) => update(apiPath('/rooms', id), body),
  remove: (id) => remove(apiPath('/rooms', id)),
};

export const tenantApi = {
  list: (params, signal) => query('/tenants', params, signal),
};

export const roommateApi = {
  list: (params, signal) => query('/roommates', params, signal),
  mine: (signal) => query('/roommates/me', undefined, signal),
  createMine: (body) => create('/roommates/me', body),
  updateMine: (body) => update('/roommates/me', body),
};

export const roommatePostApi = {
  list: (params, signal) => query('/roommate-posts', params, signal),
  mine: (params, signal) => query('/roommate-posts/mine', params, signal),
  get: (id, signal) => query(apiPath('/roommate-posts', id), undefined, signal),
  create: (body) => create('/roommate-posts', body),
  update: (id, body) => update(apiPath('/roommate-posts', id), body),
  remove: (id) => remove(apiPath('/roommate-posts', id)),
};

export const roommateRequestApi = {
  sent: (params, signal) => query('/roommate-requests/sent', params, signal),
  received: (params, signal) => query('/roommate-requests/received', params, signal),
  create: (body) => create('/roommate-requests', body),
  respond: (id, action) => create(`${apiPath('/roommate-requests', id)}/action`, { action }),
};

export const groupApi = {
  list: (params, signal) => query('/groups', params, signal),
  mine: (params, signal) => query('/groups/mine', params, signal),
  get: (id, signal) => query(apiPath('/groups', id), undefined, signal),
  create: (body) => create('/groups', body),
  update: (id, body) => update(apiPath('/groups', id), body),
  addMember: (id, studentId) => create(`${apiPath('/groups', id)}/members`, { studentId }),
  removeMember: (id, studentId) => remove(`${apiPath('/groups', id)}/members/${encodeURIComponent(String(studentId))}`),
  leave: (id) => create(`${apiPath('/groups', id)}/leave`, {}),
  transferLeadership: (id, studentId) => create(`${apiPath('/groups', id)}/transfer-leadership`, { studentId }),
};

export const conversationApi = {
  list: (params, signal) => query('/conversations', params, signal),
  messages: (conversationId, params, signal) => query(`${apiPath('/conversations', conversationId)}/messages`, params, signal),
  createDirect: (participantId) => create('/conversations/direct', { participantId }),
  sendMessage: (conversationId, body) => create(`${apiPath('/conversations', conversationId)}/messages`, body),
};

export const appointmentApi = {
  list: (params, signal) => query('/appointments', params, signal),
  create: (body) => create('/appointments', body),
  respond: (id, body) => create(`${apiPath('/appointments', id)}/respond`, body),
  cancel: (id) => create(`${apiPath('/appointments', id)}/cancel`, {}),
};

export const contractApi = {
  list: (params, signal) => query('/contracts', params, signal),
  get: (id, signal) => query(apiPath('/contracts', id), undefined, signal),
  create: (body) => create('/contracts', body),
  transition: (id, status) => create(`${apiPath('/contracts', id)}/status`, { status }),
};

export const invoiceApi = {
  list: (params, signal) => query('/invoices', params, signal),
  get: (id, signal) => query(apiPath('/invoices', id), undefined, signal),
  create: (body) => create('/invoices', body),
  update: (id, body) => update(apiPath('/invoices', id), body),
};

export const reviewApi = {
  list: (params, signal) => query('/reviews', params, signal),
  create: (body) => create('/reviews', body),
  update: (id, body) => update(apiPath('/reviews', id), body),
  remove: (id) => remove(apiPath('/reviews', id)),
  moderate: (id, body) => update(`${apiPath('/reviews', id)}/moderation`, body),
};

export const reportApi = {
  list: (params, signal) => query('/reports', params, signal),
  create: (body) => create('/reports', body),
  process: (id, body) => update(`${apiPath('/reports', id)}/process`, body),
};

export const notificationApi = {
  list: (params, signal) => query('/notifications', params, signal),
  markRead: (id) => update(`${apiPath('/notifications', id)}/read`, {}),
  markAllRead: () => create('/notifications/read-all', {}),
};

export const verificationApi = {
  mine: (params, signal) => query('/verifications/me', params, signal),
  list: (params, signal) => query('/verifications', params, signal),
  create: (body) => create('/verifications', body),
  review: (id, body) => update(`${apiPath('/verifications', id)}/review`, body),
};

export const adminApi = {
  dashboard: (signal) => query('/admin/dashboard', undefined, signal),
  users: (params, signal) => query('/admin/users', params, signal),
  setUserStatus: (id, status) => update(`${apiPath('/admin/users', id)}/status`, { status }),
  setRoomStatus: (id, status) => update(`${apiPath('/admin/rooms', id)}/status`, { status }),
  setPropertyVerification: (id, status) => update(`${apiPath('/admin/properties', id)}/verification`, { status }),
};

export const resourceApi = {
  list: (path, params, signal) => query(path, params, signal),
  get: (path, id, signal) => query(apiPath(path, id), undefined, signal),
  create,
  update: (path, id, body) => update(apiPath(path, id), body),
  remove: (path, id) => remove(apiPath(path, id)),
};
