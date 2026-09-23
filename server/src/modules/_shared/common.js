const { z } = require('zod');
const { AppError } = require('../../utils/AppError');
const { getPagination, getPageMeta } = require('../../utils/pagination');

const idSchema = z.coerce.number().int().positive();

function parseId(value, field = 'id') {
  const parsed = idSchema.safeParse(value);
  if (!parsed.success) throw new AppError(`${field} không hợp lệ`, 422);
  return parsed.data;
}

function parseOptionalId(value, field = 'id') {
  if (value === undefined || value === null || value === '') return undefined;
  return parseId(value, field);
}

function parseDate(value, field = 'Ngày') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(`${field} không hợp lệ`, 422);
  return date;
}

function listOptions(query) {
  return getPagination(query);
}

function listData(items, pagination, total) {
  return { data: { items }, meta: getPageMeta({ ...pagination, total }) };
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return undefined;
}

function csvIntegers(value, field = 'Danh sách ID') {
  if (value === undefined || value === null || value === '') return [];
  const entries = Array.isArray(value) ? value : String(value).split(',');
  const ids = entries.map((entry) => parseId(String(entry).trim(), field));
  return [...new Set(ids)];
}

function directPairKey(firstId, secondId) {
  return [firstId, secondId].sort((left, right) => left - right).join(':');
}

function requireRole(user, role) {
  if (!user || user.role !== role) throw new AppError('Bạn không có quyền thực hiện thao tác này', 403);
}

function uniqueText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = {
  idSchema,
  parseId,
  parseOptionalId,
  parseDate,
  listOptions,
  listData,
  toBoolean,
  csvIntegers,
  directPairKey,
  requireRole,
  uniqueText
};
