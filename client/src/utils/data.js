const EMPTY_ARRAY = Object.freeze([]);

function firstText(...values) {
  const value = values.find((candidate) => typeof candidate === 'string' && candidate.trim());
  return value ? value.trim() : null;
}

export function asArray(value) {
  return Array.isArray(value) ? value : EMPTY_ARRAY;
}

export function collectionFrom(payload) {
  if (Array.isArray(payload)) return { items: payload, meta: {} };
  const data = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  const items = Array.isArray(data?.items) ? data.items
    : Array.isArray(data?.results) ? data.results
      : Array.isArray(data?.rooms) ? data.rooms
        : Array.isArray(data?.records) ? data.records
          : Array.isArray(data?.data) ? data.data
            : EMPTY_ARRAY;
  return { items, meta: data?.meta || payload?.meta || {} };
}

export function entityFrom(payload) {
  if (!payload || Array.isArray(payload)) return null;
  if (payload.data && !Array.isArray(payload.data)) return payload.data;
  return payload;
}

export function roomImage(room) {
  const image = room?.images?.[0] || room?.roomImages?.[0] || room?.image;
  if (typeof image === 'string') return image;
  return image?.url || image?.imageUrl || null;
}

export function roomAddress(room) {
  return room?.property?.address || room?.address || room?.property?.name || null;
}

export function roomAmenities(room) {
  const source = room?.amenities || room?.roomAmenities || EMPTY_ARRAY;
  return asArray(source).map((amenity) => amenity?.amenity || amenity).filter(Boolean);
}

export function roomRating(room) {
  const value = room?.averageRating ?? room?.rating ?? room?.reviewSummary?.averageRating;
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function roomDistance(room) {
  return room?.distanceKm ?? room?.distance ?? room?.universityDistanceKm ?? null;
}

export function getName(record) {
  return firstText(record?.fullName, record?.name, record?.username, record?.title, record?.code, record?.email);
}

export function getAccountLoginDetails(record, fallback = null) {
  const username = firstText(record?.username);
  const email = firstText(record?.email);
  return [username, email].filter(Boolean).join(' · ') || fallback;
}

export function getAccountOptionLabel(record, fallback = null) {
  const name = getName(record);
  const identifier = firstText(record?.username, record?.email);

  if (name && identifier && name !== identifier) return `${name} (${identifier})`;
  return name || identifier || fallback;
}

export function getStatusVariant(status) {
  if (['AVAILABLE', 'ACTIVE', 'ACCEPTED', 'PAID', 'VERIFIED', 'RESOLVED'].includes(status)) return 'success';
  if (['PENDING', 'PROCESSING', 'RESERVED', 'UNPAID', 'OVERDUE'].includes(status)) return 'warning';
  if (['REJECTED', 'CANCELLED', 'TERMINATED', 'HIDDEN'].includes(status)) return 'danger';
  return 'neutral';
}

export function getLocation(room) {
  const latitude = Number(room?.property?.latitude ?? room?.latitude);
  const longitude = Number(room?.property?.longitude ?? room?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
}

export function safeUrl(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
    const apiOrigin = new URL(apiBaseUrl, window.location.origin).origin;
    // Uploaded assets are returned by Express as `/uploads/<file>`. During
    // Vite development the API can run on another port, so resolve those
    // paths against the configured API rather than the Vite page origin.
    const baseUrl = value.startsWith('/uploads/') ? apiOrigin : window.location.origin;
    const url = new URL(value, baseUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
