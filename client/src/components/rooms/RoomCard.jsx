import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { roomApi } from '../../api/resources';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { roomAddress, roomDistance, roomImage, roomRating, safeUrl } from '../../utils/data';
import { formatDistance, formatNumber } from '../../utils/formatters';
import { PriceDisplay, Rating } from './RoomVisuals';
import { VerifiedBadge } from '../common/StatusBadge';

function FavoriteButton({ room }) {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFavorite, setIsFavorite] = useState(Boolean(room?.isFavorite));
  const [saving, setSaving] = useState(false);

  useEffect(() => setIsFavorite(Boolean(room?.isFavorite)), [room?.id, room?.isFavorite]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
      return;
    }
    if (user?.role !== 'STUDENT') {
      showToast({ variant: 'warning', title: 'Chỉ dành cho sinh viên', message: 'Chức năng lưu phòng hiện dành cho tài khoản sinh viên.' });
      return;
    }

    const beforeChange = isFavorite;
    setIsFavorite(!beforeChange);
    setSaving(true);
    try {
      if (beforeChange) await roomApi.unfavorite(room.id);
      else await roomApi.favorite(room.id);
      showToast({ variant: 'success', title: 'Đã cập nhật', message: beforeChange ? 'Đã bỏ phòng khỏi danh sách yêu thích.' : 'Đã lưu phòng vào danh sách yêu thích.' });
    } catch {
      setIsFavorite(beforeChange);
      showToast({ variant: 'danger', title: 'Không thể cập nhật', message: 'Không thể thay đổi danh sách yêu thích. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <button type="button" className={`btn btn-sm ${isFavorite ? 'btn-primary' : 'btn-light'} favorite-button`} aria-label={isFavorite ? 'Bỏ yêu thích phòng' : 'Lưu phòng yêu thích'} aria-pressed={isFavorite} disabled={saving} onClick={toggleFavorite}>
      {saving ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className={`bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'}`} aria-hidden="true" />}
    </button>
  );
}

export function RoomCard({ room, compact = false, selectedForCompare = false, onCompareChange, onSelect }) {
  const location = useLocation();
  const imageUrl = safeUrl(roomImage(room));
  const address = roomAddress(room);
  const rating = roomRating(room);
  const distance = formatDistance(roomDistance(room));
  const name = room?.name || room?.code || 'Phòng trọ';
  const universityId = new URLSearchParams(location.search).get('universityId');
  const roomUrl = `/rooms/${encodeURIComponent(room?.id ?? '')}${universityId ? `?universityId=${encodeURIComponent(universityId)}` : ''}`;

  return (
    <article className="room-card" onClick={onSelect}>
      <div className="room-card__media">
        <Link to={roomUrl} aria-label={`Xem chi tiết ${name}`}>
          {imageUrl ? <img src={imageUrl} alt={`Ảnh ${name}`} loading="lazy" /> : <span className="room-card__fallback"><i className="bi bi-house-door" aria-hidden="true" /></span>}
        </Link>
        <FavoriteButton room={room} />
      </div>
      <div className="room-card__body">
        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
          <PriceDisplay value={room?.price} />
          <VerifiedBadge status={room?.property?.landlord?.verificationStatus || room?.landlord?.verificationStatus} />
        </div>
        <Link to={roomUrl} className="room-card__title mb-1">{name}</Link>
        {address ? <p className="room-card__address mb-3"><i className="bi bi-geo-alt me-1" aria-hidden="true" />{address}</p> : <p className="room-card__address mb-3">Địa chỉ đang cập nhật</p>}
        <div className="room-card__meta mb-3">
          {Number.isFinite(Number(room?.area)) ? <span><i className="bi bi-aspect-ratio" aria-hidden="true" />{formatNumber(room.area)} m²</span> : null}
          {Number.isFinite(Number(room?.availableSlots)) ? <span><i className="bi bi-people" aria-hidden="true" />{formatNumber(room.availableSlots)} chỗ trống</span> : null}
          {distance ? <span><i className="bi bi-signpost-2" aria-hidden="true" />{distance}</span> : null}
        </div>
        {!compact ? <div className="d-flex align-items-center justify-content-between gap-2 pt-2 border-top border-app"><span className="small text-muted-app">{rating !== null ? <Rating value={rating} count={room?.reviewCount} /> : 'Chưa có đánh giá'}</span>{onCompareChange ? <label className="small d-inline-flex align-items-center gap-1 mb-0"><input className="form-check-input mt-0" type="checkbox" checked={selectedForCompare} onChange={(event) => onCompareChange(room, event.target.checked)} /> So sánh</label> : null}</div> : null}
      </div>
    </article>
  );
}
