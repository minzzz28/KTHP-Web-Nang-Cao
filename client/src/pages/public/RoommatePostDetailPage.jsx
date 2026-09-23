import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { roommatePostApi } from '../../api/resources';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/AsyncState';
import { StatusBadge, VerifiedBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { entityFrom, getName } from '../../utils/data';
import { formatCompactCurrency, formatDate, formatNumber } from '../../utils/formatters';

const preferredGenderLabels = {
  MALE: 'Ưu tiên nam',
  FEMALE: 'Ưu tiên nữ',
};

function authorOf(post) {
  return post?.student?.user || post?.author || post?.user || post?.studentProfile?.user || post?.student || {};
}

function DetailItem({ icon, label, value }) {
  return <div className="detail-info-item"><small><i className={`bi ${icon} me-1`} aria-hidden="true" />{label}</small><strong>{value || 'Chưa cập nhật'}</strong></div>;
}

function ContactAction({ user, author }) {
  if (!author?.id || String(author.id) === String(user?.id)) return null;
  const next = `/student/chat?userId=${encodeURIComponent(author.id)}`;
  if (user?.role === 'STUDENT') {
    return <Link to={next} className="btn btn-primary w-100"><i className="bi bi-chat-dots me-1" aria-hidden="true" />Nhắn tin trao đổi</Link>;
  }
  if (!user) {
    return <Link to={`/login?next=${encodeURIComponent(next)}`} className="btn btn-primary w-100"><i className="bi bi-box-arrow-in-right me-1" aria-hidden="true" />Đăng nhập để nhắn tin</Link>;
  }
  return null;
}

export function PublicRoommatePostDetailPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const request = useAsyncData(useCallback((signal) => roommatePostApi.get(postId, signal), [postId]));
  const post = entityFrom(request.data);

  if (request.loading) return <main className="container py-5"><LoadingState label="Đang tải bài đăng ở ghép…" /></main>;
  if (request.error) return <main className="container py-5"><ErrorState message={request.error} onRetry={request.reload} /></main>;
  if (!post) return <main className="container py-5"><EmptyState icon="bi-people" title="Không tìm thấy bài đăng" description="Bài đăng có thể đã được gỡ hoặc không còn mở." action={<Link to="/roommate-posts" className="btn btn-primary">Quay lại danh sách</Link>} /></main>;

  const author = authorOf(post);
  const budget = post.budgetPerPerson ?? post.budget ?? post.maxBudget;
  const neededPeople = post.neededPeople ?? post.peopleNeeded;
  const moveInDate = post.moveInDate ?? post.expectedMoveInDate;
  const roomName = post.room?.name || post.room?.code;
  const roomAddress = post.room?.property?.address || post.room?.property?.name;

  return (
    <main className="roommate-detail-page py-4 py-lg-5">
      <div className="container">
        <nav aria-label="Điều hướng breadcrumb" className="small mb-3"><Link to="/">Trang chủ</Link><span className="mx-2 text-muted-app">/</span><Link to="/roommate-posts">Tìm ở ghép</Link><span className="mx-2 text-muted-app">/</span><span className="text-muted-app">Chi tiết bài đăng</span></nav>
        <div className="row g-4">
          <div className="col-lg-8">
            <header className="roommate-detail-heading"><div className="d-flex align-items-start justify-content-between gap-3"><div><div className="section-kicker mb-2">Bài đăng ở ghép</div><h1 className="page-title mb-2">{post.title || 'Tìm người ở ghép'}</h1><p className="mb-0 text-muted-app"><i className="bi bi-geo-alt me-1" aria-hidden="true" />{post.area || 'Khu vực đang cập nhật'}</p></div>{post.status ? <StatusBadge status={post.status} /> : null}</div></header>

            <section className="py-4 border-bottom border-app"><h2 className="h5 mb-3">Lời nhắn từ người đăng</h2><p className="roommate-detail-content mb-0">{post.content || post.description || 'Người đăng chưa cập nhật nội dung chi tiết.'}</p></section>

            <section className="py-4 border-bottom border-app"><h2 className="h5 mb-3">Nhu cầu ở ghép</h2><div className="detail-info-grid"><DetailItem icon="bi-geo-alt" label="Khu vực" value={post.area} /><DetailItem icon="bi-wallet2" label="Ngân sách/người" value={budget ? formatCompactCurrency(budget) : null} /><DetailItem icon="bi-people" label="Cần thêm" value={Number.isFinite(Number(neededPeople)) ? `${formatNumber(neededPeople)} người` : null} /><DetailItem icon="bi-gender-ambiguous" label="Ưu tiên" value={preferredGenderLabels[post.preferredGender] || 'Không yêu cầu'} /><DetailItem icon="bi-calendar-event" label="Dự kiến chuyển vào" value={moveInDate ? formatDate(moveInDate) : null} /><DetailItem icon="bi-clock-history" label="Đăng ngày" value={post.createdAt ? formatDate(post.createdAt) : null} /></div></section>

            {post.requirements ? <section className="py-4 border-bottom border-app"><h2 className="h5 mb-2">Điều bạn ấy mong muốn</h2><p className="roommate-detail-content mb-0">{post.requirements}</p></section> : null}

            {roomName ? <section className="py-4"><h2 className="h5 mb-3">Phòng dự kiến</h2><div className="roommate-detail-room"><div><strong>{roomName}</strong><p className="small text-muted-app mb-0 mt-1">{roomAddress || 'Địa chỉ phòng đang cập nhật'}</p></div>{post.room?.id ? <Link to={`/rooms/${encodeURIComponent(post.room.id)}`} className="btn btn-outline-primary btn-sm">Xem phòng <i className="bi bi-arrow-right ms-1" aria-hidden="true" /></Link> : null}</div></section> : null}
          </div>

          <aside className="col-lg-4"><div className="detail-sidebar"><div className="data-panel roommate-detail-author"><div className="d-flex align-items-center gap-3"><div className="avatar-placeholder"><i className="bi bi-person" aria-hidden="true" /></div><div><div className="small text-muted-app mb-1">Người đăng bài</div><h2 className="h6 mb-1">{getName(author) || 'Sinh viên tìm ở ghép'}</h2>{author.verificationStatus === 'VERIFIED' ? <VerifiedBadge status="VERIFIED" /> : <p className="small text-muted-app mb-0">Thông tin được cung cấp trong hệ thống.</p>}</div></div><div className="d-grid gap-2 mt-4"><ContactAction user={user} author={author} /><Link to="/roommate-posts" className="btn btn-light"><i className="bi bi-arrow-left me-1" aria-hidden="true" />Xem bài đăng khác</Link></div></div></div></aside>
        </div>
      </div>
    </main>
  );
}
