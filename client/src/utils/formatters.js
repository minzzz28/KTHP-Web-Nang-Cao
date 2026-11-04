export function formatCurrency(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 'Chưa cập nhật giá';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numericValue);
}

export function formatCompactCurrency(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 'Chưa cập nhật';

  if (numericValue >= 1_000_000) {
    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(numericValue / 1_000_000)} triệu/tháng`;
  }

  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(numericValue)} đ/tháng`;
}

export function formatDate(value, options = {}) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    ...options,
  }).format(date);
}

export function formatNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? new Intl.NumberFormat('vi-VN').format(numericValue) : '—';
}

export function formatDistance(value) {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;
  return numericValue < 1
    ? `${Math.round(numericValue * 1000)} m`
    : `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(numericValue)} km`;
}

export function readableEnum(value) {
  if (!value) return 'Chưa cập nhật';
  const labels = {
    AVAILABLE: 'Còn phòng', RESERVED: 'Đã giữ chỗ', RENTED: 'Đang thuê', MAINTENANCE: 'Bảo trì', HIDDEN: 'Đã ẩn',
    PENDING: 'Chờ xử lý', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy',
    ACTIVE: 'Đang hiệu lực', EXPIRED: 'Đã hết hạn', TERMINATED: 'Đã kết thúc', DRAFT: 'Bản nháp',
    PAID: 'Đã thanh toán', UNPAID: 'Chưa thanh toán', OVERDUE: 'Quá hạn',
    VERIFIED: 'Đã xác minh', UNVERIFIED: 'Chưa xác minh', PROCESSING: 'Đang xử lý', RESOLVED: 'Đã xử lý',
    STUDENT: 'Sinh viên', LANDLORD: 'Chủ trọ', ADMIN: 'Quản trị viên',
  };
  return labels[value] || String(value).replaceAll('_', ' ');
}
