const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export function valueAt(record, path, fallback = null) {
  if (!record || typeof record !== 'object' || typeof path !== 'string') return fallback;
  const segments = path.split('.');
  let current = record;

  for (const segment of segments) {
    if (!segment || BLOCKED_KEYS.has(segment) || !current || typeof current !== 'object') return fallback;
    current = current[segment];
  }
  return current ?? fallback;
}

export function recordTitle(record, fallback = 'Chưa cập nhật') {
  const value = [record?.title, record?.name, record?.fullName, record?.username, record?.code, record?.email]
    .find((candidate) => typeof candidate === 'string' && candidate.trim());
  return value ? value.trim() : fallback;
}

export function recordDescription(record) {
  const value = record?.description ?? record?.content ?? record?.message ?? record?.note ?? '';
  return typeof value === 'string' ? value : '';
}

export function booleanLabel(value, yes = 'Có', no = 'Không') {
  if (value === null || value === undefined) return 'Chưa cập nhật';
  return value ? yes : no;
}

export function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function safeNextPath(value, fallback = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  return value;
}

export function cleanText(value, maxLength = 2_000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function numericOrUndefined(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}
