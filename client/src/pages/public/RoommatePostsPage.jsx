import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { roommatePostApi } from '../../api/resources';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/AsyncState';
import { Button } from '../../components/common/Button';
import { StatusBadge, VerifiedBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { collectionFrom, getName } from '../../utils/data';
import { formatCompactCurrency, formatDate, formatNumber } from '../../utils/formatters';
import { cleanText } from '../../utils/records';

function authorOf(post) {
  return post?.student?.user || post?.author || post?.user || post?.studentProfile?.user || {};
}

function PostCard({ post }) {
  const author = authorOf(post);
  const budget = post.budgetPerPerson ?? post.budget ?? post.maxBudget;
  const moveInDate = post.moveInDate ?? post.expectedMoveInDate;
  const title = post.title || 'Tìm người ở ghép';
  return (
    <article className="roommate-post-card">
      <Link to={`/roommate-posts/${encodeURIComponent(post.id)}`} className="roommate-post-card__link" aria-label={`Xem chi tiết bài đăng: ${title}`}>
        <div className="d-flex align-items-start justify-content-between gap-3"><div className="d-flex align-items-center gap-2"><div className="avatar-placeholder"><i className="bi bi-person" aria-hidden="true" /></div><div><strong>{getName(author) || 'Sinh viên tìm ở ghép'}</strong><div className="small text-muted-app">{author.university?.name || post.university?.name || post.area || 'Khu vực đang cập nhật'}</div></div></div><div className="text-end">{post.status ? <StatusBadge status={post.status} /> : null}{author.verificationStatus === 'VERIFIED' ? <div className="mt-1"><VerifiedBadge status="VERIFIED" /></div> : null}</div></div>
        <h2 className="h6 mt-3 mb-2">{title}</h2>
        {post.content || post.description ? <p className="text-muted-app small roommate-post-card__content">{post.content || post.description}</p> : null}
        <div className="d-flex flex-wrap gap-3 small text-muted-app pt-3 border-top border-app"><span><i className="bi bi-geo-alt me-1" aria-hidden="true" />{post.area || 'Chưa cập nhật khu vực'}</span>{budget ? <span><i className="bi bi-wallet2 me-1" aria-hidden="true" />{formatCompactCurrency(budget)}</span> : null}{Number.isFinite(Number(post.neededPeople ?? post.peopleNeeded)) ? <span><i className="bi bi-people me-1" aria-hidden="true" />Cần {formatNumber(post.neededPeople ?? post.peopleNeeded)} người</span> : null}{moveInDate ? <span><i className="bi bi-calendar-event me-1" aria-hidden="true" />Từ {formatDate(moveInDate)}</span> : null}</div>
        <span className="roommate-post-card__action">Xem chi tiết <i className="bi bi-arrow-right" aria-hidden="true" /></span>
      </Link>
    </article>
  );
}

export function PublicRoommatePostsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const keyword = searchParams.get('keyword') || '';
  const [draft, setDraft] = useState(keyword);
  const request = useAsyncData(useCallback((signal) => roommatePostApi.list({ area: keyword || undefined, status: 'OPEN', limit: 24 }, signal), [keyword]));
  const posts = collectionFrom(request.data).items;
  const target = user?.role === 'STUDENT' ? '/student/roommate-posts' : '/login?next=%2Fstudent%2Froommate-posts';
  const search = (event) => {
    event.preventDefault();
    const next = cleanText(draft, 100);
    setSearchParams(next ? { keyword: next } : {});
  };

  const resultCopy = useMemo(() => request.loading ? 'Đang tải bài đăng…' : `${posts.length} bài đăng đang mở`, [request.loading, posts.length]);
  return (
    <section className="page-section"><div className="container">
      <header className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4"><div><div className="section-kicker mb-2">Ở ghép</div><h1 className="page-title mb-2">Tìm người đồng hành phù hợp</h1><p className="text-muted-app mb-0">Khám phá các bài đăng đang hoạt động từ sinh viên, dựa trên thông tin thật do người dùng cung cấp.</p></div><Link to={target} className="btn btn-primary"><i className="bi bi-plus-lg me-1" aria-hidden="true" />Đăng bài tìm ở ghép</Link></header>
      <form className="row g-2 mb-4" onSubmit={search}><div className="col-md-8 col-lg-6"><label className="visually-hidden" htmlFor="roommate-post-keyword">Tìm khu vực hoặc nội dung</label><input id="roommate-post-keyword" className="form-control" value={draft} maxLength="100" onChange={(event) => setDraft(event.target.value)} placeholder="Tìm theo khu vực hoặc nội dung" /></div><div className="col-auto"><Button type="submit" icon="bi-search">Tìm bài đăng</Button></div></form>
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3"><strong>{resultCopy}</strong>{keyword ? <button type="button" className="btn btn-link btn-sm" onClick={() => { setDraft(''); setSearchParams({}); }}>Xóa tìm kiếm</button> : null}</div>
      {request.error ? <ErrorState message={request.error} onRetry={request.reload} /> : request.loading ? <LoadingState label="Đang tải bài đăng ở ghép…" /> : posts.length ? <div className="row g-3">{posts.map((post) => <div className="col-md-6 col-xl-4" key={post.id}><PostCard post={post} /></div>)}</div> : <EmptyState icon="bi-people" title="Chưa có bài đăng phù hợp" description="Hãy thử một khu vực khác hoặc tạo bài đăng đầu tiên của bạn." action={<Link to={target} className="btn btn-primary">Tạo bài đăng</Link>} />}
    </div></section>
  );
}

export { PostCard };
