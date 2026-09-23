import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { getLocation, roomAddress, roomRating } from '../../utils/data';
import { formatCompactCurrency, formatDistance } from '../../utils/formatters';
import { universityCoordinates } from '../../utils/universities';

const DEFAULT_CENTER = [21.0285, 105.8542];

const markerIcon = L.divIcon({
  className: 'room-map-marker',
  html: '<span style="display:grid;width:32px;height:32px;place-items:center;border:2px solid #fff;border-radius:50%;background:#165dca;color:#fff;box-shadow:0 3px 8px rgba(21,34,56,.28)"><i class="bi bi-house-door-fill"></i></span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const universityMarkerIcon = L.divIcon({
  className: 'room-map-marker',
  html: '<span style="display:grid;width:36px;height:36px;place-items:center;border:2px solid #fff;border-radius:50%;background:#6f42c1;color:#fff;box-shadow:0 3px 8px rgba(21,34,56,.28)"><i class="bi bi-mortarboard-fill"></i></span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function ViewUpdater({ selectedRoom, universityLocation }) {
  const map = useMap();
  const selectedRoomLocation = getLocation(selectedRoom);
  useEffect(() => {
    const location = selectedRoomLocation || universityLocation;
    if (!location) return;
    const zoom = selectedRoomLocation ? Math.max(map.getZoom(), 15) : Math.max(map.getZoom(), 13);
    map.flyTo(location, zoom, { duration: 0.45 });
  }, [map, selectedRoomLocation?.[0], selectedRoomLocation?.[1], universityLocation?.[0], universityLocation?.[1]]);
  return null;
}

export default function RoomMap({ rooms = [], university = null, selectedRoomId, onMarkerClick, className = '' }) {
  const locatedRooms = useMemo(() => rooms.flatMap((room) => getLocation(room) ? [{ room, location: getLocation(room) }] : []), [rooms]);
  const selectedRoom = rooms.find((room) => String(room.id) === String(selectedRoomId));
  const universityLocation = universityCoordinates(university);
  const center = getLocation(selectedRoom) || universityLocation || locatedRooms[0]?.location || DEFAULT_CENTER;

  return (
    <div className={`map-shell ${className}`.trim()}>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="map-view" aria-label="Bản đồ các phòng trọ">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ViewUpdater selectedRoom={selectedRoom} universityLocation={universityLocation} />
        {universityLocation && university ? <Marker position={universityLocation} icon={universityMarkerIcon}>
          <Popup>
            <div className="small" style={{ minWidth: 190 }}>
              <strong className="d-block mb-1">Vị trí trường đã chọn</strong>
              <span className="text-muted">Điểm trung tâm để tính khoảng cách tìm phòng.</span>
            </div>
          </Popup>
        </Marker> : null}
        {locatedRooms.map(({ room, location }) => {
          const rating = roomRating(room);
          return (
            <Marker position={location} icon={markerIcon} key={room.id} eventHandlers={{ click: () => onMarkerClick?.(room) }}>
              <Popup>
                <div className="small" style={{ minWidth: 190 }}>
                  <strong className="d-block mb-1">{room.name || room.code || 'Phòng trọ'}</strong>
                  <div className="text-primary fw-bold mb-1">{formatCompactCurrency(room.price)}</div>
                  {roomAddress(room) ? <div className="text-muted mb-1"><i className="bi bi-geo-alt me-1" />{roomAddress(room)}</div> : null}
                  {rating !== null ? <div className="mb-1"><i className="bi bi-star-fill text-warning me-1" />{rating.toFixed(1)}</div> : null}
                  {formatDistance(room.distanceKm ?? room.distance) ? <div className="mb-2">{formatDistance(room.distanceKm ?? room.distance)} đến trường</div> : null}
                  <Link to={`/rooms/${encodeURIComponent(room.id)}${university?.id ? `?universityId=${encodeURIComponent(university.id)}` : ''}`}>Xem chi tiết</Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {rooms.length > 0 && locatedRooms.length === 0 ? <div className="p-3 text-center small text-muted-app">Các phòng hiện chưa có tọa độ để hiển thị trên bản đồ.</div> : null}
    </div>
  );
}
