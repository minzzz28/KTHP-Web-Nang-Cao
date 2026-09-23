import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { LoadingState } from './components/common/AsyncState';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AdminLayout, LandlordLayout, StudentLayout } from './layouts/DashboardLayout';
import { PublicLayout } from './layouts/PublicLayout';

function load(importer, exportName) {
  return lazy(() => importer().then((module) => ({ default: module[exportName] })));
}

// Each importer deliberately contains a string literal so Vite can split and
// resolve the page module at build time. Do not replace these with import(path).
const HomePage = load(() => import('./pages/public/HomePage.jsx'), 'HomePage');
const SearchRoomsPage = load(() => import('./pages/public/SearchRoomsPage.jsx'), 'SearchRoomsPage');
const MapRoomsPage = load(() => import('./pages/public/MapRoomsPage.jsx'), 'MapRoomsPage');
const RoomDetailPage = load(() => import('./pages/public/RoomDetailPage.jsx'), 'RoomDetailPage');
const LoginPage = load(() => import('./pages/public/AuthPages.jsx'), 'LoginPage');
const RegisterPage = load(() => import('./pages/public/AuthPages.jsx'), 'RegisterPage');
const PublicRoommatePostsPage = load(() => import('./pages/public/RoommatePostsPage.jsx'), 'PublicRoommatePostsPage');
const PublicRoommatePostDetailPage = load(() => import('./pages/public/RoommatePostDetailPage.jsx'), 'PublicRoommatePostDetailPage');
const AccessDeniedPage = load(() => import('./pages/public/SystemPages.jsx'), 'AccessDeniedPage');
const NotFoundPage = load(() => import('./pages/public/SystemPages.jsx'), 'NotFoundPage');

const StudentDashboardPage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentDashboardPage');
const StudentProfilePage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentProfilePage');
const StudentFavoritesPage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentFavoritesPage');
const StudentComparePage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentComparePage');
const StudentRoommateProfilePage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentRoommateProfilePage');
const StudentRoommatesPage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentRoommatesPage');
const StudentRoommatePostsPage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentRoommatePostsPage');
const StudentRoommateRequestsPage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentRoommateRequestsPage');
const StudentGroupsPage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentGroupsPage');
const StudentChatPage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentChatPage');
const StudentAppointmentsPage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentAppointmentsPage');
const StudentContractsPage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentContractsPage');
const StudentInvoicesPage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentInvoicesPage');
const StudentNotificationsPage = load(() => import('./pages/student/StudentPages.jsx'), 'StudentNotificationsPage');

const LandlordDashboardPage = load(() => import('./pages/landlord/LandlordPages.jsx'), 'LandlordDashboardPage');
const LandlordPropertiesPage = load(() => import('./pages/landlord/LandlordPages.jsx'), 'LandlordPropertiesPage');
const LandlordRoomsPage = load(() => import('./pages/landlord/LandlordPages.jsx'), 'LandlordRoomsPage');
const LandlordTenantsPage = load(() => import('./pages/landlord/LandlordPages.jsx'), 'LandlordTenantsPage');
const LandlordAppointmentsPage = load(() => import('./pages/landlord/LandlordPages.jsx'), 'LandlordAppointmentsPage');
const LandlordContractsPage = load(() => import('./pages/landlord/LandlordPages.jsx'), 'LandlordContractsPage');
const LandlordInvoicesPage = load(() => import('./pages/landlord/LandlordPages.jsx'), 'LandlordInvoicesPage');
const LandlordChatPage = load(() => import('./pages/landlord/LandlordPages.jsx'), 'LandlordChatPage');
const LandlordReviewsPage = load(() => import('./pages/landlord/LandlordPages.jsx'), 'LandlordReviewsPage');
const LandlordProfilePage = load(() => import('./pages/landlord/LandlordPages.jsx'), 'LandlordProfilePage');

const AdminDashboardPage = load(() => import('./pages/admin/AdminPages.jsx'), 'AdminDashboardPage');
const AdminUsersPage = load(() => import('./pages/admin/AdminPages.jsx'), 'AdminUsersPage');
const AdminRoomsPage = load(() => import('./pages/admin/AdminPages.jsx'), 'AdminRoomsPage');
const AdminPropertiesPage = load(() => import('./pages/admin/AdminPages.jsx'), 'AdminPropertiesPage');
const AdminVerificationsPage = load(() => import('./pages/admin/AdminPages.jsx'), 'AdminVerificationsPage');
const AdminReportsPage = load(() => import('./pages/admin/AdminPages.jsx'), 'AdminReportsPage');
const AdminReviewsPage = load(() => import('./pages/admin/AdminPages.jsx'), 'AdminReviewsPage');
const AdminStatisticsPage = load(() => import('./pages/admin/AdminPages.jsx'), 'AdminStatisticsPage');

function PageLoader() {
  return <main className="container py-5"><LoadingState label="Đang chuẩn bị trang…" /></main>;
}

function RoleRoute({ role, children }) {
  return <ProtectedRoute allowedRoles={[role]}>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="rooms" element={<SearchRoomsPage />} />
          <Route path="rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="map" element={<MapRoomsPage />} />
          <Route path="roommate-posts" element={<PublicRoommatePostsPage />} />
          <Route path="roommate-posts/:postId" element={<PublicRoommatePostDetailPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="access-denied" element={<AccessDeniedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<RoleRoute role="STUDENT"><StudentLayout /></RoleRoute>}>
          <Route path="student" element={<StudentDashboardPage />} />
          <Route path="student/profile" element={<StudentProfilePage />} />
          <Route path="student/favorites" element={<StudentFavoritesPage />} />
          <Route path="student/compare" element={<StudentComparePage />} />
          <Route path="student/roommate-profile" element={<StudentRoommateProfilePage />} />
          <Route path="student/roommates" element={<StudentRoommatesPage />} />
          <Route path="student/roommate-posts" element={<StudentRoommatePostsPage />} />
          <Route path="student/roommate-requests" element={<StudentRoommateRequestsPage />} />
          <Route path="student/groups" element={<StudentGroupsPage />} />
          <Route path="student/chat" element={<StudentChatPage />} />
          <Route path="student/appointments" element={<StudentAppointmentsPage />} />
          <Route path="student/contracts" element={<StudentContractsPage />} />
          <Route path="student/invoices" element={<StudentInvoicesPage />} />
          <Route path="student/notifications" element={<StudentNotificationsPage />} />
        </Route>

        <Route element={<RoleRoute role="LANDLORD"><LandlordLayout /></RoleRoute>}>
          <Route path="landlord" element={<LandlordDashboardPage />} />
          <Route path="landlord/properties" element={<LandlordPropertiesPage />} />
          <Route path="landlord/rooms" element={<LandlordRoomsPage />} />
          <Route path="landlord/tenants" element={<LandlordTenantsPage />} />
          <Route path="landlord/appointments" element={<LandlordAppointmentsPage />} />
          <Route path="landlord/contracts" element={<LandlordContractsPage />} />
          <Route path="landlord/invoices" element={<LandlordInvoicesPage />} />
          <Route path="landlord/chat" element={<LandlordChatPage />} />
          <Route path="landlord/reviews" element={<LandlordReviewsPage />} />
          <Route path="landlord/profile" element={<LandlordProfilePage />} />
        </Route>

        <Route element={<RoleRoute role="ADMIN"><AdminLayout /></RoleRoute>}>
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/rooms" element={<AdminRoomsPage />} />
          <Route path="admin/properties" element={<AdminPropertiesPage />} />
          <Route path="admin/verifications" element={<AdminVerificationsPage />} />
          <Route path="admin/reports" element={<AdminReportsPage />} />
          <Route path="admin/reviews" element={<AdminReviewsPage />} />
          <Route path="admin/statistics" element={<AdminStatisticsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
