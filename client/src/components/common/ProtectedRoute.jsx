import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from './AsyncState';

export function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) return <main className="container py-5"><LoadingState label="Đang kiểm tra phiên đăng nhập…" /></main>;
  if (!isAuthenticated) return <Navigate to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />;
  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) return <Navigate to="/access-denied" replace />;
  return children;
}
