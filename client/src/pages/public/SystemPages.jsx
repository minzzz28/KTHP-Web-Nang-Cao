import { Link } from 'react-router-dom';

function SystemState({ icon, title, description, action }) {
  return (
    <section className="page-section">
      <div className="container"><div className="data-state system-state"><div><div className="data-state__icon"><i className={`bi ${icon}`} aria-hidden="true" /></div><h1 className="page-title mb-2">{title}</h1><p className="text-muted-app mb-4">{description}</p>{action}</div></div></div>
    </section>
  );
}

export function AccessDeniedPage() {
  return <SystemState icon="bi-shield-lock" title="Bạn không có quyền truy cập" description="Tài khoản hiện tại không thể mở khu vực này. Hãy quay lại khu vực phù hợp với vai trò của bạn." action={<Link to="/" className="btn btn-primary"><i className="bi bi-house me-1" aria-hidden="true" />Về trang chủ</Link>} />;
}

export function NotFoundPage() {
  return <SystemState icon="bi-compass" title="Không tìm thấy trang này" description="Đường dẫn có thể đã thay đổi hoặc không còn tồn tại." action={<Link to="/" className="btn btn-primary"><i className="bi bi-arrow-left me-1" aria-hidden="true" />Về trang chủ</Link>} />;
}
