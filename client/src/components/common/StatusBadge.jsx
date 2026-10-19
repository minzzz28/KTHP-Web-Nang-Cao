import { getStatusVariant } from '../../utils/data';
import { readableEnum } from '../../utils/formatters';

export function StatusBadge({ status, label }) {
  const variant = getStatusVariant(status);
  const icon = variant === 'success' ? 'bi-check-circle-fill' : variant === 'warning' ? 'bi-clock-fill' : variant === 'danger' ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill';
  return <span className={`status-badge status-badge--${variant}`}><i className={`bi ${icon}`} aria-hidden="true" />{label || readableEnum(status)}</span>;
}

export function VerifiedBadge({ status }) {
  if (status !== 'VERIFIED') return null;
  return <span className="verified-badge"><i className="bi bi-patch-check-fill me-1" aria-hidden="true" />Đã xác minh</span>;
}
