import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const publicLinks = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/rooms', label: 'Tìm phòng' },
  { to: '/map', label: 'Bản đồ' },
  { to: '/roommate-posts', label: 'Ở ghép' },
];

function portalPath(role) {
  if (role === 'LANDLORD') return '/landlord';
  if (role === 'ADMIN') return '/admin';
  return '/student';
}

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="app-navbar">
        <nav className="navbar navbar-expand-lg py-2" aria-label="Điều hướng chính">
          <div className="container">
            <NavLink to="/" className="navbar-brand d-flex align-items-center gap-2 me-lg-4" onClick={() => setOpen(false)}><span className="brand-mark"><i className="bi bi-house-heart-fill" aria-hidden="true" /></span><span className="brand-name">Trọ Sinh Viên</span></NavLink>
            <button className="navbar-toggler" type="button" aria-label="Mở menu điều hướng" aria-expanded={open} onClick={() => setOpen((current) => !current)}><span className="navbar-toggler-icon" /></button>
            <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                {publicLinks.map((link) => <li className="nav-item" key={link.to}><NavLink end={link.end} to={link.to} className="nav-link" onClick={() => setOpen(false)}>{link.label}</NavLink></li>)}
              </ul>
              <div className="d-flex flex-column flex-lg-row gap-2 pt-2 pt-lg-0">
                {isAuthenticated ? <>
                  <NavLink to={portalPath(user?.role)} className="btn btn-outline-primary" onClick={() => setOpen(false)}><i className="bi bi-grid-1x2 me-1" aria-hidden="true" />Khu vực của tôi</NavLink>
                  <button type="button" className="btn btn-light" onClick={handleLogout}><i className="bi bi-box-arrow-right me-1" aria-hidden="true" />Đăng xuất</button>
                </> : <>
                  <NavLink to="/login" className="btn btn-light" onClick={() => setOpen(false)}>Đăng nhập</NavLink>
                  <NavLink to="/register" className="btn btn-primary" onClick={() => setOpen(false)}>Tạo tài khoản</NavLink>
                </>}
              </div>
            </div>
          </div>
        </nav>
      </header>
      <main className="app-main flex-grow-1"><Outlet /></main>
      <footer className="footer mt-auto py-4">
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div><div className="d-flex align-items-center gap-2 mb-1"><span className="brand-mark"><i className="bi bi-house-heart-fill" aria-hidden="true" /></span><strong>Trọ Sinh Viên</strong></div><p className="small text-muted-app mb-0">Tìm phòng rõ ràng hơn, thuê trọ an tâm hơn.</p></div>
          <div className="d-flex flex-wrap gap-3"><NavLink to="/rooms">Tìm phòng</NavLink><NavLink to="/map">Bản đồ</NavLink><NavLink to="/roommate-posts">Tìm ở ghép</NavLink></div>
        </div>
      </footer>
    </div>
  );
}
