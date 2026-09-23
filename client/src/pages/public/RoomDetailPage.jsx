import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { appointmentApi, contractApi, reportApi, reviewApi, roomApi } from '../../api/resources';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/AsyncState';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { StatusBadge, VerifiedBadge } from '../../components/common/StatusBadge';
import { MatchScore, PriceDisplay, Rating } from '../../components/rooms/RoomVisuals';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { asArray, collectionFrom, entityFrom, getLocation, getName, roomAddress, roomAmenities, roomDistance, roomImage, roomRating, safeUrl } from '../../utils/data';
import { formatCurrency, formatDate, formatDistance, formatNumber, readableEnum } from '../../utils/formatters';
import { cleanText } from '../../utils/records';

const RoomMap = lazy(() => import('../../components/map/RoomMap'));

function imageSource(image) {
  return typeof image === 'string' ? image : image?.url || image?.imageUrl || null;
}

function RoomGallery({ room }) {
  const images = useMemo(() => {
    const seen = new Set();
    return [roomImage(room), ...asArray(room?.images), ...asArray(room?.roomImages)]
      .map(imageSource)
      .map(safeUrl)
      .filter((url) => url && !seen.has(url) && seen.add(url));
  }, [room]);
  const title = room?.name || room?.code || 'phòng trọ';

  if (!images.length) return <div className="detail-gallery detail-gallery--empty"><div className="detail-gallery__fallback"><i className="bi bi-house-door" aria-hidden="true" /><span>Phòng chưa có ảnh được cập nhật</span></div></div>;
  return (
    <div className="detail-gallery">
      <div className="detail-gallery__main"><img src={images[0]} alt={`Ảnh chính của ${title}`} /></div>
      {images.length > 1 ? <div className="detail-gallery__side">{images.slice(1, 3).map((url, index) => <div className="detail-gallery__item" key={url}><img src={url} alt={`Ảnh ${index + 2} của ${title}`} loading="lazy" /></div>)}</div> : null}
    </div>
  );
}

function DetailItem({ icon, label, children }) {
  return <div className="detail-info-item"><small><i className={`bi ${icon} me-1`} aria-hidden="true" />{label}</small><strong>{children || 'Chưa cập nhật'}</strong></div>;
}

function FavoriteAction({ room }) {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(Boolean(room?.isFavorite));
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/rooms/${room.id}`)}`);
      return;
    }
    if (user?.role !== 'STUDENT') {
      showToast({ variant: 'warning', title: 'Chỉ dành cho sinh viên', message: 'Chức năng lưu phòng dành cho tài khoản sinh viên.' });
      return;
    }
    const previous = isFavorite;
    setIsFavorite(!previous);
    setSaving(true);
    try {
      if (previous) await roomApi.unfavorite(room.id);
      else await roomApi.favorite(room.id);
      showToast({ variant: 'success', title: 'Đã cập nhật', message: previous ? 'Đã bỏ lưu phòng.' : 'Đã lưu phòng vào danh sách yêu thích.' });
    } catch {
      setIsFavorite(previous);
      showToast({ variant: 'danger', title: 'Không thể cập nhật', message: 'Không thể thay đổi danh sách yêu thích. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  return <Button variant={isFavorite ? 'primary' : 'outline'} loading={saving} icon={isFavorite ? 'bi-heart-fill' : 'bi-heart'} onClick={toggle}>{isFavorite ? 'Đã lưu' : 'Lưu phòng'}</Button>;
}

function AppointmentDialog({ room, open, onClose }) {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [scheduledAt, setScheduledAt] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/rooms/${room.id}`)}`);
      return;
    }
    if (user?.role !== 'STUDENT') {
      setError('Chỉ tài khoản sinh viên có thể đặt lịch xem phòng.');
      return;
    }
    const time = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(time.getTime()) || time.getTime() <= Date.now()) {
      setError('Chọn thời gian xem phòng ở tương lai.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await appointmentApi.create({ roomId: room.id, scheduledAt: time.toISOString(), studentNote: cleanText(note, 500) || undefined });
      showToast({ variant: 'success', title: 'Đã gửi yêu cầu', message: 'Yêu cầu đặt lịch xem phòng đang chờ chủ trọ phản hồi.' });
      onClose();
      setScheduledAt('');
      setNote('');
    } catch {
      setError('Không thể tạo lịch xem phòng. Vui lòng kiểm tra lại thông tin và thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return <Modal open={open} title="Đặt lịch xem phòng" onClose={onClose}><form onSubmit={submit} noValidate>{error ? <div className="alert alert-danger" role="alert">{error}</div> : null}<label className="form-label" htmlFor="appointment-time">Thời gian mong muốn</label><input id="appointment-time" className="form-control mb-3" type="datetime-local" value={scheduledAt} min={new Date().toISOString().slice(0, 16)} onChange={(event) => setScheduledAt(event.target.value)} required /><label className="form-label" htmlFor="appointment-note">Ghi chú (không bắt buộc)</label><textarea id="appointment-note" className="form-control mb-4" rows="3" maxLength="500" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ví dụ: Tôi muốn xem phòng cùng phụ huynh." /><div className="d-flex justify-content-end gap-2"><Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button><Button type="submit" loading={saving} icon="bi-calendar-check">Gửi yêu cầu</Button></div></form></Modal>;
}

function ReportDialog({ room, open, onClose }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/rooms/${room.id}`)}`);
      return;
    }
    if (!reason) {
      setError('Chọn lý do báo cáo.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await reportApi.create({ targetType: 'ROOM', roomId: room.id, reason, description: cleanText(detail, 1_000) || undefined });
      showToast({ variant: 'success', title: 'Đã gửi báo cáo', message: 'Chúng tôi sẽ xem xét báo cáo của bạn.' });
      onClose();
      setReason('');
      setDetail('');
    } catch {
      setError('Không thể gửi báo cáo. Vui lòng thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  return <Modal open={open} title="Báo cáo tin đăng" onClose={onClose}><form onSubmit={submit}>{error ? <div className="alert alert-danger" role="alert">{error}</div> : null}<label className="form-label" htmlFor="report-reason">Lý do</label><select id="report-reason" className="form-select mb-3" value={reason} onChange={(event) => setReason(event.target.value)} required><option value="">Chọn lý do</option><option value="WRONG_INFO">Thông tin sai</option><option value="WRONG_IMAGE">Hình ảnh sai</option><option value="WRONG_PRICE">Giá sai</option><option value="ROOM_UNAVAILABLE">Phòng đã hết</option><option value="WRONG_ADDRESS">Địa chỉ sai</option><option value="SCAM">Nghi ngờ lừa đảo</option><option value="OTHER">Lý do khác</option></select><label className="form-label" htmlFor="report-detail">Mô tả thêm (không bắt buộc)</label><textarea id="report-detail" className="form-control mb-4" rows="3" maxLength="1000" value={detail} onChange={(event) => setDetail(event.target.value)} /><div className="d-flex justify-content-end gap-2"><Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button><Button type="submit" variant="danger" loading={saving} icon="bi-flag">Gửi báo cáo</Button></div></form></Modal>;
}

function ReviewDialog({ room, open, onClose, onCreated }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const contractsRequest = useAsyncData(useCallback((signal) => (open && isAuthenticated && user?.role === 'STUDENT'
    ? contractApi.list({ limit: 100 }, signal)
    : Promise.resolve({ items: [] })), [open, isAuthenticated, user?.role]));
  const eligibleContracts = collectionFrom(contractsRequest.data).items.filter((contract) => String(contract.roomId ?? contract.room?.id) === String(room?.id) && ['ACTIVE', 'EXPIRED', 'TERMINATED'].includes(contract.status));
  const [contractId, setContractId] = useState('');
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/rooms/${room.id}`)}`);
      return;
    }
    if (user?.role !== 'STUDENT') {
      setError('Chỉ sinh viên có thể gửi đánh giá.');
      return;
    }
    const numericRating = Number(rating);
    if (!contractId || !eligibleContracts.some((contract) => String(contract.id) === String(contractId))) {
      setError('Chọn hợp đồng thuê hợp lệ cho phòng này trước khi gửi đánh giá.');
      return;
    }
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      setError('Chọn mức đánh giá từ 1 đến 5 sao.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await reviewApi.create({ contractId, rating: numericRating, roomQuality: numericRating, security: numericRating, cleanliness: numericRating, wifiQuality: numericRating, utilityPrice: numericRating, listingAccuracy: numericRating, landlordAttitude: numericRating, comment: cleanText(comment, 1_000) || undefined });
      showToast({ variant: 'success', title: 'Đã gửi đánh giá', message: 'Cảm ơn bạn đã chia sẻ trải nghiệm.' });
      onCreated?.();
      onClose();
      setContractId('');
      setRating('');
      setComment('');
    } catch {
      setError('Không thể gửi đánh giá. Bạn chỉ có thể đánh giá khi đủ điều kiện theo hợp đồng.');
    } finally {
      setSaving(false);
    }
  };

  return <Modal open={open} title="Đánh giá phòng" onClose={onClose}><form onSubmit={submit}>{error ? <div className="alert alert-danger" role="alert">{error}</div> : null}<label className="form-label" htmlFor="review-contract">Hợp đồng thuê</label>{contractsRequest.loading ? <LoadingState compact label="Đang kiểm tra hợp đồng…" /> : eligibleContracts.length ? <select id="review-contract" className="form-select mb-3" value={contractId} onChange={(event) => setContractId(event.target.value)} required><option value="">Chọn hợp đồng đã/đang thuê</option>{eligibleContracts.map((contract) => <option key={contract.id} value={contract.id}>{contract.contractNumber || `Hợp đồng #${contract.id}`}</option>)}</select> : <div className="alert alert-warning small" role="status">Bạn cần có hợp đồng đã hoặc đang hiệu lực cho phòng này trước khi gửi đánh giá.</div>}<label className="form-label" htmlFor="review-rating">Mức đánh giá chung</label><select id="review-rating" className="form-select mb-2" value={rating} onChange={(event) => setRating(event.target.value)} required disabled={!eligibleContracts.length || contractsRequest.loading}><option value="">Chọn số sao</option><option value="5">5 sao — Rất hài lòng</option><option value="4">4 sao — Hài lòng</option><option value="3">3 sao — Bình thường</option><option value="2">2 sao — Chưa hài lòng</option><option value="1">1 sao — Không hài lòng</option></select><p className="form-text mb-3">Điểm chung sẽ được lưu nhất quán cho các tiêu chí chất lượng, an ninh, vệ sinh, Wi‑Fi, chi phí, độ chính xác và thái độ chủ trọ.</p><label className="form-label" htmlFor="review-comment">Nhận xét (không bắt buộc)</label><textarea id="review-comment" className="form-control mb-4" rows="4" maxLength="1000" value={comment} disabled={!eligibleContracts.length || contractsRequest.loading} onChange={(event) => setComment(event.target.value)} /><div className="d-flex justify-content-end gap-2"><Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button><Button type="submit" loading={saving} disabled={!eligibleContracts.length || contractsRequest.loading} icon="bi-star">Gửi đánh giá</Button></div></form></Modal>;
}

function PriceHistory({ request }) {
  const { items } = collectionFrom(request.data);
  if (request.loading) return <LoadingState compact label="Đang tải lịch sử giá…" />;
  if (request.error) return <p className="small text-muted-app mb-0">Không thể tải lịch sử giá ở thời điểm này.</p>;
  if (!items.length) return <p className="text-muted-app mb-0">Chưa có thay đổi giá được ghi nhận.</p>;
  return <div className="table-responsive"><table className="table table-sm mb-0"><thead><tr><th>Thời điểm</th><th>Giá trước</th><th>Giá mới</th></tr></thead><tbody>{items.map((item) => <tr key={item.id || `${item.changedAt}-${item.newPrice}`}><td>{formatDate(item.changedAt || item.createdAt)}</td><td>{formatCurrency(item.oldPrice)}</td><td className="fw-semibold text-primary">{formatCurrency(item.newPrice ?? item.price)}</td></tr>)}</tbody></table></div>;
}

function ReviewList({ request, onWrite }) {
  const { items } = collectionFrom(request.data);
  if (request.loading) return <LoadingState compact label="Đang tải đánh giá…" />;
  if (request.error) return <p className="small text-muted-app mb-0">Chưa thể tải đánh giá vào lúc này.</p>;
  return <>{items.length ? <div className="vstack gap-3">{items.map((review) => <article className="review-item" key={review.id}><div className="d-flex align-items-start justify-content-between gap-3"><div><strong>{getName(review.student?.user || review.student || review.user || review.author) || 'Người dùng đã đánh giá'}</strong><div className="small text-muted-app">{formatDate(review.createdAt)}</div></div><Rating value={review.rating ?? review.overallRating} /></div>{review.comment ? <p className="mb-0 mt-2">{review.comment}</p> : null}</article>)}</div> : <EmptyState icon="bi-star" title="Chưa có đánh giá" description="Các đánh giá đủ điều kiện sẽ xuất hiện tại đây." />}{onWrite ? <Button variant="outline" className="mt-3" icon="bi-star" onClick={onWrite}>Viết đánh giá</Button> : null}</>;
}

export function RoomDetailPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const universityId = searchParams.get('universityId');
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const detailRequest = useAsyncData(useCallback((signal) => roomApi.detail(roomId, universityId ? { universityId } : undefined, signal), [roomId, universityId]));
  const priceHistoryRequest = useAsyncData(useCallback((signal) => roomApi.priceHistory(roomId, signal), [roomId]));
  const reviewsRequest = useAsyncData(useCallback((signal) => roomApi.reviews(roomId, { limit: 20 }, signal), [roomId]));
  const nearbyRequest = useAsyncData(useCallback((signal) => roomApi.nearbyPlaces(roomId, signal), [roomId]));
  const room = entityFrom(detailRequest.data);

  if (detailRequest.loading) return <main className="container py-5"><LoadingState label="Đang tải thông tin phòng…" /></main>;
  if (detailRequest.error) return <main className="container py-5"><ErrorState message={detailRequest.error} onRetry={detailRequest.reload} /></main>;
  if (!room) return <main className="container py-5"><EmptyState icon="bi-house-door" title="Không tìm thấy phòng" description="Phòng có thể đã bị gỡ hoặc không còn công khai." action={<Link to="/rooms" className="btn btn-primary">Quay lại tìm phòng</Link>} /></main>;

  const amenities = roomAmenities(room);
  const nearbyPlaces = collectionFrom(nearbyRequest.data).items;
  const landlord = room?.property?.landlord || room?.landlord || room?.property?.owner;
  const rating = roomRating(room);
  const location = getLocation(room);
  const matchReasons = asArray(room.matchReasons || room.match?.reasons);
  const travel = room.travelTime || room.travelTimes || {};

  return (
    <main className="room-detail-page py-4 py-lg-5">
      <div className="container">
        <nav aria-label="Điều hướng breadcrumb" className="small mb-3"><Link to="/">Trang chủ</Link><span className="mx-2 text-muted-app">/</span><Link to="/rooms">Tìm phòng</Link><span className="mx-2 text-muted-app">/</span><span className="text-muted-app">{room.name || room.code || 'Chi tiết phòng'}</span></nav>
        <RoomGallery room={room} />
        <div className="row g-4 mt-1">
          <div className="col-lg-8">
            <header className="py-4 border-bottom border-app"><div className="d-flex align-items-start justify-content-between gap-3"><div><div className="d-flex align-items-center flex-wrap gap-2 mb-2">{room.status ? <StatusBadge status={room.status} /> : null}<VerifiedBadge status={landlord?.verificationStatus} /></div><h1 className="page-title mb-2">{room.name || room.code || 'Phòng trọ'}</h1><p className="mb-0 text-muted-app"><i className="bi bi-geo-alt me-1" aria-hidden="true" />{roomAddress(room) || 'Địa chỉ đang cập nhật'}</p></div><div className="text-end"><PriceDisplay value={room.price} className="fs-4 d-block" />{rating !== null ? <div className="mt-2"><Rating value={rating} count={room.reviewCount} /></div> : null}</div></div></header>

            {Number.isFinite(Number(room.matchScore ?? room.match?.score)) ? <div className="data-panel my-4"><div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2"><div><h2 className="h6 mb-1">Mức độ phù hợp với nhu cầu của bạn</h2><p className="small text-muted-app mb-0">Điểm gợi ý do hệ thống tính từ các tiêu chí hồ sơ, không thay thế quyết định xem phòng thực tế.</p></div><MatchScore score={room.matchScore ?? room.match?.score} reasons={matchReasons} /></div>{matchReasons.length ? <ul className="small text-muted-app mb-0 mt-3 ps-3">{matchReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : null}</div> : null}

            <section className="py-4 border-bottom border-app"><h2 className="h5 mb-3">Thông tin quan trọng</h2><div className="detail-info-grid"><DetailItem icon="bi-aspect-ratio" label="Diện tích">{Number.isFinite(Number(room.area)) ? `${formatNumber(room.area)} m²` : null}</DetailItem><DetailItem icon="bi-people" label="Sức chứa">{Number.isFinite(Number(room.capacity)) ? `${formatNumber(room.capacity)} người` : null}</DetailItem><DetailItem icon="bi-door-open" label="Chỗ trống">{Number.isFinite(Number(room.availableSlots)) ? `${formatNumber(room.availableSlots)} chỗ` : null}</DetailItem><DetailItem icon="bi-signpost-2" label="Cách trường">{formatDistance(roomDistance(room))}</DetailItem><DetailItem icon="bi-building" label="Loại phòng">{readableEnum(room.type)}</DetailItem><DetailItem icon="bi-cash-stack" label="Tiền cọc">{formatCurrency(room.deposit)}</DetailItem></div></section>

            <section className="py-4 border-bottom border-app"><h2 className="h5 mb-2">Mô tả</h2><p className="text-muted-app mb-0 room-description">{room.description || 'Chủ trọ chưa cập nhật mô tả chi tiết cho phòng này.'}</p></section>

            <section className="py-4 border-bottom border-app"><h2 className="h5 mb-3">Tiện ích</h2>{amenities.length ? <div className="d-flex flex-wrap gap-2">{amenities.map((amenity) => <span className="amenity-chip" key={typeof amenity === 'string' ? amenity : amenity.id || amenity.name}><i className="bi bi-check2" aria-hidden="true" />{typeof amenity === 'string' ? amenity : amenity.name}</span>)}</div> : <p className="text-muted-app mb-0">Chưa có tiện ích nào được cập nhật.</p>}</section>

            <section className="py-4 border-bottom border-app"><h2 className="h5 mb-3">Chi phí hàng tháng</h2><div className="table-responsive"><table className="table table-sm mb-0"><tbody><tr><th>Tiền phòng</th><td className="text-end fw-semibold text-primary">{formatCurrency(room.price)}</td></tr><tr><th>Điện</th><td className="text-end">{formatCurrency(room.electricityPrice ?? room.electricityRate)}</td></tr><tr><th>Nước</th><td className="text-end">{formatCurrency(room.waterPrice ?? room.waterRate)}</td></tr><tr><th>Internet</th><td className="text-end">{formatCurrency(room.internetFee)}</td></tr><tr><th>Gửi xe</th><td className="text-end">{formatCurrency(room.parkingFee)}</td></tr></tbody></table></div></section>

            <section className="py-4 border-bottom border-app"><div className="d-flex align-items-center justify-content-between gap-3 mb-3"><h2 className="h5 mb-0">Vị trí & di chuyển</h2>{Number.isFinite(Number(room.locationScore)) ? <span className="status-badge status-badge--success"><i className="bi bi-geo-alt-fill" aria-hidden="true" />{Number(room.locationScore).toFixed(1)}/10 vị trí</span> : null}</div>{location ? <Suspense fallback={<LoadingState compact label="Đang tải bản đồ…" />}><RoomMap rooms={[room]} selectedRoomId={room.id} /></Suspense> : <p className="text-muted-app">Chủ trọ chưa cập nhật tọa độ chính xác của phòng.</p>}<div className="d-flex flex-wrap gap-3 small text-muted-app mt-3">{formatDistance(roomDistance(room)) ? <span><i className="bi bi-signpost-2 me-1" aria-hidden="true" />Cách trường: {formatDistance(roomDistance(room))}</span> : null}{travel.walkingMinutes ?? travel.walking ? <span><i className="bi bi-person-walking me-1" aria-hidden="true" />Đi bộ: ~{travel.walkingMinutes ?? travel.walking} phút</span> : null}{travel.bicycleMinutes ?? travel.cyclingMinutes ?? travel.cycling ? <span><i className="bi bi-bicycle me-1" aria-hidden="true" />Xe đạp: ~{travel.bicycleMinutes ?? travel.cyclingMinutes ?? travel.cycling} phút</span> : null}{travel.motorbikeMinutes ?? travel.motorbike ? <span><i className="bi bi-scooter me-1" aria-hidden="true" />Xe máy: ~{travel.motorbikeMinutes ?? travel.motorbike} phút</span> : null}</div></section>

            <section className="py-4 border-bottom border-app"><h2 className="h5 mb-3">Tiện ích xung quanh</h2>{nearbyRequest.loading ? <LoadingState compact label="Đang tải tiện ích xung quanh…" /> : nearbyRequest.error ? <p className="text-muted-app mb-0">Chưa thể tải tiện ích xung quanh vào lúc này.</p> : nearbyPlaces.length ? <div className="nearby-place-grid">{nearbyPlaces.map((place) => <div className="nearby-place" key={place.id || `${place.name}-${place.address}`}><i className="bi bi-geo-alt" aria-hidden="true" /><div><strong>{place.name || 'Địa điểm lân cận'}</strong><p className="small text-muted-app mb-0">{place.category || place.type || 'Tiện ích'}{formatDistance(place.distanceKm ?? place.distance) ? ` · ${formatDistance(place.distanceKm ?? place.distance)}` : ''}</p></div></div>)}</div> : <p className="text-muted-app mb-0">Chưa có tiện ích xung quanh được cập nhật.</p>}</section>

            <section className="py-4 border-bottom border-app"><h2 className="h5 mb-3">Lịch sử giá</h2><PriceHistory request={priceHistoryRequest} /></section>
            <section className="py-4"><h2 className="h5 mb-3">Đánh giá</h2><ReviewList request={reviewsRequest} onWrite={() => setReviewOpen(true)} /></section>
          </div>

          <aside className="col-lg-4"><div className="detail-sidebar"><div className="data-panel"><div className="d-flex align-items-start justify-content-between gap-2"><div><div className="small text-muted-app">Giá thuê</div><PriceDisplay value={room.price} className="fs-4" /></div>{room.status ? <StatusBadge status={room.status} /> : null}</div><div className="d-grid gap-2 mt-4"><Button icon="bi-calendar-check" onClick={() => setAppointmentOpen(true)}>Đặt lịch xem phòng</Button><FavoriteAction room={room} /><Link to={`/student/roommate-posts?roomId=${encodeURIComponent(room.id)}`} className="btn btn-light"><i className="bi bi-people me-1" aria-hidden="true" />Tìm người ở ghép</Link></div><button type="button" className="btn btn-link btn-sm p-0 mt-3" onClick={() => setReportOpen(true)}><i className="bi bi-flag me-1" aria-hidden="true" />Báo cáo tin đăng</button></div><div className="data-panel mt-3"><div className="d-flex align-items-center gap-3"><div className="avatar-placeholder"><i className="bi bi-person" aria-hidden="true" /></div><div><h2 className="h6 mb-1">{getName(landlord) || 'Chủ trọ'}</h2>{landlord?.phone ? <p className="small text-muted-app mb-0">{landlord.phone}</p> : <p className="small text-muted-app mb-0">Thông tin liên hệ do chủ trọ cập nhật.</p>}</div></div>{landlord?.verificationStatus === 'VERIFIED' ? <VerifiedBadge status="VERIFIED" /> : null}<Link to={landlord?.id ? `/student/chat?userId=${encodeURIComponent(landlord.id)}` : '/student/chat'} className="btn btn-outline-primary w-100 mt-3"><i className="bi bi-chat-dots me-1" aria-hidden="true" />Nhắn chủ trọ</Link></div></div></aside>
        </div>
      </div>
      <AppointmentDialog room={room} open={appointmentOpen} onClose={() => setAppointmentOpen(false)} />
      <ReportDialog room={room} open={reportOpen} onClose={() => setReportOpen(false)} />
      <ReviewDialog room={room} open={reviewOpen} onClose={() => setReviewOpen(false)} onCreated={reviewsRequest.reload} />
    </main>
  );
}
