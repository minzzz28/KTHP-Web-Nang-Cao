import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getName } from '../utils/data';

const MENUS = {
  STUDENT: [
    ['/student', 'Tổng quan', 'bi-grid-1x2', true], ['/student/profile', 'Hồ sơ', 'bi-person'], ['/student/favorites', 'Phòng yêu thích', 'bi-heart'],
    ['/student/compare', 'So sánh phòng', 'bi-columns-gap'], ['/student/roommate-profile', 'Hồ sơ ở ghép', 'bi-person-vcard'], ['/student/roommates', 'Tìm bạn ở ghép', 'bi-people'],
    ['/student/roommate-posts', 'Bài đăng ở ghép', 'bi-megaphone'], ['/student/roommate-requests', 'Lời mời ở ghép', 'bi-send'], ['/student/groups', 'Nhóm thuê', 'bi-people-fill'],
    ['/student/chat', 'Tin nhắn', 'bi-chat-dots'], ['/student/appointments', 'Lịch xem phòng', 'bi-calendar-check'], ['/student/contracts', 'Hợp đồng', 'bi-file-earmark-text'],
    ['/student/invoices', 'Hóa đơn', 'bi-receipt'], ['/student/notifications', 'Thông báo', 'bi-bell'],
  ],
  LANDLORD: [
    ['/landlord', 'Tổng quan', 'bi-grid-1x2', true], ['/landlord/properties', 'Khu trọ', 'bi-buildings'], ['/landlord/rooms', 'Quản lý phòng', 'bi-door-open'],
    ['/landlord/tenants', 'Người thuê', 'bi-people'], ['/landlord/appointments', 'Lịch xem phòng', 'bi-calendar-check'], ['/landlord/contracts', 'Hợp đồng', 'bi-file-earmark-text'],
    ['/landlord/invoices', 'Hóa đơn', 'bi-receipt'], ['/landlord/chat', 'Tin nhắn', 'bi-chat-dots'], ['/landlord/reviews', 'Đánh giá', 'bi-star'], ['/landlord/profile', 'Hồ sơ', 'bi-person'],
  ],
  ADMIN: [
    ['/admin', 'Tổng quan', 'bi-grid-1x2', true], ['/admin/users', 'Tài khoản', 'bi-people'], ['/admin/rooms', 'Tin đăng phòng', 'bi-door-open'],
    ['/admin/properties', 'Khu trọ', 'bi-buildings'], ['/admin/verifications', 'Xác minh', 'bi-patch-check'], ['/admin/reports', 'Báo cáo', 'bi-flag'],
    ['/admin/reviews', 'Đánh giá', 'bi-star'], ['/admin/statistics', 'Thống kê', 'bi-bar-chart'],
  ],
};

const ROLE_LABEL = { STUDENT: 'Khu vực sinh viên', LANDLORD: 'Khu vực chủ trọ', ADMIN: 'Quản trị hệ thống' };

export function DashboardLayout({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menu = MENUS[role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar d-flex align-items-center px-3 px-lg-4 justify-content-between">
        <div className="d-flex align-items-center gap-2"><button type="button" className="btn btn-light mobile-sidebar-toggle" aria-label="Mở điều hướng khu vực" onClick={() => setSidebarOpen((current) => !current)}><i className="bi bi-list" aria-hidden="true" /></button><NavLink to="/" className="d-flex align-items-center gap-2"><span className="brand-mark"><i className="bi bi-house-heart-fill" aria-hidden="true" /></span><span className="brand-name d-none d-sm-inline">Trọ Sinh Viên</span></NavLink></div>
        <div className="d-flex align-items-center gap-2"><span className="small text-muted-app d-none d-sm-inline">{getName(user) || 'Tài khoản'}</span><button type="button" className="btn btn-light btn-sm" onClick={handleLogout}><i className="bi bi-box-arrow-right" aria-hidden="true" /><span className="d-none d-sm-inline">Đăng xuất</span></button></div>
      </header>
      <div className="dashboard-grid">
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label={`Điều hướng ${ROLE_LABEL[role]}`}>
          <p className="px-2 mb-3 small text-uppercase text-muted-app fw-bold">{ROLE_LABEL[role]}</p>
          <nav className="nav flex-column gap-1">
            {menu.map(([to, label, icon, end]) => <NavLink end={end} to={to} key={to} className="nav-link" onClick={() => setSidebarOpen(false)}><i className={`bi ${icon}`} aria-hidden="true" />{label}</NavLink>)}
          </nav>
        </aside>
        <main className="dashboard-content"><Outlet /></main>
      </div>
    </div>
  );
}

export const StudentLayout = () => <DashboardLayout role="STUDENT" />;
export const LandlordLayout = () => <DashboardLayout role="LANDLORD" />;
export const AdminLayout = () => <DashboardLayout role="ADMIN" />;
