import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

let accessToken = null;
let onUnauthorized = null;

function sanitizeParams(params) {
  if (!params || typeof params !== 'object') return undefined;

  const safeParams = Object.create(null);
  for (const [key, value] of Object.entries(params)) {
    if (DANGEROUS_KEYS.has(key) || value === undefined || value === null || value === '') continue;
    if (key === 'limit') {
      const parsedLimit = Number(value);
      if (!Number.isFinite(parsedLimit)) continue;
      // Every paginated API endpoint enforces a maximum of 50 records.
      safeParams[key] = Math.min(50, Math.max(1, Math.trunc(parsedLimit)));
      continue;
    }
    safeParams[key] = value;
  }
  return safeParams;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (config.params) {
    config.params = sanitizeParams(config.params);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export function setAccessToken(token) {
  accessToken = typeof token === 'string' && token.length > 0 ? token : null;
}

export function getAccessToken() {
  return accessToken;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = typeof handler === 'function' ? handler : null;
}

export function apiPath(path, id) {
  const segment = encodeURIComponent(String(id ?? ''));
  return `${path}/${segment}`;
}

export function responseData(response) {
  const payload = response?.data;
  if (payload?.meta !== undefined) return { data: payload.data, meta: payload.meta };
  return payload?.data ?? payload;
}

export function friendlyApiError(error, fallback = 'Không thể thực hiện yêu cầu. Vui lòng thử lại.') {
  if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') return null;
  const status = error?.response?.status;
  if (!status) return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy dữ liệu bạn yêu cầu.';
  if (status === 409) return 'Dữ liệu đã thay đổi hoặc đang xung đột. Vui lòng tải lại trang.';
  if (status === 422) return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.';
  if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
  return fallback;
}
