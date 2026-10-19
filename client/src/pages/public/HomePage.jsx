import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { roomApi, universityApi } from '../../api/resources';
import { ErrorState, EmptyState } from '../../components/common/AsyncState';
import { Button } from '../../components/common/Button';
import { RoomList } from '../../components/rooms/RoomList';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { collectionFrom } from '../../utils/data';
import { primaryUniversityFrom, prioritizeUniversities } from '../../utils/universities';

function RoomSection({ title, eyebrow, description, request, allRoomsPath = '/rooms', emptyAction, emptyDescription }) {
  const { data, loading, error, reload } = request;
  const { items } = collectionFrom(data);
  return (
    <section className="page-section content-visibility-auto">
      <div className="container">
        <div className="d-flex flex-column flex-sm-row align-items-sm-end justify-content-between gap-3 mb-4">
          <div><div className="section-kicker mb-2">{eyebrow}</div><h2 className="section-title mb-1">{title}</h2>{description ? <p className="text-muted-app mb-0">{description}</p> : null}</div>
          <Link to={allRoomsPath} className="btn btn-ghost">Xem tất cả <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
        </div>
        {error ? <ErrorState message={error} onRetry={reload} /> : !loading && items.length === 0 ? <EmptyState icon="bi-house-door" title="Chưa có phòng để hiển thị" description={emptyDescription} action={emptyAction} /> : <RoomList rooms={items} loading={loading} />}
      </div>
    </section>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const universitiesRequest = useAsyncData(useCallback((signal) => universityApi.list({ limit: 50 }, signal), []));
  const universities = collectionFrom(universitiesRequest.data).items;
  const primaryUniversity = useMemo(() => primaryUniversityFrom(universities), [universities]);
  const prioritizedUniversities = useMemo(() => prioritizeUniversities(universities, primaryUniversity), [universities, primaryUniversity]);
  const primaryUniversityId = primaryUniversity?.id;
  const primaryRoomsReady = Boolean(primaryUniversityId) || !universitiesRequest.loading;
  const primaryRoomsPath = primaryUniversityId
    ? `/rooms?${new URLSearchParams({ universityId: String(primaryUniversityId), radiusKm: '3' }).toString()}`
    : '/rooms';
  const [selectedUniversityId, setSelectedUniversityId] = useState('');
  const didInitializeUniversity = useRef(false);
  const featured = useAsyncData(useCallback((signal) => roomApi.list({ sort: 'newest', limit: 3, universityId: primaryUniversityId || undefined, radiusKm: primaryUniversityId ? 3 : undefined }, signal), [primaryUniversityId]), [primaryUniversityId], primaryRoomsReady);
  const newest = useAsyncData(useCallback((signal) => roomApi.list({ sort: 'newest', limit: 3, universityId: primaryUniversityId || undefined, radiusKm: primaryUniversityId ? 3 : undefined }, signal), [primaryUniversityId]), [primaryUniversityId], primaryRoomsReady);
  const recommendations = useAsyncData(useCallback((signal) => user?.role === 'STUDENT'
    ? roomApi.recommendations({ limit: 3 }, signal)
    : Promise.resolve([]), [user?.role]));

  useEffect(() => {
    if (didInitializeUniversity.current || !primaryUniversityId) return;
    didInitializeUniversity.current = true;
    setSelectedUniversityId(String(primaryUniversityId));
  }, [primaryUniversityId]);

  const submitSearch = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const q = formData.get('q')?.trim();
    const universityId = formData.get('universityId');
    if (q) params.set('q', q);
    if (universityId) params.set('universityId', universityId);
    navigate(`/rooms${params.size ? `?${params.toString()}` : ''}`);
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="section-kicker mb-3">Nền tảng tìm phòng trọ sinh viên</div>
          <h1 className="mb-3">Tìm phòng trọ phù hợp với bạn.</h1>
          <p className="hero-copy mb-4">Khám phá các phòng trọ minh bạch, thuận tiện đi học và phù hợp với nhu cầu của bạn.</p>
          <form className="hero-search" onSubmit={submitSearch}>
            <div className="row g-2 align-items-end">
              <div className="col-md-7"><label className="visually-hidden" htmlFor="home-keyword">Bạn muốn tìm phòng ở đâu?</label><input id="home-keyword" className="form-control" name="q" placeholder="Ví dụ: tên đường, khu vực hoặc tên phòng" /></div>
              <div className="col-md-3"><label className="visually-hidden" htmlFor="home-university">Gần trường</label><select id="home-university" className="form-select" name="universityId" value={selectedUniversityId} onChange={(event) => setSelectedUniversityId(event.target.value)} disabled={universitiesRequest.loading}><option value="">Tất cả trường</option>{prioritizedUniversities.map((university) => <option value={university.id} key={university.id}>{String(university.id) === String(primaryUniversityId) ? `${university.name} (mặc định)` : university.name}</option>)}</select></div>
              <div className="col-md-2"><Button type="submit" className="w-100" icon="bi-search">Tìm phòng</Button></div>
            </div>
          </form>
          <div className="d-flex flex-wrap gap-3 mt-3 small text-muted-app"><span><i className="bi bi-shield-check me-1 text-primary" aria-hidden="true" />Thông tin minh bạch</span><span><i className="bi bi-map me-1 text-primary" aria-hidden="true" />Xem vị trí trên bản đồ</span><span><i className="bi bi-calendar-check me-1 text-primary" aria-hidden="true" />Đặt lịch trực tuyến</span></div>
        </div>
      </section>

      <RoomSection title="Phòng trọ đáng xem" eyebrow="Khám phá" description="Các tin mới và vị trí thuận tiện được ưu tiên theo nhu cầu tìm trọ." request={featured} allRoomsPath={primaryRoomsPath} emptyDescription="Hiện chưa có phòng để hiển thị. Hãy khám phá toàn bộ danh sách phòng." />
      <div className="surface"><section className="page-section content-visibility-auto"><div className="container"><div className="data-panel d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"><div><div className="section-kicker mb-2">Tìm theo khoảng cách</div><h2 className="h4 mb-1">Tìm phòng gần trường</h2><p className="text-muted-app mb-0">Kết quả được ưu tiên theo trường đang chọn; bạn luôn có thể đổi sang trường khác trong bộ lọc.</p></div><Link to={primaryRoomsPath} className="btn btn-outline-primary">Tìm phòng gần trường</Link></div></div></section></div>
      <RoomSection title="Tin mới cập nhật" eyebrow="Mới đăng" description="Theo dõi những phòng vừa được cập nhật phù hợp với nhu cầu của bạn." request={newest} allRoomsPath={primaryRoomsPath} emptyDescription="Hiện chưa có tin mới để hiển thị." />
      <div className="surface"><RoomSection title="Gợi ý dành cho bạn" eyebrow="Phù hợp với nhu cầu" description="Dựa trên tiêu chí đã thiết lập trong hồ sơ sinh viên." request={recommendations} emptyDescription={user?.role === 'STUDENT' ? 'Hãy hoàn thiện nhu cầu tìm phòng để nhận gợi ý phù hợp.' : 'Đăng nhập với tài khoản sinh viên để nhận gợi ý phù hợp.'} emptyAction={user?.role === 'STUDENT' ? <Link to="/student/profile" className="btn btn-outline-primary">Cập nhật nhu cầu</Link> : <Link to="/login" className="btn btn-outline-primary">Đăng nhập</Link>} /></div>

      <section className="page-section">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-5"><div className="section-kicker mb-2">Tìm trọ có định hướng</div><h2 className="section-title">Ba bước để chọn một nơi ở phù hợp</h2><p className="text-muted-app mb-0">Mỗi bước giúp bạn kiểm tra thông tin quan trọng thay vì quyết định dựa trên một ảnh hoặc một lời giới thiệu.</p></div>
            <div className="col-lg-7"><div className="row g-3"><div className="col-md-4"><div className="data-panel h-100"><i className="bi bi-funnel text-primary fs-4" aria-hidden="true" /><h3 className="h6 mt-3">Lọc nhu cầu</h3><p className="small text-muted-app mb-0">Chọn ngân sách, vị trí và tiện ích cần thiết.</p></div></div><div className="col-md-4"><div className="data-panel h-100"><i className="bi bi-map text-primary fs-4" aria-hidden="true" /><h3 className="h6 mt-3">Kiểm tra vị trí</h3><p className="small text-muted-app mb-0">Xem khoảng cách đến trường ngay trên bản đồ.</p></div></div><div className="col-md-4"><div className="data-panel h-100"><i className="bi bi-calendar-check text-primary fs-4" aria-hidden="true" /><h3 className="h6 mt-3">Đặt lịch xem</h3><p className="small text-muted-app mb-0">Chủ động hẹn chủ trọ khi đã sẵn sàng.</p></div></div></div></div>
          </div>
        </div>
      </section>
      <section className="pb-5"><div className="container"><div className="data-panel d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3" style={{ background: '#eaf2ff', borderColor: '#c8dbf6' }}><div><div className="section-kicker mb-2">Ở ghép</div><h2 className="h4 mb-1">Bạn cần người đồng hành khi thuê trọ?</h2><p className="text-muted-app mb-0">Tìm hồ sơ và bài đăng ở ghép theo nhu cầu thực tế.</p></div><Link to="/roommate-posts" className="btn btn-primary"><i className="bi bi-people me-1" aria-hidden="true" />Khám phá ở ghép</Link></div></div></section>
    </>
  );
}
