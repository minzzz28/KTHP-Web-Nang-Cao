import { useCallback, useMemo, useState } from 'react';
import { adminApi, propertyApi, reportApi, reviewApi, roomApi, verificationApi } from '../../api/resources';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/AsyncState';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { MetricCards, ResourceTable, SimpleRecordList } from '../../components/common/ResourceTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { collectionFrom, entityFrom, getAccountLoginDetails, getAccountOptionLabel, getName, safeUrl } from '../../utils/data';
import { formatDate, readableEnum } from '../../utils/formatters';
import { cleanText } from '../../utils/records';

const ROOM_STATUSES = [
  ['AVAILABLE', 'Còn phòng'], ['RESERVED', 'Đã giữ chỗ'], ['RENTED', 'Đang thuê'], ['MAINTENANCE', 'Bảo trì'], ['HIDDEN', 'Ẩn tin'],
];

function RequestContent({ request, label, children }) {
  if (request.loading) return <LoadingState label={label} />;
  if (request.error) return <ErrorState message={request.error} onRetry={request.reload} />;
  return children;
}

function Panel({ title, action, children, className = '' }) {
  return <section className={`data-panel ${className}`.trim()}><div className="d-flex align-items-center justify-content-between gap-3 mb-3"><h2 className="h6 mb-0">{title}</h2>{action}</div>{children}</section>;
}

function labelForStatus(status) {
  return ROOM_STATUSES.find(([value]) => value === status)?.[1] || readableEnum(status);
}

function StatusSelect({ value, onChange, disabled, id, label = 'Trạng thái' }) {
  return <label className="d-flex align-items-center gap-2 mb-0"><span className="visually-hidden">{label}</span><select aria-label={label} id={id} className="form-select form-select-sm" value={value || ''} disabled={disabled} onChange={(event) => onChange(event.target.value)}>{ROOM_STATUSES.map(([status, statusLabel]) => <option value={status} key={status}>{statusLabel}</option>)}</select></label>;
}

export function AdminDashboardPage() {
  const request = useAsyncData(useCallback((signal) => adminApi.dashboard(signal), []));
  const data = entityFrom(request.data) || {};
  const counts = data.counts || {};
  const metrics = [
    { label: 'Tài khoản', icon: 'bi-people', value: counts.users },
    { label: 'Phòng', icon: 'bi-door-open', value: counts.rooms },
    { label: 'Khu trọ', icon: 'bi-buildings', value: counts.properties },
    { label: 'Chờ xác minh', icon: 'bi-patch-check', value: counts.pendingVerifications },
    { label: 'Báo cáo cần xử lý', icon: 'bi-flag', value: counts.pendingReports },
    { label: 'Hóa đơn chưa thu', icon: 'bi-receipt', value: counts.unpaidInvoices },
  ];
  const recentUsers = collectionFrom(data.recentUsers).items;
  const recentReports = collectionFrom(data.recentReports).items;

  return <><PageHeader eyebrow="Quản trị hệ thống" title="Tổng quan vận hành" description="Theo dõi dữ liệu thực tế và các việc cần kiểm duyệt trong hệ thống." /><RequestContent request={request} label="Đang tải tổng quan quản trị…"><MetricCards metrics={metrics} /><div className="row g-3"><div className="col-xl-7"><Panel title="Tài khoản mới"><SimpleRecordList items={recentUsers} emptyTitle="Chưa có tài khoản mới" emptyDescription="Tài khoản đăng ký mới sẽ xuất hiện tại đây." renderItem={(user) => <div className="d-flex align-items-center justify-content-between gap-3"><div><strong>{getAccountOptionLabel(user, 'Tài khoản')}</strong><div className="small text-muted-app">{getAccountLoginDetails(user, 'Chưa thiết lập thông tin đăng nhập')} · {formatDate(user.createdAt)}</div></div><StatusBadge status={user.status || user.role} /></div>} /></Panel></div><div className="col-xl-5"><Panel title="Báo cáo gần đây"><SimpleRecordList items={recentReports} emptyTitle="Chưa có báo cáo" emptyDescription="Báo cáo từ người dùng sẽ xuất hiện tại đây." renderItem={(report) => <div className="d-flex align-items-center justify-content-between gap-3"><div><strong>{readableEnum(report.targetType)}</strong><div className="small text-muted-app">{report.reason} · {formatDate(report.createdAt)}</div></div><StatusBadge status={report.status} /></div>} /></Panel></div></div></RequestContent></>;
}

export function AdminUsersPage() {
  const { showToast } = useToast();
  const [filters, setFilters] = useState({ q: '', role: '', status: '' });
  const [updatingId, setUpdatingId] = useState(null);
  const request = useAsyncData(useCallback((signal) => adminApi.users({ ...filters, limit: 50 }, signal), [filters.q, filters.role, filters.status]));
  const users = collectionFrom(request.data).items;

  const changeStatus = async (user, status) => {
    if (!status || status === user.status) return;
    setUpdatingId(user.id);
    try {
      await adminApi.setUserStatus(user.id, status);
      showToast({ variant: 'success', title: 'Đã cập nhật tài khoản', message: `Tài khoản ${getName(user)} đã được cập nhật.` });
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể cập nhật tài khoản', message: 'Vui lòng thử lại.' });
    } finally {
      setUpdatingId(null);
    }
  };

  return <><PageHeader eyebrow="Tài khoản" title="Quản lý người dùng" description="Tìm kiếm và khóa/mở khóa tài khoản khi cần vận hành hệ thống." /><form className="row g-2 mb-4" onSubmit={(event) => event.preventDefault()}><div className="col-md-5"><label className="visually-hidden" htmlFor="admin-user-q">Tìm tài khoản</label><input id="admin-user-q" className="form-control" value={filters.q} maxLength="191" onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Tên, tên đăng nhập, email hoặc số điện thoại" /></div><div className="col-md-3"><label className="visually-hidden" htmlFor="admin-user-role">Vai trò</label><select id="admin-user-role" className="form-select" value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}><option value="">Tất cả vai trò</option><option value="STUDENT">Sinh viên</option><option value="LANDLORD">Chủ trọ</option><option value="ADMIN">Quản trị viên</option></select></div><div className="col-md-3"><label className="visually-hidden" htmlFor="admin-user-status">Trạng thái</label><select id="admin-user-status" className="form-select" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">Mọi trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="DISABLED">Đã khóa</option></select></div><div className="col-md-1"><Button type="button" variant="outline" className="w-100" aria-label="Xóa bộ lọc" icon="bi-x-lg" onClick={() => setFilters({ q: '', role: '', status: '' })} /></div></form><RequestContent request={request} label="Đang tải tài khoản…"><ResourceTable items={users} emptyTitle="Không tìm thấy tài khoản" emptyDescription="Thử điều chỉnh điều kiện tìm kiếm." columns={[{ key: 'fullName', label: 'Người dùng', render: (user) => getAccountOptionLabel(user, '—') }, { key: 'login', label: 'Đăng nhập', render: (user) => getAccountLoginDetails(user, '—') }, { key: 'role', label: 'Vai trò', render: (user) => readableEnum(user.role) }, { key: 'verificationStatus', label: 'Xác minh', kind: 'status' }, { key: 'status', label: 'Trạng thái', kind: 'status' }, { key: 'createdAt', label: 'Ngày tạo', kind: 'date' }]} renderActions={(user) => <div className="d-inline-flex align-items-center gap-1"><select aria-label={`Trạng thái ${getName(user)}`} className="form-select form-select-sm" value={user.status || 'ACTIVE'} disabled={updatingId === user.id} onChange={(event) => changeStatus(user, event.target.value)}><option value="ACTIVE">Hoạt động</option><option value="DISABLED">Khóa</option></select></div>} /></RequestContent></>;
}

export function AdminRoomsPage() {
  const { showToast } = useToast();
  const [updatingId, setUpdatingId] = useState(null);
  const request = useAsyncData(useCallback((signal) => roomApi.list({ availableOnly: false, limit: 50 }, signal), []));
  const rooms = collectionFrom(request.data).items;
  const updateStatus = async (room, status) => {
    if (!status || status === room.status) return;
    setUpdatingId(room.id);
    try {
      await adminApi.setRoomStatus(room.id, status);
      showToast({ variant: 'success', title: 'Đã cập nhật tin đăng', message: `${room.name || room.code} đã chuyển sang ${labelForStatus(status).toLowerCase()}.` });
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể cập nhật tin đăng', message: 'Vui lòng thử lại.' });
    } finally {
      setUpdatingId(null);
    }
  };
  return <><PageHeader eyebrow="Tin đăng phòng" title="Kiểm duyệt trạng thái phòng" description="Đổi trạng thái hiển thị của tin đăng dựa trên tình trạng vận hành thực tế." /><RequestContent request={request} label="Đang tải tin đăng…"><ResourceTable items={rooms} emptyTitle="Chưa có tin đăng" columns={[{ key: 'name', label: 'Phòng' }, { key: 'property.name', label: 'Khu trọ' }, { key: 'property.landlord', label: 'Chủ trọ', render: (room) => getAccountOptionLabel(room.property?.landlord, '—') }, { key: 'price', label: 'Giá', kind: 'currency' }, { key: 'availableSlots', label: 'Chỗ trống', kind: 'number' }, { key: 'status', label: 'Trạng thái', kind: 'status' }]} renderActions={(room) => <StatusSelect value={room.status || 'AVAILABLE'} disabled={updatingId === room.id} onChange={(status) => updateStatus(room, status)} label={`Trạng thái phòng ${room.name || room.id}`} /> } /></RequestContent></>;
}

export function AdminPropertiesPage() {
  const { showToast } = useToast();
  const [pendingReview, setPendingReview] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const request = useAsyncData(useCallback((signal) => propertyApi.list({ limit: 50 }, signal), []));
  const properties = collectionFrom(request.data).items;
  const review = async () => {
    if (!pendingReview) return;
    const { property, status } = pendingReview;
    setUpdatingId(property.id);
    try {
      await adminApi.setPropertyVerification(property.id, status);
      showToast({
        variant: 'success',
        title: status === 'VERIFIED' ? 'Đã xác minh khu trọ' : 'Đã từ chối khu trọ',
        message: 'Chủ trọ đã nhận được thông báo về kết quả xử lý.'
      });
      setPendingReview(null);
      request.reload();
    } catch (error) {
      showToast({
        variant: 'danger',
        title: 'Không thể cập nhật xác minh',
        message: error?.response?.data?.message || 'Vui lòng tải lại danh sách và thử lại.'
      });
    } finally {
      setUpdatingId(null);
    }
  };
  return <><PageHeader eyebrow="Khu trọ" title="Theo dõi khu trọ" description="Kiểm tra thông tin trước khi duyệt để khu trọ có thể được xác minh trên hệ thống." /><RequestContent request={request} label="Đang tải khu trọ…"><ResourceTable items={properties} emptyTitle="Chưa có khu trọ" columns={[{ key: 'name', label: 'Khu trọ' }, { key: 'address', label: 'Địa chỉ' }, { key: 'landlord', label: 'Chủ trọ', render: (property) => getAccountOptionLabel(property.landlord, '—') }, { key: '_count.rooms', label: 'Số phòng', kind: 'number' }, { key: 'verificationStatus', label: 'Xác minh', render: (property) => <StatusBadge status={property.verificationStatus} label={property.verificationStatus === 'PENDING' ? 'Chờ duyệt' : undefined} /> }, { key: 'createdAt', label: 'Ngày tạo', kind: 'date' }]} renderActions={(property) => ['UNVERIFIED', 'PENDING'].includes(property.verificationStatus) ? <div className="d-inline-flex gap-1"><button type="button" className="btn btn-sm btn-outline-primary" disabled={Boolean(updatingId)} onClick={() => setPendingReview({ property, status: 'VERIFIED' })}>Duyệt</button><button type="button" className="btn btn-sm btn-outline-danger" disabled={Boolean(updatingId)} onClick={() => setPendingReview({ property, status: 'REJECTED' })}>Từ chối</button></div> : <span className="small text-muted-app">Đã xử lý</span>} /></RequestContent><ConfirmDialog open={Boolean(pendingReview)} title={pendingReview?.status === 'VERIFIED' ? 'Xác minh khu trọ?' : 'Từ chối xác minh khu trọ?'} description={pendingReview?.status === 'VERIFIED' ? `Khu trọ ${pendingReview?.property?.name || ''} sẽ được đánh dấu đã xác minh và chủ trọ sẽ nhận thông báo.` : `Khu trọ ${pendingReview?.property?.name || ''} sẽ được đánh dấu chưa được duyệt. Chủ trọ sẽ nhận thông báo để kiểm tra lại thông tin.`} confirmLabel={pendingReview?.status === 'VERIFIED' ? 'Xác minh' : 'Từ chối'} danger={pendingReview?.status === 'REJECTED'} loading={Boolean(updatingId)} onCancel={() => !updatingId && setPendingReview(null)} onConfirm={review} /></>;
}

function VerificationEvidence({ item }) {
  const documentUrl = safeUrl(item?.documentUrl);
  return (
    <div className="verification-review__evidence">
      <p className="small fw-bold text-uppercase text-muted-app mb-2">Thông tin người dùng đã gửi</p>
      {item?.type === 'STUDENT' ? <div className="row g-2 small mb-2"><div className="col-sm-6"><span className="text-muted-app d-block">Mã sinh viên</span><strong>{item.studentCode || 'Chưa cung cấp'}</strong></div><div className="col-sm-6"><span className="text-muted-app d-block">Email trường</span><strong>{item.schoolEmail || 'Chưa cung cấp'}</strong></div></div> : null}
      {documentUrl ? <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm"><i className="bi bi-box-arrow-up-right" aria-hidden="true" />Mở liên kết tài liệu</a> : <p className="small text-muted-app mb-2">Chưa có liên kết tài liệu hợp lệ.</p>}
      {item?.note ? <div className="verification-review__applicant-note"><strong>Ghi chú của người gửi</strong><p className="mb-0">{item.note}</p></div> : null}
    </div>
  );
}

function VerificationModal({ item, onClose, onSaved }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState('VERIFIED');
  const [reviewerNote, setReviewerNote] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await verificationApi.review(item.id, { status, reviewerNote: cleanText(reviewerNote, 5_000) || undefined });
      showToast({ variant: 'success', title: 'Đã xử lý xác minh', message: 'Kết quả xác minh đã được lưu.' });
      onSaved();
      onClose();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể xử lý xác minh', message: 'Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open={Boolean(item)} title="Xử lý yêu cầu xác minh" onClose={() => !saving && onClose()}>
      <form onSubmit={submit}>
        <p className="small text-muted-app">{getAccountOptionLabel(item?.user, 'Người dùng')} · {readableEnum(item?.type)}</p>
        <VerificationEvidence item={item} />
        <label className="form-label" htmlFor="verification-status">Kết quả</label>
        <select id="verification-status" className="form-select mb-3" value={status} onChange={(event) => setStatus(event.target.value)}><option value="VERIFIED">Xác minh</option><option value="REJECTED">Từ chối</option></select>
        <label className="form-label" htmlFor="verification-note">Ghi chú cho người dùng</label>
        <textarea id="verification-note" className="form-control mb-4" rows="4" maxLength="5000" value={reviewerNote} onChange={(event) => setReviewerNote(event.target.value)} />
        <div className="d-flex justify-content-end gap-2"><Button type="button" variant="secondary" disabled={saving} onClick={onClose}>Hủy</Button><Button type="submit" loading={saving}>Lưu kết quả</Button></div>
      </form>
    </Modal>
  );
}

export function AdminVerificationsPage() {
  const [selected, setSelected] = useState(null);
  const request = useAsyncData(useCallback((signal) => verificationApi.list({ status: 'PENDING', limit: 50 }, signal), []));
  const items = collectionFrom(request.data).items;
  return <><PageHeader eyebrow="Xác minh" title="Yêu cầu đang chờ xử lý" description="Kiểm tra giấy tờ và lưu kết quả xác minh cho từng tài khoản." /><RequestContent request={request} label="Đang tải yêu cầu xác minh…"><ResourceTable items={items} emptyTitle="Không có yêu cầu chờ xử lý" emptyDescription="Các yêu cầu mới sẽ xuất hiện tại đây." columns={[{ key: 'user', label: 'Người dùng', render: (item) => getAccountOptionLabel(item.user, '—') }, { key: 'type', label: 'Loại', render: (item) => readableEnum(item.type) }, { key: 'documentUrl', label: 'Tài liệu', render: (item) => item.documentUrl ? 'Đã đính kèm' : 'Chưa đính kèm' }, { key: 'createdAt', label: 'Gửi lúc', kind: 'date' }, { key: 'status', label: 'Trạng thái', kind: 'status' }]} renderActions={(item) => <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setSelected(item)}>Xử lý</button>} /></RequestContent><VerificationModal item={selected} onClose={() => setSelected(null)} onSaved={request.reload} /></>;
}

function ReportModal({ item, onClose, onSaved }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState('RESOLVED');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const note = cleanText(adminNote, 5_000);
    if (!note) return;
    setSaving(true);
    try {
      await reportApi.process(item.id, { status, adminNote: note });
      showToast({ variant: 'success', title: 'Đã xử lý báo cáo', message: 'Trạng thái và ghi chú quản trị đã được lưu.' });
      onSaved();
      onClose();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể xử lý báo cáo', message: 'Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={Boolean(item)} title="Xử lý báo cáo" onClose={() => !saving && onClose()}><form onSubmit={submit}><p className="small text-muted-app">{readableEnum(item?.targetType)} · {readableEnum(item?.reason)}</p><label className="form-label" htmlFor="report-status">Trạng thái</label><select id="report-status" className="form-select mb-3" value={status} onChange={(event) => setStatus(event.target.value)}><option value="PROCESSING">Đang xử lý</option><option value="RESOLVED">Đã giải quyết</option><option value="REJECTED">Từ chối</option></select><label className="form-label" htmlFor="report-admin-note">Ghi chú xử lý</label><textarea id="report-admin-note" className="form-control mb-4" rows="4" maxLength="5000" required value={adminNote} onChange={(event) => setAdminNote(event.target.value)} /><div className="d-flex justify-content-end gap-2"><Button type="button" variant="secondary" disabled={saving} onClick={onClose}>Hủy</Button><Button type="submit" loading={saving}>Lưu xử lý</Button></div></form></Modal>;
}

export function AdminReportsPage() {
  const [selected, setSelected] = useState(null);
  const request = useAsyncData(useCallback((signal) => reportApi.list({ limit: 50 }, signal), []));
  const reports = collectionFrom(request.data).items;
  return <><PageHeader eyebrow="Báo cáo" title="Tiếp nhận phản ánh" description="Đánh giá phản ánh của người dùng và ghi lại hướng xử lý minh bạch." /><RequestContent request={request} label="Đang tải báo cáo…"><ResourceTable items={reports} emptyTitle="Chưa có báo cáo" columns={[{ key: 'targetType', label: 'Đối tượng', render: (item) => readableEnum(item.targetType) }, { key: 'reason', label: 'Lý do', render: (item) => readableEnum(item.reason) }, { key: 'reporter', label: 'Người gửi', render: (item) => getAccountOptionLabel(item.reporter, '—') }, { key: 'createdAt', label: 'Ngày gửi', kind: 'date' }, { key: 'status', label: 'Trạng thái', kind: 'status' }]} renderActions={(item) => <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setSelected(item)}>Xử lý</button>} /></RequestContent><ReportModal item={selected} onClose={() => setSelected(null)} onSaved={request.reload} /></>;
}

export function AdminReviewsPage() {
  const { showToast } = useToast();
  const [updatingId, setUpdatingId] = useState(null);
  const request = useAsyncData(useCallback((signal) => reviewApi.list({ limit: 50 }, signal), []));
  const reviews = collectionFrom(request.data).items;
  const moderate = async (review, status) => {
    setUpdatingId(review.id);
    try {
      await reviewApi.moderate(review.id, { status });
      showToast({ variant: 'success', title: 'Đã cập nhật đánh giá', message: `Đánh giá đã được ${status === 'HIDDEN' ? 'ẩn' : 'hiển thị'}.` });
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể cập nhật đánh giá', message: 'Vui lòng thử lại.' });
    } finally {
      setUpdatingId(null);
    }
  };
  return <><PageHeader eyebrow="Đánh giá" title="Kiểm duyệt đánh giá" description="Ẩn hoặc hiển thị đánh giá theo quy định cộng đồng." /><RequestContent request={request} label="Đang tải đánh giá…"><ResourceTable items={reviews} emptyTitle="Chưa có đánh giá" columns={[{ key: 'room.name', label: 'Phòng' }, { key: 'student', label: 'Sinh viên', render: (review) => getAccountOptionLabel(review.student?.user || review.student, '—') }, { key: 'rating', label: 'Điểm', kind: 'number' }, { key: 'comment', label: 'Nội dung' }, { key: 'status', label: 'Trạng thái', kind: 'status' }, { key: 'createdAt', label: 'Ngày gửi', kind: 'date' }]} renderActions={(review) => <button type="button" className="btn btn-sm btn-light" disabled={updatingId === review.id} onClick={() => moderate(review, review.status === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN')}>{review.status === 'HIDDEN' ? 'Hiển thị' : 'Ẩn'}</button>} /></RequestContent></>;
}

export function AdminStatisticsPage() {
  const request = useAsyncData(useCallback((signal) => adminApi.dashboard(signal), []));
  const data = entityFrom(request.data) || {};
  const counts = data.counts || {};
  const metrics = useMemo(() => [
    { label: 'Hợp đồng hiệu lực', icon: 'bi-file-earmark-text', value: counts.activeContracts },
    { label: 'Hóa đơn chưa thanh toán', icon: 'bi-receipt', value: counts.unpaidInvoices },
    { label: 'Yêu cầu xác minh', icon: 'bi-patch-check', value: counts.pendingVerifications },
    { label: 'Báo cáo chờ xử lý', icon: 'bi-flag', value: counts.pendingReports },
  ], [counts.activeContracts, counts.pendingReports, counts.pendingVerifications, counts.unpaidInvoices]);
  return <><PageHeader eyebrow="Thống kê" title="Chỉ số vận hành" description="Các chỉ số tổng hợp được tính từ dữ liệu hiện có trong hệ thống." /><RequestContent request={request} label="Đang tải thống kê…"><MetricCards metrics={metrics} /><Panel title="Cách đọc số liệu"><p className="text-muted-app mb-0">Các chỉ số này là ảnh chụp tại thời điểm tải trang. Dùng mục Tài khoản, Tin đăng, Xác minh và Báo cáo để đi sâu vào từng dữ liệu nguồn.</p></Panel></RequestContent></>;
}
