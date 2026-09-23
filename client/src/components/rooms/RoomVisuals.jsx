import { formatCompactCurrency, formatNumber } from '../../utils/formatters';

export function PriceDisplay({ value, className = '' }) {
  return <span className={`room-card__price ${className}`.trim()}>{formatCompactCurrency(value)}</span>;
}

export function Rating({ value, count }) {
  if (value === null || value === undefined || value === '') return null;
  const rating = Number(value);
  if (!Number.isFinite(rating)) return null;
  return <span className="d-inline-flex align-items-center gap-1"><i className="bi bi-star-fill text-warning" aria-hidden="true" />{rating.toFixed(1)}{Number.isFinite(Number(count)) ? <small className="text-muted-app">({formatNumber(count)})</small> : null}</span>;
}

export function MatchScore({ score, reasons = [] }) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return null;
  return (
    <div className="d-flex align-items-center gap-2">
      <span className="status-badge status-badge--success"><i className="bi bi-bullseye" aria-hidden="true" />{Math.round(numericScore)}% phù hợp</span>
      {reasons.length > 0 ? <span className="small text-muted-app">{reasons[0]}</span> : null}
    </div>
  );
}
