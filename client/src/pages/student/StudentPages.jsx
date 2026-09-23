import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  appointmentApi,
  conversationApi,
  contractApi,
  dashboardApi,
  favoriteApi,
  groupApi,
  invoiceApi,
  notificationApi,
  roommateApi,
  roommatePostApi,
  roommateRequestApi,
  roomApi,
  universityApi,
  userApi,
} from '../../api/resources';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/AsyncState';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { MetricCards, ResourceTable, SimpleRecordList } from '../../components/common/ResourceTable';
import { StatusBadge, VerifiedBadge } from '../../components/common/StatusBadge';
import { ChatWorkspace } from '../../components/chat/ChatWorkspace';
import { RoomList } from '../../components/rooms/RoomList';
import { MatchScore } from '../../components/rooms/RoomVisuals';
import { VerificationRequestPanel } from '../../components/verifications/VerificationRequestPanel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { asArray, collectionFrom, entityFrom, getAccountOptionLabel, getName, roomAmenities, roomDistance } from '../../utils/data';
import { formatCurrency, formatDate, formatDistance, formatNumber, readableEnum } from '../../utils/formatters';
import { cleanText, numericOrUndefined, recordDescription, recordTitle, valueAt } from '../../utils/records';

function metricValue(source, paths) {
  for (const path of paths) {
    const value = valueAt(source, path);
    if (Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function Panel({ title, action, children, className = '' }) {
  return <section className={`data-panel ${className}`.trim()}><div className="d-flex align-items-center justify-content-between gap-3 mb-3"><h2 className="h6 mb-0">{title}</h2>{action}</div>{children}</section>;
}

function RequestContent({ request, loadingLabel, empty, children }) {
  if (request.loading) return <LoadingState label={loadingLabel} />;
  if (request.error) return <ErrorState message={request.error} onRetry={request.reload} />;
  return children ?? empty;
}

function RoommateCard({ profile, onInvite, inviting }) {
  const user = profile?.student?.user || profile?.user || profile;
  const score = profile?.matchScore ?? profile?.match?.score;
  const reasons = asArray(profile?.matchReasons || profile?.match?.reasons);
  return (
    <article className="roommate-profile-card h-100">
      <div className="d-flex align-items-start justify-content-between gap-2"><div className="d-flex align-items-center gap-2"><span className="avatar-placeholder"><i className="bi bi-person" aria-hidden="true" /></span><div><h2 className="h6 mb-0">{getAccountOptionLabel(user, 'Hồ sơ sinh viên')}</h2><p className="small text-muted-app mb-0">{profile?.university?.name || user?.university?.name || 'Trường đang cập nhật'}</p></div></div>{user?.verificationStatus === 'VERIFIED' ? <VerifiedBadge status="VERIFIED" /> : null}</div>
      <div className="d-flex flex-wrap gap-3 small text-muted-app my-3"><span><i className="bi bi-wallet2 me-1" aria-hidden="true" />{Number.isFinite(Number(profile?.minBudget ?? profile?.budgetMin)) ? `${formatCurrency(profile.minBudget ?? profile.budgetMin)} – ${formatCurrency(profile.maxBudget ?? profile.budgetMax)}` : 'Ngân sách đang cập nhật'}</span>{profile?.preferredArea ? <span><i className="bi bi-geo-alt me-1" aria-hidden="true" />{profile.preferredArea}</span> : null}</div>
      {Number.isFinite(Number(score)) ? <MatchScore score={score} reasons={reasons} /> : null}
      {profile?.bio || profile?.description ? <p className="small text-muted-app mb-0 mt-3">{profile.bio || profile.description}</p> : null}
      {onInvite ? <Button className="w-100 mt-3" variant="outline" loading={inviting} icon="bi-send" onClick={() => onInvite(profile)}>Gửi lời mời</Button> : null}
    </article>
  );
}

export function StudentDashboardPage() {
  const request = useAsyncData(useCallback((signal) => dashboardApi.student(signal), []));
  const data = entityFrom(request.data) || {};
  const recommendedRooms = collectionFrom(data.recommendations || data.recommendedRooms).items;
  const upcomingAppointments = collectionFrom(data.upcomingAppointments || data.appointments).items;
  const roommateRequests = collectionFrom(data.roommateRequests || data.pendingRoommateRequests).items;
  const metrics = [
    { label: 'Phòng đề xuất', icon: 'bi-bullseye', value: metricValue(data, ['summary.recommendations', 'recommendedRoomsCount', 'recommendationsCount']) },
    { label: 'Phòng đã lưu', icon: 'bi-heart', value: metricValue(data, ['summary.favorites', 'favoriteCount', 'favoritesCount']) },
    { label: 'Lịch sắp tới', icon: 'bi-calendar-check', value: metricValue(data, ['summary.appointments', 'upcomingAppointmentsCount', 'appointmentsCount']) },
    { label: 'Hóa đơn cần xem', icon: 'bi-receipt', value: metricValue(data, ['summary.unpaidInvoices', 'unpaidInvoiceCount', 'invoicesDueCount']) },
  ];

  return <><PageHeader eyebrow="Khu vực sinh viên" title="Tổng quan của bạn" description="Theo dõi phòng phù hợp, lịch xem và các việc cần xử lý." action={<Link to="/rooms" className="btn btn-primary"><i className="bi bi-search me-1" aria-hidden="true" />Tìm phòng</Link>} /><RequestContent request={request} loadingLabel="Đang tải tổng quan…"><MetricCards metrics={metrics} /><div className="row g-3"><div className="col-xl-8"><Panel title="Phòng phù hợp với bạn" action={<Link to="/rooms" className="btn btn-ghost btn-sm">Xem thêm</Link>}>{recommendedRooms.length ? <RoomList rooms={recommendedRooms} compact /> : <EmptyState icon="bi-bullseye" title="Chưa có gợi ý phòng" description="Hoàn thiện nhu cầu tìm phòng để hệ thống gợi ý chính xác hơn." action={<Link to="/student/profile" className="btn btn-outline-primary">Cập nhật nhu cầu</Link>} />}</Panel></div><div className="col-xl-4"><Panel title="Lịch xem sắp tới" action={<Link to="/student/appointments" className="btn btn-ghost btn-sm">Tất cả</Link>}><SimpleRecordList items={upcomingAppointments} emptyTitle="Chưa có lịch xem phòng" emptyDescription="Bạn có thể đặt lịch trực tiếp tại trang chi tiết phòng." renderItem={(appointment) => <div className="d-flex justify-content-between gap-2"><div><strong>{appointment.room?.name || appointment.room?.code || 'Lịch xem phòng'}</strong><div className="small text-muted-app">{formatDate(appointment.scheduledAt || appointment.appointmentAt, { dateStyle: 'medium', timeStyle: 'short' })}</div></div><StatusBadge status={appointment.status} /></div>} /></Panel><Panel title="Lời mời ở ghép" className="mt-3" action={<Link to="/student/roommate-requests" className="btn btn-ghost btn-sm">Xem</Link>}><SimpleRecordList items={roommateRequests} emptyTitle="Chưa có lời mời mới" emptyDescription="Các lời mời ở ghép sẽ xuất hiện ở đây." renderItem={(invite) => <div className="d-flex justify-content-between gap-2"><div><strong>{getName(invite.sender?.user || invite.sender || invite.fromUser) || 'Lời mời ở ghép'}</strong><div className="small text-muted-app">{formatDate(invite.createdAt)}</div></div><StatusBadge status={invite.status} /></div>} /></Panel></div></div></RequestContent></>;
}

export function StudentProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const request = useAsyncData(useCallback((signal) => userApi.me(signal), []));
  const universitiesRequest = useAsyncData(useCallback((signal) => universityApi.list({ limit: 50 }, signal), []));
  const profile = entityFrom(request.data) || user;
  const universities = collectionFrom(universitiesRequest.data).items;
  const [values, setValues] = useState({
    fullName: '',
    phone: '',
    studentCode: '',
    universityId: '',
    schoolEmail: '',
    faculty: '',
    academicYear: '',
    hometown: '',
    bio: '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!profile) return;
    const studentProfile = profile.studentProfile || {};
    setValues({
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      studentCode: studentProfile.studentCode || '',
      universityId: String(studentProfile.universityId || studentProfile.university?.id || ''),
      schoolEmail: studentProfile.schoolEmail || '',
      faculty: studentProfile.faculty || '',
      academicYear: studentProfile.academicYear || '',
      hometown: studentProfile.hometown || '',
      bio: studentProfile.bio || '',
    });
  }, [profile]);

  const updateValue = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const saveProfile = async (event) => {
    event.preventDefault();
    const fullName = cleanText(values.fullName, 120);
    const universityId = numericOrUndefined(values.universityId);
    const schoolEmail = cleanText(values.schoolEmail, 191);
    if (fullName.length < 2) {
      setFormError('Họ tên cần có ít nhất 2 ký tự.');
      return;
    }
    if (universityId !== undefined && (!Number.isInteger(universityId) || universityId < 1)) {
      setFormError('Trường đã chọn không hợp lệ.');
      return;
    }
    if (schoolEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolEmail)) {
      setFormError('Email trường không hợp lệ.');
      return;
    }

    const accountPayload = {
      fullName,
      phone: cleanText(values.phone, 30) || null,
    };
    const studentProfilePayload = {
      studentCode: cleanText(values.studentCode, 50) || null,
      universityId: universityId ?? null,
      schoolEmail: schoolEmail ? schoolEmail.toLowerCase() : null,
      faculty: cleanText(values.faculty, 120) || null,
      academicYear: cleanText(values.academicYear, 30) || null,
      hometown: cleanText(values.hometown, 120) || null,
      bio: cleanText(values.bio, 5_000) || null,
    };

    setSaving(true);
    setFormError('');
    try {
      await Promise.all([
        userApi.updateAccount(accountPayload),
        userApi.updateProfile(studentProfilePayload),
      ]);
      showToast({ variant: 'success', title: 'Đã cập nhật hồ sơ', message: 'Thông tin tài khoản và hồ sơ sinh viên đã được lưu.' });
      request.reload();
    } catch {
      setFormError('Không thể cập nhật hồ sơ. Vui lòng kiểm tra thông tin và thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (passwords.newPassword.length < 8) {
      setPasswordError('Mật khẩu mới cần có ít nhất 8 ký tự.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    setChangingPassword(true);
    setPasswordError('');
    try {
      await userApi.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast({ variant: 'success', title: 'Đã đổi mật khẩu', message: 'Mật khẩu mới đã được lưu an toàn.' });
    } catch {
      setPasswordError('Không thể đổi mật khẩu. Kiểm tra lại mật khẩu hiện tại và thử lại.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Hồ sơ sinh viên" title="Thông tin tài khoản và sinh viên" description="Hoàn thiện hồ sơ để hệ thống hiểu đúng trường học và thông tin liên hệ của bạn." />
      <RequestContent request={request} loadingLabel="Đang tải hồ sơ…">
        <div className="row g-3">
          <div className="col-lg-8">
            <Panel title="Thông tin cá nhân">
              <form onSubmit={saveProfile} noValidate>
                {formError ? <div className="alert alert-danger" role="alert">{formError}</div> : null}
                {universitiesRequest.error ? <div className="alert alert-warning" role="alert">Không thể tải danh sách trường. Bạn vẫn có thể lưu các thông tin khác.</div> : null}
                <div className="row g-3">
                  <div className="col-md-6"><label className="form-label" htmlFor="student-name">Họ và tên</label><input id="student-name" className="form-control" value={values.fullName} maxLength="120" onChange={updateValue('fullName')} /></div>
                  <div className="col-md-6"><label className="form-label" htmlFor="student-username">Tên đăng nhập</label><input id="student-username" className="form-control" value={profile?.username || 'Không dùng tên đăng nhập'} disabled /></div>
                  <div className="col-md-6"><label className="form-label" htmlFor="student-email">Email tài khoản</label><input id="student-email" className="form-control" value={profile?.email || 'Không dùng email'} disabled /></div>
                  <div className="col-md-6"><label className="form-label" htmlFor="student-phone">Số điện thoại</label><input id="student-phone" className="form-control" value={values.phone} maxLength="30" onChange={updateValue('phone')} /></div>
                  <div className="col-md-6"><label className="form-label" htmlFor="student-university">Trường đại học</label><select id="student-university" className="form-select" value={values.universityId} onChange={updateValue('universityId')} disabled={universitiesRequest.loading}><option value="">Chưa chọn trường</option>{universities.map((university) => <option key={university.id} value={university.id}>{university.name}</option>)}</select></div>
                  <div className="col-md-6"><label className="form-label" htmlFor="student-code">Mã sinh viên</label><input id="student-code" className="form-control" value={values.studentCode} maxLength="50" onChange={updateValue('studentCode')} /></div>
                  <div className="col-md-6"><label className="form-label" htmlFor="student-school-email">Email trường</label><input id="student-school-email" className="form-control" type="email" value={values.schoolEmail} maxLength="191" onChange={updateValue('schoolEmail')} /></div>
                  <div className="col-md-4"><label className="form-label" htmlFor="student-faculty">Khoa</label><input id="student-faculty" className="form-control" value={values.faculty} maxLength="120" onChange={updateValue('faculty')} /></div>
                  <div className="col-md-4"><label className="form-label" htmlFor="student-academic-year">Khóa học</label><input id="student-academic-year" className="form-control" value={values.academicYear} maxLength="30" onChange={updateValue('academicYear')} /></div>
                  <div className="col-md-4"><label className="form-label" htmlFor="student-hometown">Quê quán</label><input id="student-hometown" className="form-control" value={values.hometown} maxLength="120" onChange={updateValue('hometown')} /></div>
                  <div className="col-12"><label className="form-label" htmlFor="student-bio">Giới thiệu ngắn</label><textarea id="student-bio" className="form-control" rows="4" maxLength="5000" value={values.bio} onChange={updateValue('bio')} /></div>
                </div>
                <Button type="submit" className="mt-4" loading={saving} icon="bi-check-lg">Lưu thay đổi</Button>
              </form>
            </Panel>
          </div>
          <div className="col-lg-4">
            <Panel title="Trạng thái tài khoản"><p className="mb-2"><strong>Vai trò:</strong> {readableEnum(profile?.role)}</p><p className="mb-0"><strong>Xác minh:</strong> <StatusBadge status={profile?.verificationStatus || profile?.studentProfile?.verificationStatus} /></p></Panel>
            <Panel title="Đổi mật khẩu" className="mt-3">
              <form onSubmit={savePassword}>
                {passwordError ? <div className="alert alert-danger small" role="alert">{passwordError}</div> : null}
                <label className="form-label" htmlFor="current-password">Mật khẩu hiện tại</label>
                <input id="current-password" className="form-control mb-3" type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} required />
                <label className="form-label" htmlFor="new-password">Mật khẩu mới</label>
                <input id="new-password" className="form-control mb-3" type="password" autoComplete="new-password" value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} required />
                <label className="form-label" htmlFor="confirm-new-password">Xác nhận mật khẩu mới</label>
                <input id="confirm-new-password" className="form-control mb-3" type="password" autoComplete="new-password" value={passwords.confirmPassword} onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))} required />
                <Button type="submit" variant="outline" className="w-100" loading={changingPassword}>Đổi mật khẩu</Button>
              </form>
            </Panel>
          </div>
          <div className="col-12"><VerificationRequestPanel role="STUDENT" profile={profile} onSubmitted={request.reload} /></div>
        </div>
      </RequestContent>
    </>
  );
}

export function StudentFavoritesPage() {
  const { showToast } = useToast();
  const request = useAsyncData(useCallback((signal) => favoriteApi.list({ limit: 100 }, signal), []));
  const [removing, setRemoving] = useState(null);
  const [confirmRoom, setConfirmRoom] = useState(null);
  const items = collectionFrom(request.data).items;
  const rooms = items.map((favorite) => favorite.room || favorite).filter((room) => room?.id);
  const removeFavorite = async () => {
    if (!confirmRoom) return;
    setRemoving(confirmRoom.id);
    try {
      await roomApi.unfavorite(confirmRoom.id);
      showToast({ variant: 'success', title: 'Đã bỏ yêu thích', message: 'Phòng đã được xóa khỏi danh sách yêu thích.' });
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể cập nhật', message: 'Vui lòng thử lại.' });
    } finally {
      setRemoving(null);
      setConfirmRoom(null);
    }
  };
  return <><PageHeader eyebrow="Phòng yêu thích" title="Danh sách phòng đã lưu" description="So sánh và xem lại các phòng bạn quan tâm." action={<Link to="/rooms" className="btn btn-outline-primary"><i className="bi bi-search me-1" aria-hidden="true" />Tìm thêm phòng</Link>} /><RequestContent request={request} loadingLabel="Đang tải phòng yêu thích…"><RoomList rooms={rooms} emptyTitle="Bạn chưa lưu phòng nào" emptyDescription="Lưu các phòng phù hợp để xem lại sau." /><div className="d-flex flex-wrap gap-2 mt-4">{rooms.map((room) => <button type="button" className="btn btn-sm btn-light" key={room.id} disabled={removing === room.id} onClick={() => setConfirmRoom(room)}><i className="bi bi-heartbreak me-1" aria-hidden="true" />Bỏ lưu {room.name || room.code}</button>)}</div></RequestContent><ConfirmDialog open={Boolean(confirmRoom)} title="Bỏ phòng yêu thích?" description={`Bạn có chắc muốn bỏ lưu ${confirmRoom?.name || confirmRoom?.code || 'phòng này'}?`} confirmLabel="Bỏ lưu" danger loading={Boolean(removing)} onCancel={() => setConfirmRoom(null)} onConfirm={removeFavorite} /></>;
}

export function StudentComparePage() {
  const [searchParams] = useSearchParams();
  const ids = useMemo(() => (searchParams.get('ids') || '').split(',').map((id) => id.trim()).filter((id) => /^[A-Za-z0-9_-]{1,100}$/.test(id)).slice(0, 4), [searchParams]);
  const request = useAsyncData(useCallback(async (signal) => {
    if (!ids.length) return [];
    const results = await Promise.all(ids.map((id) => roomApi.detail(id, undefined, signal)));
    return results.map(entityFrom).filter(Boolean);
  }, [ids.join(',')]), [ids.join(',')]);
  const rooms = asArray(request.data);
  const comparisonRows = [
    ['Giá thuê', (room) => formatCurrency(room.price)], ['Diện tích', (room) => Number.isFinite(Number(room.area)) ? `${formatNumber(room.area)} m²` : '—'], ['Địa chỉ', (room) => room.property?.address || room.address || '—'], ['Khoảng cách', (room) => formatDistance(roomDistance(room)) || '—'], ['Sức chứa', (room) => Number.isFinite(Number(room.capacity)) ? `${formatNumber(room.capacity)} người` : '—'], ['Chỗ trống', (room) => Number.isFinite(Number(room.availableSlots)) ? `${formatNumber(room.availableSlots)} chỗ` : '—'], ['Điện', (room) => formatCurrency(room.electricityPrice ?? room.electricityRate)], ['Nước', (room) => formatCurrency(room.waterPrice ?? room.waterRate)], ['Internet', (room) => formatCurrency(room.internetFee)], ['Gửi xe', (room) => formatCurrency(room.parkingFee)], ['Tiện ích', (room) => roomAmenities(room).map((amenity) => typeof amenity === 'string' ? amenity : amenity.name).filter(Boolean).join(', ') || '—'], ['Tình trạng', (room) => <StatusBadge status={room.status} />],
  ];
  return <><PageHeader eyebrow="So sánh phòng" title="Đặt các lựa chọn cạnh nhau" description="Chọn tối đa bốn phòng từ trang tìm kiếm để so sánh dữ liệu thực tế." action={<Link to="/rooms" className="btn btn-outline-primary"><i className="bi bi-search me-1" aria-hidden="true" />Chọn phòng</Link>} />{!ids.length ? <EmptyState icon="bi-columns-gap" title="Chưa chọn phòng để so sánh" description="Tích “So sánh” trên thẻ phòng ở trang tìm kiếm." action={<Link to="/rooms" className="btn btn-primary">Tìm phòng</Link>} /> : <RequestContent request={request} loadingLabel="Đang tải dữ liệu so sánh…"><div className="comparison-table-wrap"><table className="table comparison-table"><thead><tr><th>Tiêu chí</th>{rooms.map((room) => <th key={room.id}><Link to={`/rooms/${encodeURIComponent(room.id)}`}>{room.name || room.code || 'Phòng trọ'}</Link></th>)}</tr></thead><tbody>{comparisonRows.map(([label, render]) => <tr key={label}><th>{label}</th>{rooms.map((room) => <td key={room.id}>{render(room)}</td>)}</tr>)}</tbody></table></div></RequestContent>}</>;
}

export function StudentRoommateProfilePage() {
  const { showToast } = useToast();
  const profileRequest = useAsyncData(useCallback((signal) => roommateApi.mine(signal), []));
  const universitiesRequest = useAsyncData(useCallback((signal) => universityApi.list({ limit: 50 }, signal), []));
  const profile = entityFrom(profileRequest.data) || {};
  const [values, setValues] = useState({ gender: '', hometown: '', universityId: '', faculty: '', cohort: '', minBudget: '', maxBudget: '', preferredArea: '', maxDistanceKm: '', smoking: 'false', acceptsSmoking: 'false', hasPets: 'false', acceptsPets: 'false', cooksOften: 'false', sleepTime: '', wakeTime: '', cleanlinessLevel: '', socialPreference: '', desiredRoommates: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const universities = collectionFrom(universitiesRequest.data).items;
  useEffect(() => {
    if (!profile?.id) return;
    setValues({ gender: profile.gender || '', hometown: profile.hometown || '', universityId: String(profile.universityId || profile.university?.id || ''), faculty: profile.faculty || '', cohort: profile.academicYear || '', minBudget: String(profile.budgetMin ?? ''), maxBudget: String(profile.budgetMax ?? ''), preferredArea: profile.preferredArea || '', maxDistanceKm: String(profile.maxDistanceKm ?? ''), smoking: String(Boolean(profile.isSmoking)), acceptsSmoking: String(Boolean(profile.acceptsSmoking)), hasPets: String(Boolean(profile.hasPets)), acceptsPets: String(Boolean(profile.acceptsPets)), cooksOften: String(Boolean(profile.cooksOften)), sleepTime: profile.sleepTime || '', wakeTime: profile.wakeUpTime || '', cleanlinessLevel: String(profile.cleanlinessLevel || ''), socialPreference: profile.socialPreference || '', desiredRoommates: String(profile.preferredRoommates ?? ''), bio: profile.bio || profile.description || '' });
  }, [profile?.id]);
  const change = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const save = async (event) => {
    event.preventDefault();
    const minBudget = numericOrUndefined(values.minBudget);
    const maxBudget = numericOrUndefined(values.maxBudget);
    const maxDistanceKm = numericOrUndefined(values.maxDistanceKm);
    const desiredRoommates = numericOrUndefined(values.desiredRoommates);
    if (minBudget === undefined || maxBudget === undefined || minBudget < 0 || maxBudget < minBudget || (maxDistanceKm !== undefined && maxDistanceKm <= 0) || (desiredRoommates !== undefined && desiredRoommates < 1)) {
      setError('Kiểm tra lại ngân sách, khoảng cách và số người mong muốn.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { gender: values.gender || 'PREFER_NOT_TO_SAY', hometown: cleanText(values.hometown, 100) || undefined, universityId: values.universityId || undefined, faculty: cleanText(values.faculty, 100) || undefined, academicYear: cleanText(values.cohort, 50) || undefined, budgetMin: minBudget, budgetMax: maxBudget, preferredArea: cleanText(values.preferredArea, 150) || undefined, maxDistanceKm, isSmoking: values.smoking === 'true', acceptsSmoking: values.acceptsSmoking === 'true', hasPets: values.hasPets === 'true', acceptsPets: values.acceptsPets === 'true', cooksOften: values.cooksOften === 'true', sleepTime: values.sleepTime || undefined, wakeUpTime: values.wakeTime || undefined, cleanlinessLevel: numericOrUndefined(values.cleanlinessLevel), socialPreference: values.socialPreference || undefined, preferredRoommates: desiredRoommates, bio: cleanText(values.bio, 1_000) || undefined };
      if (profile?.id) await roommateApi.updateMine(payload);
      else await roommateApi.createMine(payload);
      showToast({ variant: 'success', title: 'Đã lưu hồ sơ ở ghép', message: 'Hồ sơ của bạn có thể được dùng để tính mức độ phù hợp.' });
      profileRequest.reload();
    } catch {
      setError('Không thể lưu hồ sơ ở ghép. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };
  return <><PageHeader eyebrow="Ở ghép" title="Hồ sơ ở ghép của bạn" description="Chỉ chia sẻ thông tin bạn chủ động cung cấp để giúp tìm bạn cùng phòng phù hợp." /><RequestContent request={profileRequest} loadingLabel="Đang tải hồ sơ ở ghép…"><Panel title="Sở thích và nhu cầu"><form onSubmit={save}>{error ? <div className="alert alert-danger" role="alert">{error}</div> : null}<div className="row g-3"><div className="col-md-4"><label className="form-label" htmlFor="mate-gender">Giới tính</label><select id="mate-gender" className="form-select" value={values.gender} onChange={change('gender')}><option value="">Không nêu</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></select></div><div className="col-md-4"><label className="form-label" htmlFor="mate-hometown">Quê quán</label><input id="mate-hometown" className="form-control" maxLength="100" value={values.hometown} onChange={change('hometown')} /></div><div className="col-md-4"><label className="form-label" htmlFor="mate-university">Trường</label><select id="mate-university" className="form-select" value={values.universityId} onChange={change('universityId')} disabled={universitiesRequest.loading}><option value="">Chọn trường</option>{universities.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div><div className="col-md-4"><label className="form-label" htmlFor="mate-faculty">Khoa</label><input id="mate-faculty" className="form-control" maxLength="100" value={values.faculty} onChange={change('faculty')} /></div><div className="col-md-4"><label className="form-label" htmlFor="mate-cohort">Khóa</label><input id="mate-cohort" className="form-control" maxLength="50" value={values.cohort} onChange={change('cohort')} /></div><div className="col-md-4"><label className="form-label" htmlFor="mate-area">Khu vực muốn ở</label><input id="mate-area" className="form-control" maxLength="150" value={values.preferredArea} onChange={change('preferredArea')} /></div><div className="col-md-3"><label className="form-label" htmlFor="mate-min-budget">Ngân sách từ</label><input id="mate-min-budget" className="form-control" inputMode="numeric" value={values.minBudget} onChange={change('minBudget')} /></div><div className="col-md-3"><label className="form-label" htmlFor="mate-max-budget">Ngân sách đến</label><input id="mate-max-budget" className="form-control" inputMode="numeric" value={values.maxBudget} onChange={change('maxBudget')} /></div><div className="col-md-3"><label className="form-label" htmlFor="mate-distance">Khoảng cách tối đa (km)</label><input id="mate-distance" className="form-control" inputMode="decimal" value={values.maxDistanceKm} onChange={change('maxDistanceKm')} /></div><div className="col-md-3"><label className="form-label" htmlFor="mate-people">Số người muốn ở cùng</label><input id="mate-people" className="form-control" inputMode="numeric" value={values.desiredRoommates} onChange={change('desiredRoommates')} /></div><div className="col-md-4"><label className="form-label" htmlFor="mate-smoking">Bạn có hút thuốc?</label><select id="mate-smoking" className="form-select" value={values.smoking} onChange={change('smoking')}><option value="false">Không</option><option value="true">Có</option></select></div><div className="col-md-4"><label className="form-label" htmlFor="mate-accept-smoking">Chấp nhận hút thuốc?</label><select id="mate-accept-smoking" className="form-select" value={values.acceptsSmoking} onChange={change('acceptsSmoking')}><option value="false">Không</option><option value="true">Có</option></select></div><div className="col-md-4"><label className="form-label" htmlFor="mate-pets">Chấp nhận thú cưng?</label><select id="mate-pets" className="form-select" value={values.acceptsPets} onChange={change('acceptsPets')}><option value="false">Không</option><option value="true">Có</option></select></div><div className="col-md-4"><label className="form-label" htmlFor="mate-cooking">Thường nấu ăn?</label><select id="mate-cooking" className="form-select" value={values.cooksOften} onChange={change('cooksOften')}><option value="false">Không thường xuyên</option><option value="true">Có</option></select></div><div className="col-md-4"><label className="form-label" htmlFor="mate-sleep">Giờ ngủ</label><input id="mate-sleep" className="form-control" type="time" value={values.sleepTime} onChange={change('sleepTime')} /></div><div className="col-md-4"><label className="form-label" htmlFor="mate-wake">Giờ thức dậy</label><input id="mate-wake" className="form-control" type="time" value={values.wakeTime} onChange={change('wakeTime')} /></div><div className="col-md-6"><label className="form-label" htmlFor="mate-cleanliness">Mức độ sạch sẽ (1–5)</label><select id="mate-cleanliness" className="form-select" value={values.cleanlinessLevel} onChange={change('cleanlinessLevel')}><option value="">Chưa chọn</option><option value="1">1 — Linh hoạt</option><option value="2">2</option><option value="3">3 — Cân bằng</option><option value="4">4</option><option value="5">5 — Rất gọn gàng</option></select></div><div className="col-md-6"><label className="form-label" htmlFor="mate-social">Phong cách sinh hoạt</label><select id="mate-social" className="form-select" value={values.socialPreference} onChange={change('socialPreference')}><option value="">Chưa chọn</option><option value="QUIET">Ưu tiên yên tĩnh</option><option value="BALANCED">Cân bằng</option><option value="SOCIAL">Thích giao lưu</option></select></div><div className="col-12"><label className="form-label" htmlFor="mate-bio">Giới thiệu bản thân</label><textarea id="mate-bio" className="form-control" rows="4" maxLength="1000" value={values.bio} onChange={change('bio')} /></div></div><Button type="submit" loading={saving} icon="bi-check-lg" className="mt-4">Lưu hồ sơ ở ghép</Button></form></Panel></RequestContent></>;
}

export function StudentRoommatesPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const [draft, setDraft] = useState(keyword);
  const request = useAsyncData(useCallback((signal) => roommateApi.list({ preferredArea: keyword || undefined, limit: 30 }, signal), [keyword]));
  const profiles = collectionFrom(request.data).items;
  const [invitingId, setInvitingId] = useState(null);
  const invite = async (profile) => {
    const recipientId = profile?.studentId || profile?.student?.id || profile?.userId || profile?.user?.id || profile?.id;
    if (!recipientId) return;
    setInvitingId(profile.id);
    try {
      await roommateRequestApi.create({ recipientId });
      showToast({ variant: 'success', title: 'Đã gửi lời mời', message: 'Lời mời ở ghép đang chờ phản hồi.' });
    } catch {
      showToast({ variant: 'danger', title: 'Không thể gửi lời mời', message: 'Có thể đã tồn tại một lời mời đang chờ xử lý.' });
    } finally {
      setInvitingId(null);
    }
  };
  return <><PageHeader eyebrow="Tìm ở ghép" title="Khám phá bạn cùng phòng" description="Điểm phù hợp và lý do chỉ được hiển thị khi backend có đủ dữ liệu hồ sơ." action={<Link to="/student/roommate-profile" className="btn btn-outline-primary"><i className="bi bi-person-vcard me-1" aria-hidden="true" />Cập nhật hồ sơ</Link>} /><form className="row g-2 mb-4" onSubmit={(event) => { event.preventDefault(); const next = cleanText(draft, 100); setSearchParams(next ? { keyword: next } : {}); }}><div className="col-md-6"><label className="visually-hidden" htmlFor="roommate-search">Tìm người ở ghép</label><input id="roommate-search" className="form-control" placeholder="Tìm theo trường, khu vực hoặc sở thích" value={draft} maxLength="100" onChange={(event) => setDraft(event.target.value)} /></div><div className="col-auto"><Button type="submit" icon="bi-search">Tìm hồ sơ</Button></div></form><RequestContent request={request} loadingLabel="Đang tìm hồ sơ ở ghép…">{profiles.length ? <div className="row g-3">{profiles.map((profile) => <div className="col-md-6 col-xl-4" key={profile.id}><RoommateCard profile={profile} onInvite={invite} inviting={invitingId === profile.id} /></div>)}</div> : <EmptyState icon="bi-people" title="Chưa tìm thấy hồ sơ phù hợp" description="Thử điều chỉnh tiêu chí hoặc hoàn thiện hồ sơ ở ghép của bạn." action={<Link to="/student/roommate-profile" className="btn btn-primary">Hoàn thiện hồ sơ</Link>} />}</RequestContent></>;
}

function RoommatePostForm({ initialPost, defaultRoomId, onSubmit, saving }) {
  const [values, setValues] = useState(() => ({ title: initialPost?.title || '', content: initialPost?.content || initialPost?.description || '', area: initialPost?.area || '', budgetPerPerson: String(initialPost?.budgetPerPerson ?? initialPost?.budget ?? ''), neededPeople: String(initialPost?.neededPeople ?? initialPost?.peopleNeeded ?? ''), preferredGender: initialPost?.preferredGender || '', moveInDate: initialPost?.moveInDate ? String(initialPost.moveInDate).slice(0, 10) : '', roomId: initialPost?.roomId || defaultRoomId || '' }));
  const [error, setError] = useState('');
  const change = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    const title = cleanText(values.title, 160);
    const content = cleanText(values.content, 2_000);
    const budgetPerPerson = numericOrUndefined(values.budgetPerPerson);
    const neededPeople = numericOrUndefined(values.neededPeople);
    if (title.length < 5 || content.length < 10 || !cleanText(values.area, 150) || budgetPerPerson === undefined || budgetPerPerson <= 0 || !Number.isInteger(neededPeople) || neededPeople < 1) {
      setError('Điền tiêu đề, nội dung, khu vực, ngân sách và số người cần tìm hợp lệ.');
      return;
    }
    setError('');
    onSubmit({ title, content, area: cleanText(values.area, 150), budgetPerPerson, neededPeople, preferredGender: values.preferredGender || undefined, moveInDate: values.moveInDate || undefined, roomId: values.roomId || undefined });
  };
  return <form onSubmit={submit}>{error ? <div className="alert alert-danger" role="alert">{error}</div> : null}<label className="form-label" htmlFor="post-title">Tiêu đề</label><input id="post-title" className="form-control mb-3" maxLength="160" value={values.title} onChange={change('title')} /><label className="form-label" htmlFor="post-content">Nội dung</label><textarea id="post-content" className="form-control mb-3" rows="4" maxLength="2000" value={values.content} onChange={change('content')} /><div className="row g-3"><div className="col-md-6"><label className="form-label" htmlFor="post-area">Khu vực</label><input id="post-area" className="form-control" maxLength="150" value={values.area} onChange={change('area')} /></div><div className="col-md-6"><label className="form-label" htmlFor="post-budget">Ngân sách/người</label><input id="post-budget" className="form-control" inputMode="numeric" value={values.budgetPerPerson} onChange={change('budgetPerPerson')} /></div><div className="col-md-4"><label className="form-label" htmlFor="post-people">Số người cần tìm</label><input id="post-people" className="form-control" inputMode="numeric" value={values.neededPeople} onChange={change('neededPeople')} /></div><div className="col-md-4"><label className="form-label" htmlFor="post-gender">Giới tính mong muốn</label><select id="post-gender" className="form-select" value={values.preferredGender} onChange={change('preferredGender')}><option value="">Không yêu cầu</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option></select></div><div className="col-md-4"><label className="form-label" htmlFor="post-date">Dự kiến chuyển vào</label><input id="post-date" className="form-control" type="date" value={values.moveInDate} onChange={change('moveInDate')} /></div></div><Button type="submit" className="mt-4" loading={saving} icon="bi-check-lg">{initialPost ? 'Lưu thay đổi' : 'Đăng bài'}</Button></form>;
}

export function StudentRoommatePostsPage() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const request = useAsyncData(useCallback((signal) => roommatePostApi.mine({ limit: 100 }, signal), []));
  const posts = collectionFrom(request.data).items;
  const [editing, setEditing] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const submit = async (payload) => {
    setSaving(true);
    try {
      if (editing?.id) await roommatePostApi.update(editing.id, payload);
      else await roommatePostApi.create(payload);
      showToast({ variant: 'success', title: 'Đã lưu bài đăng', message: editing?.id ? 'Bài đăng đã được cập nhật.' : 'Bài đăng đã được tạo.' });
      setEditing(undefined);
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể lưu bài đăng', message: 'Vui lòng kiểm tra lại thông tin và thử lại.' });
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete.id);
    try {
      await roommatePostApi.remove(confirmDelete.id);
      showToast({ variant: 'success', title: 'Đã xóa bài đăng', message: 'Bài đăng đã được xóa khỏi hệ thống.' });
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể xóa bài đăng', message: 'Vui lòng thử lại.' });
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };
  return <><PageHeader eyebrow="Ở ghép" title="Bài đăng của bạn" description="Quản lý các bài tìm người ở ghép đang hoạt động." action={<Button icon="bi-plus-lg" onClick={() => setEditing(null)}>Tạo bài đăng</Button>} /><RequestContent request={request} loadingLabel="Đang tải bài đăng…">{posts.length ? <ResourceTable items={posts} columns={[{ key: 'title', label: 'Bài đăng' }, { key: 'area', label: 'Khu vực' }, { key: 'budgetPerPerson', label: 'Ngân sách', kind: 'currency' }, { key: 'neededPeople', label: 'Cần thêm', kind: 'number' }, { key: 'status', label: 'Trạng thái', kind: 'status' }]} renderActions={(post) => <div className="d-inline-flex gap-1"><button type="button" className="btn btn-sm btn-light" aria-label="Sửa bài đăng" onClick={() => setEditing(post)}><i className="bi bi-pencil" aria-hidden="true" /></button><button type="button" className="btn btn-sm btn-light text-danger" aria-label="Xóa bài đăng" disabled={deleting === post.id} onClick={() => setConfirmDelete(post)}><i className="bi bi-trash" aria-hidden="true" /></button></div>} /> : <EmptyState icon="bi-megaphone" title="Bạn chưa có bài đăng" description="Tạo bài đăng khi bạn muốn tìm thêm người cùng thuê." action={<Button icon="bi-plus-lg" onClick={() => setEditing(null)}>Tạo bài đăng</Button>} />}</RequestContent><Modal open={editing !== undefined} title={editing?.id ? 'Sửa bài đăng ở ghép' : 'Tạo bài đăng ở ghép'} onClose={() => !saving && setEditing(undefined)}><RoommatePostForm initialPost={editing} defaultRoomId={searchParams.get('roomId') || ''} onSubmit={submit} saving={saving} /></Modal><ConfirmDialog open={Boolean(confirmDelete)} title="Xóa bài đăng?" description="Bài đăng sẽ không còn hiển thị cho sinh viên khác." confirmLabel="Xóa bài đăng" danger loading={Boolean(deleting)} onCancel={() => setConfirmDelete(null)} onConfirm={remove} /></>;
}

export function StudentRoommateRequestsPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const request = useAsyncData(useCallback(async (signal) => {
    const [received, sent] = await Promise.all([
      roommateRequestApi.received({ limit: 100 }, signal),
      roommateRequestApi.sent({ limit: 100 }, signal),
    ]);
    return {
      items: [
        ...collectionFrom(received).items.map((item) => ({ ...item, requestDirection: 'received' })),
        ...collectionFrom(sent).items.map((item) => ({ ...item, requestDirection: 'sent' })),
      ],
    };
  }, []));
  const requests = collectionFrom(request.data).items;
  const [updatingId, setUpdatingId] = useState(null);
  const [openingChatId, setOpeningChatId] = useState(null);
  const updateStatus = async (item, action) => {
    setUpdatingId(item.id);
    try {
      await roommateRequestApi.respond(item.id, action);
      showToast({ variant: 'success', title: 'Đã cập nhật lời mời', message: 'Trạng thái lời mời đã được lưu.' });
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể cập nhật', message: 'Vui lòng thử lại.' });
    } finally {
      setUpdatingId(null);
    }
  };
  const openChat = async (item) => {
    const counterpart = item.requestDirection === 'received' ? item.sender?.user || item.sender : item.recipient?.user || item.recipient;
    if (item.status !== 'ACCEPTED' || !counterpart?.id || openingChatId !== null) return;
    setOpeningChatId(item.id);
    try {
      const conversation = await conversationApi.createDirect(counterpart.id);
      if (!conversation?.id) throw new Error('Missing conversation id');
      navigate(`/student/chat?conversationId=${encodeURIComponent(String(conversation.id))}`);
    } catch {
      showToast({ variant: 'danger', title: 'Không thể mở cuộc trò chuyện', message: 'Vui lòng thử lại sau.' });
    } finally {
      setOpeningChatId(null);
    }
  };
  return <><PageHeader eyebrow="Ở ghép" title="Lời mời ở ghép" description="Theo dõi lời mời đã nhận và đã gửi." /><RequestContent request={request} loadingLabel="Đang tải lời mời…">{requests.length ? <ResourceTable items={requests} columns={[{ key: 'sender', label: 'Người gửi', render: (item) => getAccountOptionLabel(item.sender?.user || item.sender, '—') }, { key: 'recipient', label: 'Người nhận', render: (item) => getAccountOptionLabel(item.recipient?.user || item.recipient, '—') }, { key: 'createdAt', label: 'Ngày gửi', kind: 'date' }, { key: 'status', label: 'Trạng thái', kind: 'status' }]} renderActions={(item) => item.status === 'PENDING' ? <div className="d-inline-flex gap-1">{item.requestDirection === 'received' ? <><button type="button" className="btn btn-sm btn-outline-primary" disabled={updatingId === item.id} onClick={() => updateStatus(item, 'ACCEPT')}>Chấp nhận</button><button type="button" className="btn btn-sm btn-light" disabled={updatingId === item.id} onClick={() => updateStatus(item, 'REJECT')}>Từ chối</button></> : <button type="button" className="btn btn-sm btn-light" disabled={updatingId === item.id} onClick={() => updateStatus(item, 'CANCEL')}>Hủy lời mời</button>}</div> : item.status === 'ACCEPTED' ? <button type="button" className="btn btn-sm btn-outline-primary" disabled={openingChatId !== null} onClick={() => openChat(item)}><i className="bi bi-chat-dots me-1" aria-hidden="true" />{openingChatId === item.id ? 'Đang mở…' : 'Nhắn tin'}</button> : null} /> : <EmptyState icon="bi-send" title="Chưa có lời mời ở ghép" description="Khám phá hồ sơ phù hợp để bắt đầu kết nối." action={<Link to="/student/roommates" className="btn btn-primary">Tìm bạn ở ghép</Link>} />}</RequestContent></>;
}

function GroupForm({ group, onSubmit, saving }) {
  const isEditing = Boolean(group?.id);
  const [values, setValues] = useState(() => ({
    name: group?.name || '',
    maxMembers: String(group?.maxMembers ?? ''),
    budgetPerPerson: String(group?.budgetPerPerson ?? ''),
    moveInDate: group?.moveInDate ? String(group.moveInDate).slice(0, 10) : '',
    rules: group?.rules || '',
    zaloGroupUrl: group?.zaloGroupUrl || '',
    telegramGroupUrl: group?.telegramGroupUrl || '',
  }));
  const [error, setError] = useState('');
  const change = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    const name = cleanText(values.name, 191);
    const maxMembers = numericOrUndefined(values.maxMembers);
    const budgetPerPerson = numericOrUndefined(values.budgetPerPerson);
    if (name.length < 2 || !Number.isInteger(maxMembers) || maxMembers < 2 || maxMembers > 20 || budgetPerPerson === undefined || budgetPerPerson <= 0) {
      setError('Nhập tên nhóm, số thành viên từ 2 đến 20 và ngân sách hợp lệ.');
      return;
    }
    setError('');
    onSubmit({
      name,
      maxMembers,
      budgetPerPerson,
      moveInDate: values.moveInDate || null,
      rules: cleanText(values.rules, 10_000) || null,
      zaloGroupUrl: cleanText(values.zaloGroupUrl, 500) || null,
      telegramGroupUrl: cleanText(values.telegramGroupUrl, 500) || null,
    });
  };
  return <form onSubmit={submit} noValidate>{error ? <div className="alert alert-danger" role="alert">{error}</div> : null}<label className="form-label" htmlFor="group-name">Tên nhóm</label><input id="group-name" className="form-control mb-3" maxLength="191" value={values.name} onChange={change('name')} /><div className="row g-3"><div className="col-md-6"><label className="form-label" htmlFor="group-members">Số thành viên tối đa</label><input id="group-members" className="form-control" inputMode="numeric" value={values.maxMembers} onChange={change('maxMembers')} /></div><div className="col-md-6"><label className="form-label" htmlFor="group-budget">Ngân sách/người</label><input id="group-budget" className="form-control" inputMode="numeric" value={values.budgetPerPerson} onChange={change('budgetPerPerson')} /></div><div className="col-12"><label className="form-label" htmlFor="group-move-date">Dự kiến chuyển vào</label><input id="group-move-date" className="form-control" type="date" value={values.moveInDate} onChange={change('moveInDate')} /></div></div><label className="form-label mt-3" htmlFor="group-rules">Nội quy (không bắt buộc)</label><textarea id="group-rules" className="form-control mb-3" rows="3" maxLength="10000" value={values.rules} onChange={change('rules')} /><label className="form-label" htmlFor="group-zalo">Link nhóm Zalo (không bắt buộc)</label><input id="group-zalo" className="form-control mb-3" type="url" maxLength="500" value={values.zaloGroupUrl} onChange={change('zaloGroupUrl')} /><label className="form-label" htmlFor="group-telegram">Link nhóm Telegram (không bắt buộc)</label><input id="group-telegram" className="form-control mb-4" type="url" maxLength="500" value={values.telegramGroupUrl} onChange={change('telegramGroupUrl')} /><Button type="submit" loading={saving} icon="bi-people-fill">{isEditing ? 'Lưu nhóm' : 'Tạo nhóm'}</Button></form>;
}

export function StudentGroupsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const request = useAsyncData(useCallback((signal) => groupApi.mine({ limit: 50 }, signal), []));
  const groups = collectionFrom(request.data).items;
  const [editing, setEditing] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [memberInputs, setMemberInputs] = useState({});
  const [actionKey, setActionKey] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const actionId = (...parts) => parts.join(':');

  const saveGroup = async (payload) => {
    setSaving(true);
    try {
      if (editing?.id) await groupApi.update(editing.id, payload);
      else await groupApi.create(payload);
      showToast({ variant: 'success', title: editing?.id ? 'Đã cập nhật nhóm' : 'Đã tạo nhóm', message: editing?.id ? 'Thông tin nhóm thuê đã được lưu.' : 'Nhóm thuê của bạn đã được tạo.' });
      setEditing(undefined);
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể lưu nhóm', message: 'Vui lòng kiểm tra lại thông tin và thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (group) => {
    const studentId = numericOrUndefined(memberInputs[group.id]);
    if (!Number.isInteger(studentId) || studentId < 1) {
      showToast({ variant: 'danger', title: 'ID sinh viên không hợp lệ', message: 'Nhập ID số của tài khoản sinh viên cần thêm.' });
      return;
    }
    const key = actionId('add', group.id);
    setActionKey(key);
    try {
      await groupApi.addMember(group.id, studentId);
      setMemberInputs((current) => ({ ...current, [group.id]: '' }));
      showToast({ variant: 'success', title: 'Đã thêm thành viên', message: 'Thành viên có thể tham gia trò chuyện của nhóm.' });
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể thêm thành viên', message: 'Kiểm tra ID, trạng thái nhóm và số chỗ còn lại.' });
    } finally {
      setActionKey('');
    }
  };

  const executeConfirmation = async () => {
    if (!confirmation) return;
    const { type, group, member } = confirmation;
    const key = actionId(type, group.id, member?.studentId || user?.id);
    setActionKey(key);
    try {
      if (type === 'remove') await groupApi.removeMember(group.id, member.studentId);
      else if (type === 'transfer') await groupApi.transferLeadership(group.id, member.studentId);
      else await groupApi.leave(group.id);
      const messages = {
        remove: 'Thành viên đã được xóa khỏi nhóm.',
        transfer: 'Quyền trưởng nhóm đã được chuyển.',
        leave: 'Bạn đã rời khỏi nhóm thuê.',
      };
      showToast({ variant: 'success', title: 'Đã cập nhật nhóm', message: messages[type] });
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể cập nhật nhóm', message: 'Trạng thái nhóm hoặc quyền thực hiện đã thay đổi. Hãy tải lại và thử lại.' });
    } finally {
      setActionKey('');
      setConfirmation(null);
    }
  };

  return <><PageHeader eyebrow="Nhóm thuê" title="Nhóm thuê phòng của bạn" description="Trưởng nhóm thêm, xóa hoặc chuyển quyền; thành viên có thể chủ động rời nhóm." action={<Button icon="bi-plus-lg" onClick={() => setEditing(null)}>Tạo nhóm</Button>} /><RequestContent request={request} loadingLabel="Đang tải nhóm thuê…">{groups.length ? <div className="row g-3">{groups.map((group) => {
    const members = asArray(group.members);
    const membership = members.find((member) => String(member.studentId) === String(user?.id));
    const isLeader = membership?.role === 'LEADER';
    const groupFull = group.status !== 'OPEN' || members.length >= Number(group.maxMembers);
    const chatPath = group.conversation?.id ? '/student/chat?conversationId=' + encodeURIComponent(String(group.conversation.id)) : '/student/chat';
    return <div className="col-md-6 col-xl-4" key={group.id}><article className="roommate-profile-card h-100"><div className="d-flex justify-content-between gap-2"><h2 className="h6 mb-0">{group.name || 'Nhóm thuê'}</h2>{group.status ? <StatusBadge status={group.status} /> : null}</div><p className="small text-muted-app mt-2 mb-3">{group.room?.name || 'Chưa chọn phòng dự định thuê'}</p><div className="d-flex flex-wrap gap-3 small text-muted-app"><span><i className="bi bi-people me-1" aria-hidden="true" />{formatNumber(members.length)}/{formatNumber(group.maxMembers)} thành viên</span><span><i className="bi bi-wallet2 me-1" aria-hidden="true" />{formatCurrency(group.budgetPerPerson)}</span></div>{group.rules ? <p className="small mt-3 mb-0">{group.rules}</p> : null}<div className="border-top border-app mt-3 pt-3"><h3 className="h6 small text-uppercase text-muted-app">Thành viên</h3><div className="d-grid gap-2">{members.map((member) => <div className="d-flex align-items-center justify-content-between gap-2 small" key={member.id}><span className="text-truncate">{getAccountOptionLabel(member.student?.user || member.student, 'Sinh viên #' + member.studentId)}{member.role === 'LEADER' ? <span className="ms-1 badge text-bg-primary">Trưởng nhóm</span> : null}</span>{isLeader && member.role !== 'LEADER' ? <span className="d-inline-flex gap-1"><button type="button" className="btn btn-sm btn-light" disabled={Boolean(actionKey)} onClick={() => setConfirmation({ type: 'transfer', group, member })}>Trao quyền</button><button type="button" className="btn btn-sm btn-light text-danger" disabled={Boolean(actionKey)} aria-label={'Xóa ' + (getAccountOptionLabel(member.student?.user || member.student, member.studentId))} onClick={() => setConfirmation({ type: 'remove', group, member })}><i className="bi bi-person-dash" aria-hidden="true" /></button></span> : null}</div>)}</div></div>{isLeader ? <><form className="row g-2 mt-3" onSubmit={(event) => { event.preventDefault(); addMember(group); }}><div className="col"><label className="visually-hidden" htmlFor={'group-member-' + group.id}>ID sinh viên</label><input id={'group-member-' + group.id} className="form-control form-control-sm" inputMode="numeric" placeholder="ID sinh viên" value={memberInputs[group.id] || ''} onChange={(event) => setMemberInputs((current) => ({ ...current, [group.id]: event.target.value }))} disabled={groupFull || Boolean(actionKey)} /></div><div className="col-auto"><button type="submit" className="btn btn-sm btn-outline-primary" disabled={groupFull || Boolean(actionKey)}><i className="bi bi-person-plus me-1" aria-hidden="true" />Thêm</button></div></form>{groupFull ? <p className="form-text mb-0">Nhóm hiện không nhận thêm thành viên.</p> : null}<button type="button" className="btn btn-light btn-sm mt-3" disabled={Boolean(actionKey)} onClick={() => setEditing(group)}><i className="bi bi-pencil me-1" aria-hidden="true" />Chỉnh sửa nhóm</button></> : <button type="button" className="btn btn-outline-danger btn-sm mt-3" disabled={Boolean(actionKey)} onClick={() => setConfirmation({ type: 'leave', group })}><i className="bi bi-box-arrow-right me-1" aria-hidden="true" />Rời nhóm</button>}<Link to={chatPath} className="btn btn-light btn-sm mt-3 ms-2"><i className="bi bi-chat-dots me-1" aria-hidden="true" />Mở chat nhóm</Link>{isLeader ? <p className="form-text mb-0 mt-2">Muốn rời nhóm, hãy trao quyền trưởng nhóm cho một thành viên khác trước.</p> : null}</article></div>;
  })}</div> : <EmptyState icon="bi-people-fill" title="Bạn chưa tham gia nhóm thuê" description="Tạo nhóm sau khi đã kết nối với bạn ở ghép." action={<Button icon="bi-plus-lg" onClick={() => setEditing(null)}>Tạo nhóm</Button>} />}</RequestContent><Modal open={editing !== undefined} title={editing?.id ? 'Chỉnh sửa nhóm thuê' : 'Tạo nhóm thuê'} onClose={() => !saving && setEditing(undefined)}><GroupForm group={editing} onSubmit={saveGroup} saving={saving} /></Modal><ConfirmDialog open={Boolean(confirmation)} title={confirmation?.type === 'transfer' ? 'Trao quyền trưởng nhóm?' : confirmation?.type === 'remove' ? 'Xóa thành viên khỏi nhóm?' : 'Rời nhóm thuê?'} description={confirmation?.type === 'transfer' ? 'Bạn sẽ trở thành thành viên thường và không còn quyền quản lý nhóm.' : confirmation?.type === 'remove' ? 'Thành viên này sẽ không còn trong nhóm và cuộc trò chuyện nhóm.' : 'Bạn sẽ không còn là thành viên của nhóm này.'} confirmLabel={confirmation?.type === 'transfer' ? 'Trao quyền' : confirmation?.type === 'remove' ? 'Xóa thành viên' : 'Rời nhóm'} danger={confirmation?.type !== 'transfer'} loading={Boolean(actionKey)} onCancel={() => setConfirmation(null)} onConfirm={executeConfirmation} /></>;
}

export function StudentChatPage() {
  const [searchParams] = useSearchParams();
  return <section className="chat-page"><h1 className="visually-hidden">Tin nhắn</h1><ChatWorkspace initialRecipientId={searchParams.get('userId') || undefined} initialConversationId={searchParams.get('conversationId') || undefined} /></section>;
}

export function StudentAppointmentsPage() {
  const { showToast } = useToast();
  const request = useAsyncData(useCallback((signal) => appointmentApi.list({ limit: 100 }, signal), []));
  const appointments = collectionFrom(request.data).items;
  const [updating, setUpdating] = useState(null);
  const cancel = async (appointment) => {
    setUpdating(appointment.id);
    try {
      await appointmentApi.cancel(appointment.id);
      showToast({ variant: 'success', title: 'Đã hủy lịch xem', message: 'Lịch xem phòng đã được cập nhật.' });
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể hủy lịch', message: 'Vui lòng thử lại.' });
    } finally {
      setUpdating(null);
    }
  };
  return <><PageHeader eyebrow="Lịch xem phòng" title="Lịch hẹn của bạn" description="Theo dõi phản hồi từ chủ trọ và quản lý các lịch xem." action={<Link to="/rooms" className="btn btn-outline-primary"><i className="bi bi-search me-1" aria-hidden="true" />Tìm phòng</Link>} /><RequestContent request={request} loadingLabel="Đang tải lịch xem…">{appointments.length ? <ResourceTable items={appointments} columns={[{ key: 'room.name', label: 'Phòng' }, { key: 'scheduledAt', label: 'Thời gian', kind: 'date' }, { key: 'note', label: 'Ghi chú' }, { key: 'status', label: 'Trạng thái', kind: 'status' }]} renderActions={(appointment) => ['PENDING', 'ACCEPTED', 'RESCHEDULED'].includes(appointment.status) ? <button type="button" className="btn btn-sm btn-light" disabled={updating === appointment.id} onClick={() => cancel(appointment)}>Hủy lịch</button> : null} /> : <EmptyState icon="bi-calendar-check" title="Chưa có lịch xem phòng" description="Bạn có thể đặt lịch tại trang chi tiết phòng." action={<Link to="/rooms" className="btn btn-primary">Tìm phòng</Link>} />}</RequestContent></>;
}

export function StudentContractsPage() {
  const request = useAsyncData(useCallback((signal) => contractApi.list({ limit: 100 }, signal), []));
  const contracts = collectionFrom(request.data).items;
  return <><PageHeader eyebrow="Hợp đồng" title="Hợp đồng thuê của bạn" description="Xem các hợp đồng được tạo bởi chủ trọ và tình trạng hiệu lực." /><RequestContent request={request} loadingLabel="Đang tải hợp đồng…">{contracts.length ? <ResourceTable items={contracts} columns={[{ key: 'room.name', label: 'Phòng' }, { key: 'startDate', label: 'Bắt đầu', kind: 'date' }, { key: 'endDate', label: 'Kết thúc', kind: 'date' }, { key: 'rent', label: 'Tiền thuê', kind: 'currency' }, { key: 'status', label: 'Trạng thái', kind: 'status' }]} /> : <EmptyState icon="bi-file-earmark-text" title="Chưa có hợp đồng" description="Hợp đồng của bạn sẽ xuất hiện sau khi chủ trọ tạo và kích hoạt." />}</RequestContent></>;
}

export function StudentInvoicesPage() {
  const request = useAsyncData(useCallback((signal) => invoiceApi.list({ limit: 100 }, signal), []));
  const invoices = collectionFrom(request.data).items;
  return <><PageHeader eyebrow="Hóa đơn" title="Theo dõi hóa đơn thuê trọ" description="Xem các khoản phí được lập từ chỉ số và dịch vụ thực tế." /><RequestContent request={request} loadingLabel="Đang tải hóa đơn…">{invoices.length ? <ResourceTable items={invoices} columns={[{ key: 'contract.room.name', label: 'Phòng' }, { key: 'periodEnd', label: 'Kỳ hóa đơn', kind: 'date' }, { key: 'dueDate', label: 'Hạn thanh toán', kind: 'date' }, { key: 'totalAmount', label: 'Tổng tiền', kind: 'currency' }, { key: 'status', label: 'Trạng thái', kind: 'status' }]} /> : <EmptyState icon="bi-receipt" title="Chưa có hóa đơn" description="Hóa đơn được chủ trọ lập sẽ xuất hiện tại đây." />}</RequestContent></>;
}

export function StudentNotificationsPage() {
  const { showToast } = useToast();
  const request = useAsyncData(useCallback((signal) => notificationApi.list({ limit: 100 }, signal), []));
  const notifications = collectionFrom(request.data).items;
  const [updating, setUpdating] = useState(null);
  const markRead = async (notification) => {
    if (notification.isRead || notification.readAt) return;
    setUpdating(notification.id);
    try {
      await notificationApi.markRead(notification.id);
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể cập nhật thông báo', message: 'Vui lòng thử lại.' });
    } finally {
      setUpdating(null);
    }
  };
  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      showToast({ variant: 'success', title: 'Đã đánh dấu đã đọc', message: 'Tất cả thông báo đã được cập nhật.' });
      request.reload();
    } catch {
      showToast({ variant: 'danger', title: 'Không thể cập nhật', message: 'Vui lòng thử lại.' });
    }
  };
  return <><PageHeader eyebrow="Thông báo" title="Cập nhật dành cho bạn" description="Các thay đổi về phòng, lịch hẹn, hóa đơn và kết nối ở ghép." action={notifications.length ? <Button variant="outline" icon="bi-check2-all" onClick={markAll}>Đánh dấu tất cả đã đọc</Button> : null} /><RequestContent request={request} loadingLabel="Đang tải thông báo…">{notifications.length ? <div className="notification-list">{notifications.map((notification) => <article className={notification.isRead || notification.readAt ? 'notification-item' : 'notification-item is-unread'} key={notification.id}><div className="d-flex align-items-start gap-3"><span className="notification-icon"><i className="bi bi-bell" aria-hidden="true" /></span><div className="flex-grow-1"><h2 className="h6 mb-1">{notification.title || 'Thông báo'}</h2><p className="small text-muted-app mb-1">{notification.content || notification.message || recordDescription(notification)}</p><time className="small text-muted-app">{formatDate(notification.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</time></div>{!(notification.isRead || notification.readAt) ? <button type="button" className="btn btn-sm btn-light" disabled={updating === notification.id} onClick={() => markRead(notification)}>Đã đọc</button> : null}</div></article>)}</div> : <EmptyState icon="bi-bell" title="Chưa có thông báo" description="Thông báo quan trọng sẽ hiển thị tại đây." />}</RequestContent></>;
}
