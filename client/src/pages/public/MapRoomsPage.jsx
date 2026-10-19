import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { roomApi, universityApi } from '../../api/resources';
import { ErrorState, LoadingState } from '../../components/common/AsyncState';
import { Button } from '../../components/common/Button';
import { SearchFilters } from '../../components/rooms/SearchFilters';
import { RoomCard } from '../../components/rooms/RoomCard';
import { useAsyncData } from '../../hooks/useAsyncData';
import { collectionFrom } from '../../utils/data';
import { primaryUniversityFrom, prioritizeUniversities } from '../../utils/universities';

const RoomMap = lazy(() => import('../../components/map/RoomMap'));
const DEFAULT_FILTERS = { q: '', minPrice: '', maxPrice: '', district: '', universityId: '', radiusKm: '3', minArea: '', minCapacity: '', type: '', amenitySlugs: [], sort: 'newest', page: 1 };

function filtersFromParams(searchParams) {
  return {
    ...DEFAULT_FILTERS,
    q: searchParams.get('q') || searchParams.get('keyword') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    district: searchParams.get('district') || searchParams.get('area') || '',
    universityId: searchParams.get('universityId') || '',
    radiusKm: searchParams.get('radiusKm') || searchParams.get('radius') || '3',
    minArea: searchParams.get('minArea') || '',
    minCapacity: searchParams.get('minCapacity') || searchParams.get('capacity') || '',
    type: searchParams.get('type') || '',
    amenitySlugs: (searchParams.get('amenitySlugs') || searchParams.get('amenities') || '').split(',').filter(Boolean),
    sort: searchParams.get('sort') || 'newest',
  };
}

function paramsFromFilters(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'page' || value === '' || value === undefined || value === null) continue;
    if (key === 'amenitySlugs' && value.length) params.set(key, value.join(','));
    else if (key !== 'amenitySlugs') params.set(key, String(value));
  }
  return params;
}

export function MapRoomsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtersKey = searchParams.toString();
  const filters = useMemo(() => filtersFromParams(searchParams), [filtersKey]);
  const [draft, setDraft] = useState(() => filtersFromParams(searchParams));
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const universitiesRequest = useAsyncData(useCallback((signal) => universityApi.list({ limit: 50 }, signal), []));
  const universities = collectionFrom(universitiesRequest.data).items;
  const primaryUniversity = useMemo(() => primaryUniversityFrom(universities), [universities]);
  const prioritizedUniversities = useMemo(() => prioritizeUniversities(universities, primaryUniversity), [universities, primaryUniversity]);
  const initializedPrimary = useRef(false);
  const mapUniversity = useMemo(
    () => universities.find((university) => String(university.id) === String(filters.universityId)) || primaryUniversity,
    [universities, filters.universityId, primaryUniversity]
  );
  // After the first preferred-school selection, a blank value is a valid
  // “all schools” filter and must continue to fetch room data.
  const roomsReady = initializedPrimary.current || (!universitiesRequest.loading && !primaryUniversity?.id);
  const roomsRequest = useAsyncData(useCallback((signal) => roomApi.search({ ...filters, amenitySlugs: filters.amenitySlugs.length ? filters.amenitySlugs : undefined, limit: 50 }, signal), [filtersKey]), [filtersKey], roomsReady);
  const rooms = collectionFrom(roomsRequest.data).items;

  useEffect(() => {
    setDraft(filters);
  }, [filtersKey]);

  useEffect(() => {
    if (initializedPrimary.current || !primaryUniversity?.id) return;
    initializedPrimary.current = true;
    if (filters.universityId) return;
    const next = { ...filters, universityId: String(primaryUniversity.id), radiusKm: filters.radiusKm || '3' };
    setDraft(next);
    setSearchParams(paramsFromFilters(next), { replace: true });
  }, [filtersKey, primaryUniversity?.id]);

  useEffect(() => {
    if (selectedRoomId && !rooms.some((room) => String(room.id) === String(selectedRoomId))) setSelectedRoomId(null);
  }, [rooms, selectedRoomId]);

  const applyFilters = () => {
    setSearchParams(paramsFromFilters(draft));
    setFilterOpen(false);
  };

  const resetFilters = () => {
    const next = primaryUniversity?.id ? { ...DEFAULT_FILTERS, universityId: String(primaryUniversity.id) } : DEFAULT_FILTERS;
    setDraft(next);
    setSearchParams(paramsFromFilters(next));
  };

  return (
    <section className="map-page">
      <div className="container py-4 py-lg-5">
        <header className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
          <div><div className="section-kicker mb-2">Bản đồ phòng trọ</div><h1 className="page-title mb-2">Khám phá phòng theo vị trí</h1><p className="text-muted-app mb-0">Trường đang chọn là tâm bản đồ; chọn một phòng hoặc marker để xem vị trí tương ứng.</p></div>
          <div className="d-flex gap-2"><Link to={`/rooms${filtersKey ? `?${filtersKey}` : ''}`} className="btn btn-light"><i className="bi bi-list-ul me-1" aria-hidden="true" />Dạng danh sách</Link><Button variant="outline" icon="bi-funnel" onClick={() => setFilterOpen(true)}>Lọc phòng</Button></div>
        </header>

        {roomsRequest.error ? <ErrorState message={roomsRequest.error} onRetry={roomsRequest.reload} /> : (
          <div className="map-search-grid">
            <aside className="map-results-panel" aria-label="Danh sách phòng trên bản đồ">
              <div className="p-3 border-bottom border-app"><strong>{roomsRequest.loading ? 'Đang tải phòng…' : `${rooms.length} phòng hiển thị`}</strong><p className="small text-muted-app mb-0 mt-1">Chỉ các phòng có tọa độ mới hiện marker.</p></div>
              {roomsRequest.loading ? <LoadingState label="Đang tải dữ liệu bản đồ…" /> : rooms.length ? <div className="map-room-list">{rooms.map((room) => <div key={room.id} className={String(room.id) === String(selectedRoomId) ? 'map-room-list__item is-selected' : 'map-room-list__item'}><RoomCard room={room} compact onSelect={() => setSelectedRoomId(room.id)} /></div>)}</div> : <div className="p-3 text-center text-muted-app">Không có phòng phù hợp với bộ lọc hiện tại.</div>}
            </aside>
            <div className="map-main-panel">
              <Suspense fallback={<LoadingState label="Đang tải bản đồ…" />}><RoomMap rooms={rooms} university={mapUniversity} selectedRoomId={selectedRoomId} onMarkerClick={(room) => setSelectedRoomId(room.id)} /></Suspense>
            </div>
          </div>
        )}
      </div>

      {filterOpen ? <div className="confirmation-backdrop" role="presentation"><aside className="confirmation-dialog modal-panel overflow-auto" role="dialog" aria-modal="true" aria-label="Bộ lọc phòng trên bản đồ"><SearchFilters values={draft} universities={prioritizedUniversities} primaryUniversity={primaryUniversity} universitiesLoading={universitiesRequest.loading} onChange={setDraft} onApply={applyFilters} onReset={resetFilters} /><button type="button" className="btn btn-ghost w-100 mt-2" onClick={() => setFilterOpen(false)}>Đóng</button></aside></div> : null}
    </section>
  );
}
