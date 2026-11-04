import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { roomApi, universityApi } from '../../api/resources';
import { ErrorState, LoadingState } from '../../components/common/AsyncState';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { RoomList } from '../../components/rooms/RoomList';
import { SearchFilters } from '../../components/rooms/SearchFilters';
import { useToast } from '../../context/ToastContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { collectionFrom } from '../../utils/data';
import { formatNumber } from '../../utils/formatters';
import { primaryUniversityFrom, prioritizeUniversities } from '../../utils/universities';

const DEFAULT_FILTERS = { q: '', minPrice: '', maxPrice: '', district: '', universityId: '', radiusKm: '3', minArea: '', minCapacity: '', type: '', amenitySlugs: [], sort: 'newest', page: 1 };

function filtersFromSearch(searchParams) {
  return {
    ...DEFAULT_FILTERS,
    q: searchParams.get('q') || searchParams.get('keyword') || '', minPrice: searchParams.get('minPrice') || '', maxPrice: searchParams.get('maxPrice') || '', district: searchParams.get('district') || searchParams.get('area') || '',
    universityId: searchParams.get('universityId') || '', radiusKm: searchParams.get('radiusKm') || searchParams.get('radius') || '3', minArea: searchParams.get('minArea') || '', minCapacity: searchParams.get('minCapacity') || searchParams.get('capacity') || '',
    type: searchParams.get('type') || '', amenitySlugs: (searchParams.get('amenitySlugs') || searchParams.get('amenities') || '').split(',').filter(Boolean), sort: searchParams.get('sort') || 'newest', page: Number(searchParams.get('page')) || 1,
  };
}

function filtersToSearch(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'amenitySlugs') {
      if (value.length) params.set(key, value.join(','));
      return;
    }
    if (value !== '' && value !== undefined && value !== null && !(key === 'page' && value === 1)) params.set(key, String(value));
  });
  return params;
}

function requestParams(filters) { return { ...filters, amenitySlugs: filters.amenitySlugs.length ? filters.amenitySlugs : undefined, limit: 12 }; }

export function SearchRoomsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState(() => filtersFromSearch(searchParams));
  const [filters, setFilters] = useState(() => filtersFromSearch(searchParams));
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const universitiesRequest = useAsyncData(useCallback((signal) => universityApi.list({ limit: 50 }, signal), []));
  const universities = collectionFrom(universitiesRequest.data).items;
  const primaryUniversity = useMemo(() => primaryUniversityFrom(universities), [universities]);
  const prioritizedUniversities = useMemo(() => prioritizeUniversities(universities, primaryUniversity), [universities, primaryUniversity]);
  const initializedPrimary = useRef(false);
  // Wait only for the initial preferred-school selection. Once that default is
  // established, an intentionally blank university value means “all schools”.
  const roomsReady = initializedPrimary.current || (!universitiesRequest.loading && !primaryUniversity?.id);

  useEffect(() => {
    if (initializedPrimary.current || !primaryUniversity?.id) return;
    initializedPrimary.current = true;
    if (filters.universityId) return;
    const next = { ...filters, universityId: String(primaryUniversity.id), radiusKm: filters.radiusKm || '3', page: 1 };
    setDraft(next);
    setFilters(next);
    setSearchParams(filtersToSearch(next), { replace: true });
  }, [primaryUniversity?.id]);

  const roomsRequest = useAsyncData(useCallback((signal) => roomApi.search(requestParams(filters), signal), [filters]), [filters], roomsReady);
  const { items: rooms, meta } = collectionFrom(roomsRequest.data);
  const totalResults = Number(meta.total ?? meta.totalItems ?? meta.count);
  const totalPages = Number(meta.totalPages ?? meta.pages ?? 1);

  const applyFilters = () => {
    const next = { ...draft, page: 1 };
    setFilters(next);
    setDraft(next);
    setSelectedIds([]);
    setSearchParams(filtersToSearch(next));
    setFilterOpen(false);
  };

  const resetFilters = () => {
    const next = primaryUniversity?.id ? { ...DEFAULT_FILTERS, universityId: String(primaryUniversity.id) } : DEFAULT_FILTERS;
    setDraft(next);
    setFilters(next);
    setSelectedIds([]);
    setSearchParams(filtersToSearch(next));
  };

  const changePage = (page) => {
    const next = { ...filters, page };
    setFilters(next);
    setDraft(next);
    setSearchParams(filtersToSearch(next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompareChange = (room, checked) => {
    const id = String(room.id);
    setSelectedIds((current) => {
      if (!checked) return current.filter((item) => item !== id);
      if (current.length >= 4) {
        showToast({ variant: 'warning', title: 'Tối đa 4 phòng', message: 'Bạn có thể so sánh tối đa bốn phòng cùng lúc.' });
        return current;
      }
      return [...current, id];
    });
  };

  const openComparison = () => navigate(`/student/compare?ids=${encodeURIComponent(selectedIds.join(','))}`);
  const resultLabel = useMemo(() => Number.isFinite(totalResults) ? `${formatNumber(totalResults)} phòng phù hợp` : 'Kết quả tìm kiếm', [totalResults]);

  return (
    <section className="page-section"><div className="container">
      <header className="mb-4"><div className="section-kicker mb-2">Tìm phòng</div><h1 className="page-title mb-2">Tìm không gian phù hợp với bạn</h1><p className="text-muted-app mb-0">Lọc trực tiếp từ dữ liệu hệ thống theo giá, vị trí, trường học và tiện ích.{primaryUniversity ? ' Kết quả mặc định ưu tiên theo trường đang chọn.' : ''}</p></header>
      <div className="filter-drawer mb-3"><Button variant="outline" icon="bi-funnel" onClick={() => setFilterOpen(true)}>Bộ lọc</Button></div>
      <div className="search-layout">
        <aside className="filter-panel data-panel"><SearchFilters values={draft} universities={prioritizedUniversities} primaryUniversity={primaryUniversity} universitiesLoading={universitiesRequest.loading} onChange={setDraft} onApply={applyFilters} onReset={resetFilters} /></aside>
        <div>
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3"><div><strong>{roomsRequest.loading ? <LoadingState compact label="Đang tìm phòng…" /> : resultLabel}</strong>{filters.q ? <span className="text-muted-app"> cho “{filters.q}”</span> : null}</div><div className="d-flex align-items-center gap-2"><Link to={`/map?${filtersToSearch(filters).toString()}`} className="btn btn-light"><i className="bi bi-map me-1" aria-hidden="true" />Bản đồ</Link><label className="visually-hidden" htmlFor="sort-rooms">Sắp xếp</label><select id="sort-rooms" className="form-select" style={{ minWidth: 185 }} value={filters.sort} onChange={(event) => { const next = { ...filters, sort: event.target.value, page: 1 }; setFilters(next); setDraft(next); setSearchParams(filtersToSearch(next)); }}><option value="newest">Mới đăng</option><option value="price_asc">Giá tăng dần</option><option value="price_desc">Giá giảm dần</option><option value="nearest">Gần trường nhất</option><option value="rating_desc">Đánh giá cao nhất</option><option value="match_desc">Phù hợp nhất</option></select></div></div>
          {roomsRequest.error ? <ErrorState message={roomsRequest.error} onRetry={roomsRequest.reload} /> : <RoomList rooms={rooms} loading={roomsRequest.loading} selectedIds={selectedIds} onCompareChange={handleCompareChange} />}
          <div className="mt-4"><Pagination page={filters.page} totalPages={totalPages} onPageChange={changePage} /></div>
        </div>
      </div>
      {selectedIds.length > 0 ? <div className="position-fixed bottom-0 start-0 end-0 p-3" style={{ zIndex: 1020, pointerEvents: 'none' }}><div className="container"><div className="data-panel d-flex align-items-center justify-content-between gap-3 shadow" style={{ pointerEvents: 'auto' }}><span><strong>{selectedIds.length} phòng đã chọn</strong><span className="text-muted-app ms-2">Tối đa 4 phòng</span></span><Button icon="bi-columns-gap" onClick={openComparison}>So sánh phòng</Button></div></div></div> : null}
      {filterOpen ? <div className="confirmation-backdrop" role="presentation"><aside className="confirmation-dialog overflow-auto" role="dialog" aria-modal="true" aria-label="Bộ lọc phòng" style={{ maxHeight: 'calc(100vh - 32px)' }}><SearchFilters values={draft} universities={prioritizedUniversities} primaryUniversity={primaryUniversity} universitiesLoading={universitiesRequest.loading} onChange={setDraft} onApply={applyFilters} onReset={resetFilters} closeLabel="đóng" /><button type="button" className="btn btn-ghost w-100 mt-2" onClick={() => setFilterOpen(false)}>Đóng</button></aside></div> : null}
    </div></section>
  );
}
