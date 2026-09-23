import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  appointmentApi,
  contractApi,
  dashboardApi,
  invoiceApi,
  landlordRoomApi,
  propertyApi,
  reviewApi,
  roomApi,
  tenantApi,
  userApi,
} from '../../api/resources';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/AsyncState';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { MetricCards, ResourceTable, SimpleRecordList } from '../../components/common/ResourceTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ChatWorkspace } from '../../components/chat/ChatWorkspace';
import { VerificationRequestPanel } from '../../components/verifications/VerificationRequestPanel';
import { useToast } from '../../context/ToastContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { asArray, collectionFrom, entityFrom, getAccountLoginDetails, getAccountOptionLabel } from '../../utils/data';
import { formatCurrency, formatDate, formatNumber, readableEnum } from '../../utils/formatters';
import { cleanText, numericOrUndefined, valueAt } from '../../utils/records';

function metricValue(source, paths) {
  for (const path of paths) {
    const value = valueAt(source, path);
    if (Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function Panel({ title, action, className = '', children }) {
  return <section className={`data-panel ${className}`.trim()}><div className="d-flex align-items-center justify-content-between gap-3 mb-3"><h2 className="h6 mb-0">{title}</h2>{action}</div>{children}</section>;
}

function RequestContent({ request, label, children }) {
  if (request.loading) return <LoadingState label={label} />;
  if (request.error) return <ErrorState message={request.error} onRetry={request.reload} />;
  return children;
}

function PropertyForm({ property, onSubmit, saving }) {
  const initialLocation = property?.latitude !== undefined && property?.latitude !== null && property?.longitude !== undefined && property?.longitude !== null
    ? { displayName: property.address || 'Vị trí đã lưu', latitude: Number(property.latitude), longitude: Number(property.longitude) }
    : null;
  const [values, setValues] = useState(() => ({
    name: property?.name || '',
    description: property?.description || '',
    address: property?.address || '',
    latitude: String(property?.latitude ?? ''),
    longitude: String(property?.longitude ?? ''),
    ward: property?.ward || '',
    district: property?.district || '',
    city: property?.city || '',
    rules: property?.rules || '',
    openHours: property?.openingHours || property?.openHours || '',
    contactPhone: property?.contactPhone || property?.phone || '',
  }));
  const [locationLookup, setLocationLookup] = useState(() => ({ loading: false, items: [], selected: initialLocation, error: '' }));
  const lookupRequestId = useRef(0);
  const [error, setError] = useState('');

  const change = (field) => (event) => {
    setError('');
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };
  const changeAddress = (event) => {
    const address = event.target.value;
    lookupRequestId.current += 1;
    setError('');
    setValues((current) => ({ ...current, address, latitude: '', longitude: '', ward: '', district: '', city: '' }));
    setLocationLookup({ loading: false, items: [], selected: null, error: '' });
  };
  const selectLocation = (location, items = locationLookup.items) => {
    lookupRequestId.current += 1;
    setError('');
    setValues((current) => ({
      ...current,
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      ward: location.ward || '',
      district: location.district || '',
      city: location.city || '',
    }));
    setLocationLookup({ loading: false, items, selected: location, error: '' });
  };
  const findLocation = async () => {
    const requestId = lookupRequestId.current + 1;
    lookupRequestId.current = requestId;
    const address = cleanText(values.address, 250);
    if (address.length < 5) {
      setLocationLookup({ loading: false, items: [], selected: null, error: 'Hãy nhập địa chỉ cụ thể hơn trước khi tìm vị trí.' });
      return;
    }

    setLocationLookup((current) => ({ ...current, loading: true, error: '' }));
    try {
      const result = await propertyApi.geocode(address);
      if (lookupRequestId.current !== requestId) return;
      const items = asArray(result?.items).filter((item) => Number.isFinite(Number(item?.latitude)) && Number.isFinite(Number(item?.longitude)) && item?.displayName);
      if (!items.length) {
        setLocationLookup({ loading: false, items: [], selected: null, error: 'Không tìm thấy vị trí. Hãy nhập địa chỉ cụ thể hơn.' });
        return;
      }
      selectLocation(items[0], items);
    } catch (requestError) {
      if (lookupRequestId.current !== requestId) return;
      setLocationLookup({
        loading: false,
        items: [],
        selected: null,
        error: requestError?.response?.data?.message || 'Không thể tìm vị trí lúc này. Vui lòng thử lại sau.',
      });
    }
  };
  const submit = (event) => {
    event.preventDefault();
    const name = cleanText(values.name, 160);
    const address = cleanText(values.address, 250);
    const city = cleanText(values.city, 120);
    const latitude = numericOrUndefined(values.latitude);
    const longitude = numericOrUndefined(values.longitude);
    if (name.length < 3 || address.length < 5) {
      setError('Hãy nhập tên và địa chỉ hợp lệ cho khu trọ.');
      return;
    }
    if (latitude === undefined || longitude === undefined || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError('Hãy bấm “Tìm vị trí” trước khi lưu khu trọ.');
      return;
    }
    if (city.length < 2) {
      setError('Hãy kiểm tra tỉnh/thành phố trước khi lưu khu trọ.');
      return;
    }
    setError('');
    onSubmit({
      name,
      description: cleanText(values.description, 2_000) || undefined,
      address,
      ward: cleanText(values.ward, 120) || undefined,
      district: cleanText(values.district, 120) || undefined,
      city,
      latitude,
      longitude,
      rules: cleanText(values.rules, 2_000) || undefined,
      openingHours: cleanText(values.openHours, 120) || undefined,
      contactPhone: cleanText(values.contactPhone, 25) || undefined,
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
      <label className="form-label" htmlFor="property-name">Tên khu trọ</label>
      <input id="property-name" className="form-control mb-3" maxLength="160" value={values.name} onChange={change('name')} />

      <label className="form-label" htmlFor="property-address">Địa chỉ</label>
      <div className="input-group">
        <input id="property-address" className="form-control" maxLength="250" value={values.address} onChange={changeAddress} placeholder="Ví dụ: Số 12, ngõ 15, đường Nguyễn Trãi, Thanh Xuân, Hà Nội" />
        <Button type="button" variant="outline" icon="bi-geo-alt" loading={locationLookup.loading} onClick={findLocation}>Tìm vị trí</Button>
      </div>
      <p className="form-text mb-0">Nhập địa chỉ càng cụ thể càng tốt, rồi bấm “Tìm vị trí”. Bạn không cần nhập kinh độ hoặc vĩ độ.</p>
      <p className="form-text mb-3">Dữ liệu địa chỉ © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>.</p>

      {locationLookup.error ? <div className="alert alert-warning py-2" role="alert">{locationLookup.error}</div> : null}
      {locationLookup.selected ? <div className="alert alert-success py-2" role="status"><i className="bi bi-check-circle me-2" aria-hidden="true" />Đã xác định vị trí: <strong>{locationLookup.selected.displayName}</strong></div> : null}
      {locationLookup.items.length > 1 ? <div className="mb-3" aria-label="Kết quả địa chỉ"><p className="small text-muted-app mb-2">Nếu kết quả đầu tiên chưa đúng, hãy chọn địa chỉ phù hợp:</p><div className="d-grid gap-2">{locationLookup.items.map((item) => <button key={`${item.latitude}-${item.longitude}-${item.displayName}`} type="button" className={`btn btn-sm text-start ${locationLookup.selected?.displayName === item.displayName ? 'btn-primary' : 'btn-light'}`} onClick={() => selectLocation(item)}>{item.displayName}</button>)}</div></div> : null}

      <label className="form-label mt-3" htmlFor="property-city">Tỉnh/thành phố</label>
      <input id="property-city" className="form-control mb-1" maxLength="120" value={values.city} onChange={change('city')} placeholder="Tự động điền sau khi tìm vị trí" />
      <p className="form-text mb-3">Hệ thống sẽ tự điền theo kết quả địa chỉ; bạn có thể chỉnh lại nếu cần.</p>

      <label className="form-label" htmlFor="property-description">Mô tả</label>
      <textarea id="property-description" className="form-control mb-3" rows="3" maxLength="2000" value={values.description} onChange={change('description')} />
      <label className="form-label" htmlFor="property-rules">Quy định</label>
      <textarea id="property-rules" className="form-control mb-3" rows="3" maxLength="2000" value={values.rules} onChange={change('rules')} />
      <div className="row g-3">
        <div className="col-md-6"><label className="form-label" htmlFor="property-hours">Giờ mở cửa/liên hệ</label><input id="property-hours" className="form-control" maxLength="120" value={values.openHours} onChange={change('openHours')} /></div>
        <div className="col-md-6"><label className="form-label" htmlFor="property-phone">Số điện thoại liên hệ</label><input id="property-phone" className="form-control" maxLength="25" value={values.contactPhone} onChange={change('contactPhone')} /></div>
      </div>
      <Button type="submit" loading={saving} disabled={locationLookup.loading} icon="bi-check-lg" className="mt-4">{property ? 'Lưu khu trọ' : 'Tạo khu trọ'}</Button>
    </form>
  );
}

function RoomForm({ room, properties, onSubmit, saving }) {
  const isEditing = Boolean(room?.id);
  const [values, setValues] = useState(() => ({
    propertyId: String(room?.propertyId || room?.property?.id || ''),
    code: room?.code || '',
    name: room?.name || '',
    description: room?.description || '',
    price: String(room?.price ?? ''),
    deposit: String(room?.deposit ?? ''),
    area: String(room?.area ?? ''),
    capacity: String(room?.capacity ?? ''),
    availableSlots: String(room?.availableSlots ?? ''),
    type: room?.type || 'PRIVATE_ROOM',
    status: room?.status || 'AVAILABLE',
    electricityPrice: String(room?.electricityPrice ?? room?.electricityRate ?? ''),
    waterPrice: String(room?.waterPrice ?? room?.waterRate ?? ''),
    internetFee: String(room?.internetFee ?? ''),
    parkingFee: String(room?.parkingFee ?? ''),
    imageUrls: asArray(room?.images || room?.roomImages)
      .map((image) => typeof image === 'string' ? image : image?.url || image?.imageUrl)
      .filter(Boolean)
      .join('\n'),
  }));
  const [error, setError] = useState('');
  const change = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const propertyId = numericOrUndefined(values.propertyId);
    const price = numericOrUndefined(values.price);
    const deposit = numericOrUndefined(values.deposit);
    const area = numericOrUndefined(values.area);
    const capacity = numericOrUndefined(values.capacity);
    const availableSlots = numericOrUndefined(values.availableSlots);
    const electricityPrice = numericOrUndefined(values.electricityPrice);
    const waterPrice = numericOrUndefined(values.waterPrice);
    const internetFee = numericOrUndefined(values.internetFee);
    const parkingFee = numericOrUndefined(values.parkingFee);

    if (
      (!isEditing && (!Number.isInteger(propertyId) || propertyId < 1))
      || cleanText(values.code, 50).length < 1
      || cleanText(values.name, 160).length < 2
      || price === undefined || price <= 0
      || area === undefined || area <= 0
      || !Number.isInteger(capacity) || capacity < 1
      || !Number.isInteger(availableSlots) || availableSlots < 0 || availableSlots > capacity
      || electricityPrice === undefined || electricityPrice < 0
      || waterPrice === undefined || waterPrice < 0
      || internetFee === undefined || internetFee < 0
      || parkingFee === undefined || parkingFee < 0
    ) {
      setError('Kiểm tra khu trọ, thông tin phòng, giá, diện tích, sức chứa và số chỗ trống.');
      return;
    }

    const imageUrls = values.imageUrls
      .split(/\r?\n/)
      .map((url) => cleanText(url, 500))
      .filter((url) => /^https?:\/\//i.test(url))
      .slice(0, 8);
    const payload = {
      code: cleanText(values.code, 50),
      name: cleanText(values.name, 160),
      description: cleanText(values.description, 4_000) || undefined,
      price,
      deposit: deposit ?? 0,
      area,
      capacity,
      availableSlots,
      type: values.type,
      status: values.status,
      electricityPrice,
      waterPrice,
      internetFee,
      parkingFee,
      images: imageUrls.map((url, index) => ({ url, isCover: index === 0 })),
    };
    if (!isEditing) payload.propertyId = propertyId;

    setError('');
    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} noValidate>
      {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label" htmlFor="room-property">Khu trọ</label>
          <select id="room-property" className="form-select" value={values.propertyId} onChange={change('propertyId')} disabled={isEditing}>
            <option value="">Chọn khu trọ</option>
            {properties.map((property) => <option value={property.id} key={property.id}>{property.name}</option>)}
          </select>
          {isEditing ? <p className="form-text mb-0">Không thể chuyển phòng sang khu trọ khác khi chỉnh sửa.</p> : null}
        </div>
        <div className="col-md-6"><label className="form-label" htmlFor="room-code">Mã phòng</label><input id="room-code" className="form-control" maxLength="50" value={values.code} onChange={change('code')} /></div>
        <div className="col-md-8"><label className="form-label" htmlFor="room-name">Tên phòng</label><input id="room-name" className="form-control" maxLength="160" value={values.name} onChange={change('name')} /></div>
        <div className="col-md-4"><label className="form-label" htmlFor="room-type">Loại phòng</label><select id="room-type" className="form-select" value={values.type} onChange={change('type')}><option value="PRIVATE_ROOM">Phòng riêng</option><option value="SHARED_ROOM">Phòng ở ghép</option><option value="STUDIO">Studio</option><option value="APARTMENT">Căn hộ</option><option value="DORMITORY">Ký túc xá</option></select></div>
        <div className="col-md-4"><label className="form-label" htmlFor="room-price">Giá thuê/tháng</label><input id="room-price" className="form-control" inputMode="numeric" value={values.price} onChange={change('price')} /></div>
        <div className="col-md-4"><label className="form-label" htmlFor="room-deposit">Tiền cọc</label><input id="room-deposit" className="form-control" inputMode="numeric" value={values.deposit} onChange={change('deposit')} /></div>
        <div className="col-md-4"><label className="form-label" htmlFor="room-area">Diện tích (m²)</label><input id="room-area" className="form-control" inputMode="decimal" value={values.area} onChange={change('area')} /></div>
        <div className="col-md-6"><label className="form-label" htmlFor="room-capacity">Sức chứa</label><input id="room-capacity" className="form-control" inputMode="numeric" value={values.capacity} onChange={change('capacity')} /></div>
        <div className="col-md-6"><label className="form-label" htmlFor="room-slots">Chỗ trống</label><input id="room-slots" className="form-control" inputMode="numeric" value={values.availableSlots} onChange={change('availableSlots')} /></div>
        <div className="col-md-6"><label className="form-label" htmlFor="room-status">Trạng thái</label><select id="room-status" className="form-select" value={values.status} onChange={change('status')}><option value="AVAILABLE">Còn phòng</option><option value="RESERVED">Đã giữ chỗ</option><option value="RENTED">Đang thuê</option><option value="MAINTENANCE">Bảo trì</option><option value="HIDDEN">Đã ẩn</option></select></div>
      </div>
      <label className="form-label mt-3" htmlFor="room-description">Mô tả</label>
      <textarea id="room-description" className="form-control mb-3" rows="3" maxLength="4000" value={values.description} onChange={change('description')} />
      <div className="row g-3">
        <div className="col-md-3"><label className="form-label" htmlFor="room-electricity">Điện</label><input id="room-electricity" className="form-control" inputMode="numeric" value={values.electricityPrice} onChange={change('electricityPrice')} /></div>
        <div className="col-md-3"><label className="form-label" htmlFor="room-water">Nước</label><input id="room-water" className="form-control" inputMode="numeric" value={values.waterPrice} onChange={change('waterPrice')} /></div>
        <div className="col-md-3"><label className="form-label" htmlFor="room-internet">Internet</label><input id="room-internet" className="form-control" inputMode="numeric" value={values.internetFee} onChange={change('internetFee')} /></div>
        <div className="col-md-3"><label className="form-label" htmlFor="room-parking">Gửi xe</label><input id="room-parking" className="form-control" inputMode="numeric" value={values.parkingFee} onChange={change('parkingFee')} /></div>
      </div>
      <label className="form-label mt-3" htmlFor="room-images">URL ảnh phòng (mỗi dòng một URL)</label>
      <textarea id="room-images" className="form-control" rows="3" value={values.imageUrls} onChange={change('imageUrls')} placeholder="https://…" />
      <p className="form-text">Chỉ URL ảnh HTTPS/HTTP hợp lệ được gửi lên hệ thống.</p>
      <Button type="submit" loading={saving} icon="bi-check-lg" className="mt-2">{room ? 'Lưu phòng' : 'Tạo phòng'}</Button>
    </form>
  );
}

export function LandlordDashboardPage() {
  const request = useAsyncData(useCallback((signal) => dashboardApi.landlord(signal), []));
  const data = entityFrom(request.data) || {};
  const rooms = collectionFrom(data.recentRooms || data.rooms).items;
  const appointments = collectionFrom(data.upcomingAppointments || data.appointments).items;
  const metrics = [
    { label: 'Tổng phòng', icon: 'bi-door-open', value: metricValue(data, ['summary.totalRooms', 'totalRooms']) },
    { label: 'Phòng trống', icon: 'bi-door-open-fill', value: metricValue(data, ['summary.availableRooms', 'availableRooms']) },
    { label: 'Đang thuê', icon: 'bi-key', value: metricValue(data, ['summary.rentedRooms', 'rentedRooms']) },
    { label: 'Lịch xem chờ xử lý', icon: 'bi-calendar-check', value: metricValue(data, ['summary.pendingAppointments', 'pendingAppointments']) },
    { label: 'Hóa đơn chưa thanh toán', icon: 'bi-receipt', value: metricValue(data, ['summary.unpaidInvoices', 'unpaidInvoices']) },
  ];
  return <><PageHeader eyebrow="Khu vực chủ trọ" title="Tổng quan vận hành" description="Theo dõi phòng, lịch xem và hóa đơn từ dữ liệu hệ thống." action={<Link to="/landlord/rooms" className="btn btn-primary"><i className="bi bi-plus-lg me-1" aria-hidden="true" />Quản lý phòng</Link>} /><RequestContent request={request} label="Đang tải tổng quan chủ trọ…"><MetricCards metrics={metrics} /><div className="row g-3"><div className="col-xl-7"><Panel title="Phòng gần đây" action={<Link to="/landlord/rooms" className="btn btn-ghost btn-sm">Tất cả phòng</Link>}><ResourceTable items={rooms} emptyTitle="Chưa có phòng" emptyDescription="Tạo khu trọ và thêm phòng để bắt đầu." columns={[{ key: 'name', label: 'Phòng' }, { key: 'price', label: 'Giá thuê', kind: 'currency' }, { key: 'availableSlots', label: 'Chỗ trống', kind: 'number' }, { key: 'status', label: 'Trạng thái', kind: 'status' }]} /></Panel></div><div className="col-xl-5"><Panel title="Lịch xem gần nhất" action={<Link to="/landlord/appointments" className="btn btn-ghost btn-sm">Tất cả lịch</Link>}><SimpleRecordList items={appointments} emptyTitle="Chưa có lịch xem" emptyDescription="Yêu cầu xem phòng từ sinh viên sẽ hiển thị tại đây." renderItem={(appointment) => <div className="d-flex justify-content-between gap-2"><div><strong>{appointment.room?.name || appointment.room?.code || 'Lịch xem phòng'}</strong><div className="small text-muted-app">{formatDate(appointment.scheduledAt, { dateStyle: 'medium', timeStyle: 'short' })}</div></div><StatusBadge status={appointment.status} /></div>} /></Panel></div></div></RequestContent></>;
}

export function LandlordPropertiesPage() {
  const { showToast } = useToast();
  const request = useAsyncData(useCallback((signal) => propertyApi.list({ limit: 100 }, signal), []));
  const properties = collectionFrom(request.data).items;
  const [editing, setEditing] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const save = async (payload) => {
    setSaving(true);
    try {
      if (editing?.id) await propertyApi.update(editing.id, payload);
      else await propertyApi.create(payload);
      showToast({ variant: 'success', title: 'Đã lưu khu trọ', message: editing?.id ? 'Thông tin khu trọ đã được cập nhật.' : 'Khu trọ đã được tạo.' });
      setEditing(undefined);
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể lưu khu trọ', message: 'Vui lòng kiểm tra lại thông tin và thử lại.' });
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete.id);
    try {
      await propertyApi.remove(confirmDelete.id);
      showToast({ variant: 'success', title: 'Đã xóa khu trọ', message: 'Khu trọ đã được xóa.' });
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể xóa khu trọ', message: 'Không thể xóa khu trọ khi vẫn còn dữ liệu liên quan.' });
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };
  return <><PageHeader eyebrow="Khu trọ" title="Quản lý khu trọ" description="Cập nhật địa chỉ, vị trí, quy định và thông tin liên hệ." action={<Button icon="bi-plus-lg" onClick={() => setEditing(null)}>Tạo khu trọ</Button>} /><RequestContent request={request} label="Đang tải khu trọ…">{properties.length ? <ResourceTable items={properties} columns={[{ key: 'name', label: 'Khu trọ' }, { key: 'address', label: 'Địa chỉ' }, { key: 'rooms', label: 'Số phòng' }, { key: 'verificationStatus', label: 'Xác minh', kind: 'status' }]} renderActions={(property) => <div className="d-inline-flex gap-1"><button type="button" className="btn btn-sm btn-light" aria-label="Sửa khu trọ" onClick={() => setEditing(property)}><i className="bi bi-pencil" aria-hidden="true" /></button><button type="button" className="btn btn-sm btn-light text-danger" aria-label="Xóa khu trọ" disabled={deleting === property.id} onClick={() => setConfirmDelete(property)}><i className="bi bi-trash" aria-hidden="true" /></button></div>} /> : <EmptyState icon="bi-buildings" title="Chưa có khu trọ" description="Tạo khu trọ đầu tiên trước khi đăng phòng." action={<Button icon="bi-plus-lg" onClick={() => setEditing(null)}>Tạo khu trọ</Button>} />}</RequestContent><Modal open={editing !== undefined} title={editing?.id ? 'Sửa khu trọ' : 'Tạo khu trọ'} onClose={() => !saving && setEditing(undefined)}><PropertyForm property={editing} onSubmit={save} saving={saving} /></Modal><ConfirmDialog open={Boolean(confirmDelete)} title="Xóa khu trọ?" description="Thao tác này có thể bị từ chối nếu khu trọ còn phòng hoặc hợp đồng liên quan." confirmLabel="Xóa khu trọ" danger loading={Boolean(deleting)} onCancel={() => setConfirmDelete(null)} onConfirm={remove} /></>;
}

export function LandlordRoomsPage() {
  const { showToast } = useToast();
  const roomsRequest = useAsyncData(useCallback((signal) => roomApi.mine({ limit: 100 }, signal), []));
  const propertiesRequest = useAsyncData(useCallback((signal) => propertyApi.list({ limit: 100 }, signal), []));
  const rooms = collectionFrom(roomsRequest.data).items;
  const properties = collectionFrom(propertiesRequest.data).items;
  const [editing, setEditing] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const save = async (payload) => {
    setSaving(true);
    try {
      if (editing?.id) await landlordRoomApi.update(editing.id, payload);
      else await landlordRoomApi.create(payload);
      showToast({ variant: 'success', title: 'Đã lưu phòng', message: editing?.id ? 'Thông tin phòng đã được cập nhật; hệ thống lưu lịch sử giá nếu giá thay đổi.' : 'Phòng đã được tạo.' });
      setEditing(undefined);
      roomsRequest.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể lưu phòng', message: 'Vui lòng kiểm tra lại thông tin và thử lại.' });
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete.id);
    try {
      await landlordRoomApi.remove(confirmDelete.id);
      showToast({ variant: 'success', title: 'Đã xóa phòng', message: 'Phòng đã được xóa.' });
      roomsRequest.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể xóa phòng', message: 'Không thể xóa phòng có dữ liệu thuê liên quan.' });
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };
  return <><PageHeader eyebrow="Quản lý phòng" title="Phòng và tin đăng" description="Cập nhật tồn phòng, giá và các khoản phí từ dữ liệu vận hành." action={<Button icon="bi-plus-lg" disabled={!properties.length} onClick={() => setEditing(null)}>Tạo phòng</Button>} />{propertiesRequest.error ? <ErrorState message={propertiesRequest.error} onRetry={propertiesRequest.reload} /> : <RequestContent request={roomsRequest} label="Đang tải phòng…">{rooms.length ? <ResourceTable items={rooms} columns={[{ key: 'code', label: 'Mã phòng' }, { key: 'name', label: 'Tên phòng' }, { key: 'property.name', label: 'Khu trọ' }, { key: 'price', label: 'Giá', kind: 'currency' }, { key: 'availableSlots', label: 'Chỗ trống', kind: 'number' }, { key: 'status', label: 'Trạng thái', kind: 'status' }]} renderActions={(room) => <div className="d-inline-flex gap-1"><button type="button" className="btn btn-sm btn-light" aria-label="Sửa phòng" onClick={() => setEditing(room)}><i className="bi bi-pencil" aria-hidden="true" /></button><Link to={`/rooms/${encodeURIComponent(room.id)}`} className="btn btn-sm btn-light" aria-label="Xem phòng"><i className="bi bi-eye" aria-hidden="true" /></Link><button type="button" className="btn btn-sm btn-light text-danger" aria-label="Xóa phòng" disabled={deleting === room.id} onClick={() => setConfirmDelete(room)}><i className="bi bi-trash" aria-hidden="true" /></button></div>} /> : <EmptyState icon="bi-door-open" title={properties.length ? 'Chưa có phòng' : 'Cần tạo khu trọ trước'} description={properties.length ? 'Thêm phòng đầu tiên để bắt đầu nhận lịch xem.' : 'Tạo một khu trọ rồi thêm các phòng thuộc khu trọ đó.'} action={properties.length ? <Button icon="bi-plus-lg" onClick={() => setEditing(null)}>Tạo phòng</Button> : <Link to="/landlord/properties" className="btn btn-primary">Tạo khu trọ</Link>} />}</RequestContent>}<Modal open={editing !== undefined} title={editing?.id ? 'Sửa phòng' : 'Tạo phòng'} onClose={() => !saving && setEditing(undefined)} className="modal-panel--wide"><RoomForm room={editing} properties={properties} onSubmit={save} saving={saving} /></Modal><ConfirmDialog open={Boolean(confirmDelete)} title="Xóa phòng?" description="Không thể hoàn tác thao tác này. Phòng có hợp đồng hoặc hóa đơn liên quan có thể không được xóa." confirmLabel="Xóa phòng" danger loading={Boolean(deleting)} onCancel={() => setConfirmDelete(null)} onConfirm={remove} /></>;
}

export function LandlordTenantsPage() {
  const request = useAsyncData(useCallback((signal) => tenantApi.list({ limit: 100 }, signal), []));
  const tenants = collectionFrom(request.data).items;
  return <><PageHeader eyebrow="Người thuê" title="Theo dõi người thuê" description="Danh sách được xác định từ hợp đồng và phòng thuộc quyền quản lý của bạn." /><RequestContent request={request} label="Đang tải người thuê…">{tenants.length ? <ResourceTable items={tenants} columns={[{ key: 'student', label: 'Người thuê', render: (tenant) => getAccountOptionLabel(tenant.student?.user || tenant.student, '—') }, { key: 'login', label: 'Đăng nhập', render: (tenant) => getAccountLoginDetails(tenant.student?.user || tenant.student, '—') }, { key: 'room.name', label: 'Phòng' }, { key: 'contract.startDate', label: 'Bắt đầu', kind: 'date' }, { key: 'contract.endDate', label: 'Kết thúc', kind: 'date' }, { key: 'contract.status', label: 'Hợp đồng', kind: 'status' }]} /> : <EmptyState icon="bi-people" title="Chưa có người thuê" description="Người thuê sẽ xuất hiện sau khi hợp đồng được kích hoạt." />}</RequestContent></>;
}

export function LandlordAppointmentsPage() {
  const { showToast } = useToast();
  const request = useAsyncData(useCallback((signal) => appointmentApi.list({ limit: 100 }, signal), []));
  const appointments = collectionFrom(request.data).items;
  const [updating, setUpdating] = useState(null);
  const updateStatus = async (appointment, status) => {
    setUpdating(appointment.id);
    try {
      await appointmentApi.respond(appointment.id, { status });
      showToast({ variant: 'success', title: 'Đã cập nhật lịch xem', message: 'Phản hồi của bạn đã được gửi đến sinh viên.' });
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể cập nhật lịch xem', message: 'Vui lòng thử lại.' });
    } finally {
      setUpdating(null);
    }
  };
  return <><PageHeader eyebrow="Lịch xem phòng" title="Yêu cầu xem phòng" description="Chấp nhận, từ chối hoặc hoàn tất lịch xem từ sinh viên." /><RequestContent request={request} label="Đang tải lịch xem…">{appointments.length ? <ResourceTable items={appointments} columns={[{ key: 'student', label: 'Sinh viên', render: (appointment) => getAccountOptionLabel(appointment.student?.user || appointment.student, '—') }, { key: 'room.name', label: 'Phòng' }, { key: 'scheduledAt', label: 'Thời gian', kind: 'date' }, { key: 'note', label: 'Ghi chú' }, { key: 'status', label: 'Trạng thái', kind: 'status' }]} renderActions={(appointment) => appointment.status === 'PENDING' ? <div className="d-inline-flex gap-1"><button type="button" className="btn btn-sm btn-outline-primary" disabled={updating === appointment.id} onClick={() => updateStatus(appointment, 'ACCEPTED')}>Chấp nhận</button><button type="button" className="btn btn-sm btn-light" disabled={updating === appointment.id} onClick={() => updateStatus(appointment, 'REJECTED')}>Từ chối</button></div> : appointment.status === 'ACCEPTED' ? <button type="button" className="btn btn-sm btn-light" disabled={updating === appointment.id} onClick={() => updateStatus(appointment, 'COMPLETED')}>Hoàn tất</button> : null} /> : <EmptyState icon="bi-calendar-check" title="Chưa có yêu cầu xem phòng" description="Các yêu cầu mới sẽ xuất hiện tại đây." />}</RequestContent></>;
}

function ContractForm({ rooms, tenants, onSubmit, saving }) {
  const [values, setValues] = useState({ roomId: '', studentId: '', startDate: '', endDate: '', rent: '', deposit: '', terms: '' });
  const [error, setError] = useState('');
  const change = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    const rent = numericOrUndefined(values.rent);
    const deposit = numericOrUndefined(values.deposit);
    const terms = cleanText(values.terms, 4_000);
    if (!values.roomId || !values.studentId || !values.startDate || !values.endDate || new Date(values.endDate) <= new Date(values.startDate) || rent === undefined || rent <= 0 || deposit === undefined || deposit < 0 || terms.length < 10) {
      setError('Chọn phòng, người thuê và nhập thời hạn, giá, tiền cọc hợp lệ.');
      return;
    }
    setError('');
    onSubmit({ roomId: values.roomId, startDate: values.startDate, endDate: values.endDate, rent, deposit, terms, tenants: [{ studentId: values.studentId, isPrimaryTenant: true }] });
  };
  return <form onSubmit={submit}>{error ? <div className="alert alert-danger" role="alert">{error}</div> : null}<label className="form-label" htmlFor="contract-room">Phòng</label><select id="contract-room" className="form-select mb-3" value={values.roomId} onChange={change('roomId')}><option value="">Chọn phòng</option>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name || room.code}</option>)}</select><label className="form-label" htmlFor="contract-student">Người thuê</label><select id="contract-student" className="form-select mb-3" value={values.studentId} onChange={change('studentId')}><option value="">Chọn sinh viên</option>{tenants.map((tenant) => { const student = tenant.student || tenant; return <option key={student.id} value={student.id}>{getAccountOptionLabel(student.user || student, 'Sinh viên #' + student.id)}</option>; })}</select><div className="row g-3"><div className="col-md-6"><label className="form-label" htmlFor="contract-start">Ngày bắt đầu</label><input id="contract-start" className="form-control" type="date" value={values.startDate} onChange={change('startDate')} /></div><div className="col-md-6"><label className="form-label" htmlFor="contract-end">Ngày kết thúc</label><input id="contract-end" className="form-control" type="date" value={values.endDate} onChange={change('endDate')} /></div><div className="col-md-6"><label className="form-label" htmlFor="contract-rent">Tiền thuê</label><input id="contract-rent" className="form-control" inputMode="numeric" value={values.rent} onChange={change('rent')} /></div><div className="col-md-6"><label className="form-label" htmlFor="contract-deposit">Tiền cọc</label><input id="contract-deposit" className="form-control" inputMode="numeric" value={values.deposit} onChange={change('deposit')} /></div></div><label className="form-label mt-3" htmlFor="contract-terms">Điều khoản</label><textarea id="contract-terms" className="form-control mb-4" rows="4" maxLength="4000" value={values.terms} onChange={change('terms')} /><Button type="submit" loading={saving} icon="bi-file-earmark-plus">Tạo hợp đồng nháp</Button></form>;
}

export function LandlordContractsPage() {
  const { showToast } = useToast();
  const contractsRequest = useAsyncData(useCallback((signal) => contractApi.list({ limit: 100 }, signal), []));
  const roomsRequest = useAsyncData(useCallback((signal) => roomApi.mine({ limit: 100 }, signal), []));
  const tenantsRequest = useAsyncData(useCallback((signal) => tenantApi.list({ candidates: true, limit: 100 }, signal), []));
  const contracts = collectionFrom(contractsRequest.data).items;
  const rooms = collectionFrom(roomsRequest.data).items;
  const tenants = collectionFrom(tenantsRequest.data).items;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(null);
  const [pendingTransition, setPendingTransition] = useState(null);
  const create = async (payload) => {
    setSaving(true);
    try {
      await contractApi.create(payload);
      showToast({ variant: 'success', title: 'Đã tạo hợp đồng', message: 'Hợp đồng được tạo ở trạng thái nháp.' });
      setOpen(false);
      contractsRequest.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể tạo hợp đồng', message: 'Vui lòng kiểm tra dữ liệu và thử lại.' });
    } finally {
      setSaving(false);
    }
  };
  const transition = async () => {
    if (!pendingTransition) return;
    const { contract, status } = pendingTransition;
    setTransitioning(contract.id);
    try {
      await contractApi.transition(contract.id, status);
      showToast({
        variant: 'success',
        title: status === 'ACTIVE' ? 'Đã kích hoạt hợp đồng' : 'Đã chấm dứt hợp đồng',
        message: status === 'ACTIVE' ? 'Hợp đồng đã có hiệu lực và có thể lập hóa đơn.' : 'Số chỗ trống của phòng đã được cập nhật.',
      });
      contractsRequest.reload();
      roomsRequest.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể cập nhật hợp đồng', message: 'Trạng thái hiện tại hoặc số chỗ trống không đáp ứng điều kiện chuyển đổi.' });
    } finally {
      setTransitioning(null);
      setPendingTransition(null);
    }
  };
  return <><PageHeader eyebrow="Hợp đồng" title="Quản lý hợp đồng thuê" description="Tạo và theo dõi vòng đời hợp đồng cho các phòng của bạn." action={<Button icon="bi-plus-lg" onClick={() => setOpen(true)}>Tạo hợp đồng</Button>} /><RequestContent request={contractsRequest} label="Đang tải hợp đồng…">{contracts.length ? <ResourceTable items={contracts} columns={[{ key: 'room.name', label: 'Phòng' }, { key: 'startDate', label: 'Bắt đầu', kind: 'date' }, { key: 'endDate', label: 'Kết thúc', kind: 'date' }, { key: 'rent', label: 'Tiền thuê', kind: 'currency' }, { key: 'status', label: 'Trạng thái', kind: 'status' }]} renderActions={(contract) => contract.status === 'DRAFT' ? <button type="button" className="btn btn-sm btn-outline-primary" disabled={transitioning === contract.id} onClick={() => setPendingTransition({ contract, status: 'ACTIVE' })}>Kích hoạt</button> : contract.status === 'ACTIVE' ? <button type="button" className="btn btn-sm btn-outline-danger" disabled={transitioning === contract.id} onClick={() => setPendingTransition({ contract, status: 'TERMINATED' })}>Chấm dứt</button> : null} /> : <EmptyState icon="bi-file-earmark-text" title="Chưa có hợp đồng" description="Tạo hợp đồng khi đã thống nhất với sinh viên." action={<Button icon="bi-plus-lg" onClick={() => setOpen(true)}>Tạo hợp đồng</Button>} />}</RequestContent><Modal open={open} title="Tạo hợp đồng thuê" onClose={() => !saving && setOpen(false)} className="modal-panel--wide"><ContractForm rooms={rooms} tenants={tenants} onSubmit={create} saving={saving} /></Modal><ConfirmDialog open={Boolean(pendingTransition)} title={pendingTransition?.status === 'ACTIVE' ? 'Kích hoạt hợp đồng?' : 'Chấm dứt hợp đồng?'} description={pendingTransition?.status === 'ACTIVE' ? 'Hợp đồng sẽ có hiệu lực và số chỗ trống của phòng được cập nhật.' : 'Hợp đồng đang hiệu lực sẽ kết thúc và số chỗ trống của phòng được hoàn lại.'} confirmLabel={pendingTransition?.status === 'ACTIVE' ? 'Kích hoạt' : 'Chấm dứt'} danger={pendingTransition?.status === 'TERMINATED'} loading={Boolean(transitioning)} onCancel={() => setPendingTransition(null)} onConfirm={transition} /></>;
}

function InvoiceForm({ contracts, formId, onSubmit }) {
  const [values, setValues] = useState({
    contractId: '',
    periodStart: '',
    periodEnd: '',
    dueDate: '',
    rentAmount: '',
    electricityStart: '0',
    electricityEnd: '0',
    electricityUnitPrice: '0',
    waterStart: '0',
    waterEnd: '0',
    waterUnitPrice: '0',
    internetAmount: '0',
    parkingAmount: '0',
    serviceAmount: '0',
    otherAmount: '0',
  });
  const [error, setError] = useState('');
  const change = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const contractId = numericOrUndefined(values.contractId);
    const numeric = Object.fromEntries(
      ['rentAmount', 'electricityStart', 'electricityEnd', 'electricityUnitPrice', 'waterStart', 'waterEnd', 'waterUnitPrice', 'internetAmount', 'parkingAmount', 'serviceAmount', 'otherAmount']
        .map((key) => [key, numericOrUndefined(values[key])]),
    );
    const requiredAmounts = [
      'electricityStart',
      'electricityEnd',
      'electricityUnitPrice',
      'waterStart',
      'waterEnd',
      'waterUnitPrice',
      'internetAmount',
      'parkingAmount',
      'serviceAmount',
      'otherAmount',
    ];
    const invalidRequiredAmount = requiredAmounts.some((key) => numeric[key] === undefined || numeric[key] < 0);

    if (
      !Number.isInteger(contractId) || contractId < 1
      || !values.periodStart || !values.periodEnd || !values.dueDate
      || values.periodEnd < values.periodStart
      || values.dueDate < values.periodStart
      || numeric.rentAmount !== undefined && numeric.rentAmount < 0
      || invalidRequiredAmount
      || numeric.electricityEnd < numeric.electricityStart
      || numeric.waterEnd < numeric.waterStart
    ) {
      setError('Chọn hợp đồng, nhập đủ ngày kỳ hóa đơn và kiểm tra các chỉ số, đơn giá.');
      return;
    }

    const { rentAmount, ...requiredPayload } = numeric;
    setError('');
    onSubmit({
      contractId,
      periodStart: values.periodStart,
      periodEnd: values.periodEnd,
      dueDate: values.dueDate,
      ...requiredPayload,
      ...(rentAmount === undefined ? {} : { rentAmount }),
    });
  };

  return (
    <form id={formId} onSubmit={submit} noValidate>
      {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
      <label className="form-label" htmlFor="invoice-contract">Hợp đồng</label>
      <select id="invoice-contract" className="form-select mb-3" value={values.contractId} onChange={change('contractId')}>
        <option value="">Chọn hợp đồng</option>
        {contracts.map((contract) => <option key={contract.id} value={contract.id}>{contract.room?.name || contract.room?.code || contract.id}</option>)}
      </select>
      <div className="row g-3 mb-3">
        <div className="col-md-4"><label className="form-label" htmlFor="invoice-period-start">Từ ngày</label><input id="invoice-period-start" className="form-control" type="date" value={values.periodStart} onChange={change('periodStart')} /></div>
        <div className="col-md-4"><label className="form-label" htmlFor="invoice-period-end">Đến ngày</label><input id="invoice-period-end" className="form-control" type="date" min={values.periodStart || undefined} value={values.periodEnd} onChange={change('periodEnd')} /></div>
        <div className="col-md-4"><label className="form-label" htmlFor="invoice-due-date">Hạn thanh toán</label><input id="invoice-due-date" className="form-control" type="date" min={values.periodStart || undefined} value={values.dueDate} onChange={change('dueDate')} /></div>
      </div>
      <div className="row g-3">
        <div className="col-md-4"><label className="form-label" htmlFor="invoice-rent">Tiền phòng</label><input id="invoice-rent" className="form-control" inputMode="numeric" min="0" value={values.rentAmount} onChange={change('rentAmount')} /><p className="form-text mb-0">Để trống để dùng tiền thuê trong hợp đồng.</p></div>
        <div className="col-md-4"><label className="form-label" htmlFor="invoice-electricity-start">Chỉ số điện đầu</label><input id="invoice-electricity-start" className="form-control" inputMode="decimal" min="0" value={values.electricityStart} onChange={change('electricityStart')} /></div>
        <div className="col-md-4"><label className="form-label" htmlFor="invoice-electricity-end">Chỉ số điện cuối</label><input id="invoice-electricity-end" className="form-control" inputMode="decimal" min="0" value={values.electricityEnd} onChange={change('electricityEnd')} /></div>
        <div className="col-md-4"><label className="form-label" htmlFor="invoice-electricity-rate">Đơn giá điện</label><input id="invoice-electricity-rate" className="form-control" inputMode="numeric" min="0" value={values.electricityUnitPrice} onChange={change('electricityUnitPrice')} /></div>
        <div className="col-md-4"><label className="form-label" htmlFor="invoice-water-start">Chỉ số nước đầu</label><input id="invoice-water-start" className="form-control" inputMode="decimal" min="0" value={values.waterStart} onChange={change('waterStart')} /></div>
        <div className="col-md-4"><label className="form-label" htmlFor="invoice-water-end">Chỉ số nước cuối</label><input id="invoice-water-end" className="form-control" inputMode="decimal" min="0" value={values.waterEnd} onChange={change('waterEnd')} /></div>
        <div className="col-md-4"><label className="form-label" htmlFor="invoice-water-rate">Đơn giá nước</label><input id="invoice-water-rate" className="form-control" inputMode="numeric" min="0" value={values.waterUnitPrice} onChange={change('waterUnitPrice')} /></div>
        <div className="col-md-4"><label className="form-label" htmlFor="invoice-internet">Internet</label><input id="invoice-internet" className="form-control" inputMode="numeric" min="0" value={values.internetAmount} onChange={change('internetAmount')} /></div>
        <div className="col-md-4"><label className="form-label" htmlFor="invoice-parking">Gửi xe</label><input id="invoice-parking" className="form-control" inputMode="numeric" min="0" value={values.parkingAmount} onChange={change('parkingAmount')} /></div>
        <div className="col-md-6"><label className="form-label" htmlFor="invoice-service">Phí dịch vụ</label><input id="invoice-service" className="form-control" inputMode="numeric" min="0" value={values.serviceAmount} onChange={change('serviceAmount')} /></div>
        <div className="col-md-6"><label className="form-label" htmlFor="invoice-other">Chi phí khác</label><input id="invoice-other" className="form-control" inputMode="numeric" min="0" value={values.otherAmount} onChange={change('otherAmount')} /></div>
      </div>
      <p className="form-text mt-3">Tổng hóa đơn được máy chủ tính từ kỳ, chỉ số và các đơn giá bạn nhập.</p>
    </form>
  );
}

export function LandlordInvoicesPage() {
  const { showToast } = useToast();
  const invoicesRequest = useAsyncData(useCallback((signal) => invoiceApi.list({ limit: 100 }, signal), []));
  const contractsRequest = useAsyncData(useCallback((signal) => contractApi.list({ status: 'ACTIVE', limit: 100 }, signal), []));
  const invoices = collectionFrom(invoicesRequest.data).items;
  const contracts = collectionFrom(contractsRequest.data).items;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [marking, setMarking] = useState(null);
  const invoiceFormId = useId();
  const create = async (payload) => {
    setSaving(true);
    try {
      await invoiceApi.create(payload);
      showToast({ variant: 'success', title: 'Đã tạo hóa đơn', message: 'Tổng tiền được tính và lưu bởi hệ thống.' });
      setOpen(false);
      invoicesRequest.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể tạo hóa đơn', message: 'Vui lòng kiểm tra các chỉ số và thử lại.' });
    } finally {
      setSaving(false);
    }
  };
  const markPaid = async (invoice) => {
    setMarking(invoice.id);
    try {
      await invoiceApi.update(invoice.id, { status: 'PAID' });
      showToast({ variant: 'success', title: 'Đã cập nhật hóa đơn', message: 'Hóa đơn được đánh dấu đã thanh toán.' });
      invoicesRequest.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể cập nhật hóa đơn', message: 'Vui lòng thử lại.' });
    } finally {
      setMarking(null);
    }
  };
  return <><PageHeader eyebrow="Hóa đơn" title="Điện, nước và hóa đơn" description="Nhập chỉ số thực tế; máy chủ tính tổng tiền theo từng khoản." action={<Button icon="bi-plus-lg" onClick={() => setOpen(true)}>Tạo hóa đơn</Button>} /><RequestContent request={invoicesRequest} label="Đang tải hóa đơn…">{invoices.length ? <ResourceTable items={invoices} columns={[{ key: 'contract.room.name', label: 'Phòng' }, { key: 'periodEnd', label: 'Kỳ hóa đơn', kind: 'date' }, { key: 'dueDate', label: 'Hạn thanh toán', kind: 'date' }, { key: 'totalAmount', label: 'Tổng tiền', kind: 'currency' }, { key: 'status', label: 'Trạng thái', kind: 'status' }]} renderActions={(invoice) => invoice.status === 'UNPAID' || invoice.status === 'OVERDUE' ? <button type="button" className="btn btn-sm btn-outline-primary" disabled={marking === invoice.id} onClick={() => markPaid(invoice)}>Đánh dấu đã thanh toán</button> : null} /> : <EmptyState icon="bi-receipt" title="Chưa có hóa đơn" description="Tạo hóa đơn từ hợp đồng đang hiệu lực." action={<Button icon="bi-plus-lg" onClick={() => setOpen(true)}>Tạo hóa đơn</Button>} />}</RequestContent><Modal open={open} title="Tạo hóa đơn" onClose={() => !saving && setOpen(false)} className="modal-panel--wide" footer={<Button type="submit" form={invoiceFormId} loading={saving} icon="bi-receipt">Tạo hóa đơn</Button>}><InvoiceForm contracts={contracts} formId={invoiceFormId} onSubmit={create} /></Modal></>;
}

export function LandlordChatPage() {
  return <section className="chat-page"><h1 className="visually-hidden">Tin nhắn</h1><ChatWorkspace /></section>;
}

export function LandlordReviewsPage() {
  const request = useAsyncData(useCallback((signal) => reviewApi.list({ mine: true, limit: 100 }, signal), []));
  const reviews = collectionFrom(request.data).items;
  return <><PageHeader eyebrow="Đánh giá" title="Phản hồi về phòng và khu trọ" description="Theo dõi đánh giá đủ điều kiện từ người thuê." /><RequestContent request={request} label="Đang tải đánh giá…">{reviews.length ? <ResourceTable items={reviews} columns={[{ key: 'room.name', label: 'Phòng' }, { key: 'student', label: 'Sinh viên', render: (review) => getAccountOptionLabel(review.student?.user || review.student, '—') }, { key: 'rating', label: 'Điểm', kind: 'number' }, { key: 'comment', label: 'Nhận xét' }, { key: 'createdAt', label: 'Ngày gửi', kind: 'date' }]} /> : <EmptyState icon="bi-star" title="Chưa có đánh giá" description="Đánh giá từ người thuê sẽ xuất hiện tại đây." />}</RequestContent></>;
}

export function LandlordProfilePage() {
  const { showToast } = useToast();
  const request = useAsyncData(useCallback((signal) => userApi.me(signal), []));
  const profile = entityFrom(request.data) || {};
  const [values, setValues] = useState({ fullName: '', phone: '', businessName: '', contactAddress: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!profile) return;
    const landlordProfile = profile.landlordProfile || {};
    setValues({
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      businessName: landlordProfile.businessName || '',
      contactAddress: landlordProfile.contactAddress || '',
      bio: landlordProfile.bio || '',
    });
  }, [profile]);
  const save = async (event) => {
    event.preventDefault();
    const fullName = cleanText(values.fullName, 120);
    if (fullName.length < 2) {
      setError('Họ tên cần có ít nhất 2 ký tự.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await Promise.all([
        userApi.updateAccount({ fullName, phone: cleanText(values.phone, 30) || null }),
        userApi.updateProfile({
          businessName: cleanText(values.businessName, 191) || null,
          contactAddress: cleanText(values.contactAddress, 500) || null,
          bio: cleanText(values.bio, 5_000) || null,
        }),
      ]);
      showToast({ variant: 'success', title: 'Đã cập nhật hồ sơ', message: 'Thông tin liên hệ của bạn đã được lưu.' });
      request.reload();
    } catch {
      setError('Không thể cập nhật hồ sơ. Vui lòng kiểm tra thông tin và thử lại.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <PageHeader eyebrow="Hồ sơ chủ trọ" title="Thông tin liên hệ" description="Thông tin này giúp sinh viên liên hệ và quản trị viên xác minh tài khoản." />
      <RequestContent request={request} label="Đang tải hồ sơ…">
        <div className="row g-3">
          <div className="col-lg-8">
            <Panel title="Thông tin cá nhân">
              <form onSubmit={save} noValidate>
                {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
                <label className="form-label" htmlFor="landlord-name">Họ và tên</label>
                <input id="landlord-name" className="form-control mb-3" maxLength="120" value={values.fullName} onChange={(event) => setValues((current) => ({ ...current, fullName: event.target.value }))} />
                <label className="form-label" htmlFor="landlord-phone">Số điện thoại</label>
                <input id="landlord-phone" className="form-control mb-3" maxLength="30" value={values.phone} onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))} />
                <label className="form-label" htmlFor="landlord-business-name">Tên cơ sở/đơn vị cho thuê</label>
                <input id="landlord-business-name" className="form-control mb-3" maxLength="191" value={values.businessName} onChange={(event) => setValues((current) => ({ ...current, businessName: event.target.value }))} />
                <label className="form-label" htmlFor="landlord-contact-address">Địa chỉ liên hệ</label>
                <input id="landlord-contact-address" className="form-control mb-3" maxLength="500" value={values.contactAddress} onChange={(event) => setValues((current) => ({ ...current, contactAddress: event.target.value }))} />
                <label className="form-label" htmlFor="landlord-bio">Giới thiệu</label>
                <textarea id="landlord-bio" className="form-control mb-4" rows="4" maxLength="5000" value={values.bio} onChange={(event) => setValues((current) => ({ ...current, bio: event.target.value }))} />
                <Button type="submit" loading={saving} icon="bi-check-lg">Lưu thay đổi</Button>
              </form>
            </Panel>
          </div>
          <div className="col-lg-4">
            <Panel title="Trạng thái xác minh"><p className="mb-0"><StatusBadge status={profile.verificationStatus || profile.landlordProfile?.verificationStatus} /></p></Panel>
            <Panel title="Tài khoản đăng nhập" className="mt-3"><p className="mb-2"><strong>Tên đăng nhập:</strong> {profile.username || 'Không dùng tên đăng nhập'}</p><p className="mb-0"><strong>Email:</strong> {profile.email || 'Không dùng email'}</p></Panel>
          </div>
          <div className="col-12"><VerificationRequestPanel role="LANDLORD" profile={profile} onSubmitted={request.reload} /></div>
        </div>
      </RequestContent>
    </>
  );
}
