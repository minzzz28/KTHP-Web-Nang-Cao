import { Button } from './Button';

export function LoadingState({ label = 'Đang tải dữ liệu…', compact = false }) {
  if (compact) {
    return <span className="d-inline-flex align-items-center gap-2 text-muted-app"><span className="spinner-border spinner-border-sm" aria-hidden="true" />{label}</span>;
  }
  return (
    <div className="data-state" role="status" aria-live="polite">
      <div>
        <div className="spinner-border text-primary mb-3" aria-hidden="true" />
        <p className="mb-0 text-muted-app">{label}</p>
      </div>
    </div>
  );
}

export function SkeletonRoomGrid({ count = 3 }) {
  return (
    <div className="row g-3" aria-label="Đang tải danh sách phòng" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="col-md-6 col-xl-4" key={index}>
          <div className="room-card">
            <div className="skeleton" style={{ height: 190 }} />
            <div className="p-3">
              <div className="skeleton mb-2" style={{ height: 18, width: '78%' }} />
              <div className="skeleton mb-3" style={{ height: 14, width: '54%' }} />
              <div className="skeleton" style={{ height: 15, width: '92%' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon = 'bi-inbox', title = 'Chưa có dữ liệu', description, action }) {
  return (
    <div className="data-state">
      <div>
        <div className="data-state__icon"><i className={`bi ${icon}`} aria-hidden="true" /></div>
        <h2 className="h5 mb-2">{title}</h2>
        {description ? <p className="text-muted-app mb-3">{description}</p> : null}
        {action}
      </div>
    </div>
  );
}

export function ErrorState({ message = 'Không thể tải dữ liệu.', onRetry }) {
  return (
    <div className="data-state" role="alert">
      <div>
        <div className="data-state__icon text-danger bg-danger-subtle"><i className="bi bi-exclamation-triangle" aria-hidden="true" /></div>
        <h2 className="h5 mb-2">Không thể hiển thị nội dung</h2>
        <p className="text-muted-app mb-3">{message}</p>
        {onRetry ? <Button variant="outline" icon="bi-arrow-clockwise" onClick={onRetry}>Thử lại</Button> : null}
      </div>
    </div>
  );
}
