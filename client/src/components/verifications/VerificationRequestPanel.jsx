import { useCallback, useEffect, useState } from 'react';
import { verificationApi } from '../../api/resources';
import { useToast } from '../../context/ToastContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { collectionFrom } from '../../utils/data';
import { formatDate } from '../../utils/formatters';
import { cleanText } from '../../utils/records';
import { Button } from '../common/Button';
import { StatusBadge, VerifiedBadge } from '../common/StatusBadge';

const EMPTY_VALUES = Object.freeze({ studentCode: '', schoolEmail: '', documentUrl: '', note: '' });

function isWebUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function verificationCopy(status) {
  if (status === 'VERIFIED') return 'Tài khoản của bạn đã được xác minh. Dấu xác minh sẽ hiển thị tại những nơi phù hợp trong hệ thống.';
  if (status === 'PENDING') return 'Yêu cầu của bạn đang chờ quản trị viên kiểm tra. Bạn chưa thể gửi thêm yêu cầu khác trong thời gian này.';
  if (status === 'REJECTED') return 'Yêu cầu gần nhất chưa được duyệt. Hãy xem ghi chú, bổ sung thông tin rồi gửi lại.';
  return 'Gửi thông tin để quản trị viên xác minh thủ công tài khoản của bạn.';
}

function submittedSources(item) {
  if (!item) return [];
  return [
    item.studentCode ? 'Mã sinh viên' : null,
    item.schoolEmail ? 'Email trường' : null,
    item.documentUrl ? 'Liên kết tài liệu' : null,
    item.note ? 'Ghi chú' : null,
  ].filter(Boolean);
}

function VerificationSteps({ status }) {
  const activeStep = status === 'VERIFIED' || status === 'REJECTED' ? 3 : status === 'PENDING' ? 2 : 1;
  return (
    <ol className="verification-steps" aria-label="Tiến trình xác minh">
      {[
        ['Gửi thông tin', 1],
        ['Quản trị viên kiểm tra', 2],
        [status === 'REJECTED' ? 'Cần bổ sung' : 'Nhận kết quả', 3],
      ].map(([label, step]) => (
        <li className={step <= activeStep ? 'is-active' : ''} key={step} aria-current={step === activeStep ? 'step' : undefined}>
          <span>{step}</span><small>{label}</small>
        </li>
      ))}
    </ol>
  );
}

function RequestSummary({ item }) {
  if (!item) return null;
  const sources = submittedSources(item);
  return (
    <div className="verification-request__summary">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <StatusBadge status={item.status} />
        <span className="small text-muted-app">Gửi {formatDate(item.createdAt)}</span>
      </div>
      {sources.length ? <p className="small text-muted-app mb-0 mt-2">Đã cung cấp: {sources.join(' · ')}.</p> : null}
      {item.reviewerNote ? <div className="verification-request__note"><strong>Ghi chú từ quản trị viên</strong><p className="mb-0">{item.reviewerNote}</p></div> : null}
    </div>
  );
}

function RequestHistory({ items }) {
  if (items.length < 2) return null;
  return (
    <details className="verification-request__history">
      <summary>Lịch sử yêu cầu ({items.length})</summary>
      <ul>
        {items.map((item) => <li key={item.id}><StatusBadge status={item.status} /><span>Gửi {formatDate(item.createdAt)}</span></li>)}
      </ul>
    </details>
  );
}

export function VerificationRequestPanel({ role, profile, onSubmitted }) {
  const { showToast } = useToast();
  const request = useAsyncData(useCallback((signal) => verificationApi.mine({ limit: 5 }, signal), []));
  const items = collectionFrom(request.data).items;
  const pendingRequest = items.find((item) => item.status === 'PENDING');
  const latestRequest = pendingRequest || items[0];
  const status = pendingRequest?.status || profile?.verificationStatus || latestRequest?.status || 'UNVERIFIED';
  const [values, setValues] = useState(() => ({ ...EMPTY_VALUES }));
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const studentProfile = profile?.studentProfile || {};

  useEffect(() => {
    if (role !== 'STUDENT') return;
    setValues((current) => ({
      ...current,
      studentCode: current.studentCode || cleanText(studentProfile.studentCode, 50),
      schoolEmail: current.schoolEmail || cleanText(studentProfile.schoolEmail, 191),
    }));
  }, [role, studentProfile.studentCode, studentProfile.schoolEmail]);

  const updateValue = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const studentCode = cleanText(values.studentCode, 50);
    const schoolEmail = cleanText(values.schoolEmail, 191).toLowerCase();
    const documentUrl = cleanText(values.documentUrl, 500);
    const note = cleanText(values.note, 5_000);

    if (role === 'STUDENT' && !studentCode && !schoolEmail && !documentUrl) {
      setFormError('Hãy cung cấp mã sinh viên, email trường hoặc liên kết tài liệu.');
      return;
    }
    if (role === 'LANDLORD' && !documentUrl && !note) {
      setFormError('Hãy cung cấp liên kết tài liệu hoặc ghi chú cho quản trị viên.');
      return;
    }
    if (schoolEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolEmail)) {
      setFormError('Email trường không hợp lệ.');
      return;
    }
    if (!isWebUrl(documentUrl)) {
      setFormError('Liên kết tài liệu phải bắt đầu bằng http:// hoặc https://.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      await verificationApi.create({
        type: role,
        ...(studentCode ? { studentCode } : {}),
        ...(schoolEmail ? { schoolEmail } : {}),
        ...(documentUrl ? { documentUrl } : {}),
        ...(note ? { note } : {}),
      });
      setValues((current) => ({ ...current, documentUrl: '', note: '' }));
      showToast({ variant: 'success', title: 'Đã gửi yêu cầu xác minh', message: 'Quản trị viên sẽ kiểm tra thông tin và thông báo kết quả cho bạn.' });
      await Promise.all([request.reload(), onSubmitted?.()]);
    } catch {
      setFormError('Không thể gửi yêu cầu. Hãy kiểm tra thông tin hoặc thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="data-panel verification-request">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div><p className="section-kicker mb-1">Độ tin cậy tài khoản</p><h2 className="h5 mb-1">Xác minh danh tính</h2><p className="text-muted-app mb-0">{verificationCopy(status)}</p></div>
        {status === 'VERIFIED' ? <VerifiedBadge status="VERIFIED" /> : <StatusBadge status={status} />}
      </div>
      <VerificationSteps status={status} />

      {request.loading ? <p className="small text-muted-app mb-0">Đang tải lịch sử xác minh…</p> : null}
      {request.error ? <div className="alert alert-warning mb-0" role="alert">Không thể tải lịch sử xác minh. <button type="button" className="alert-link border-0 bg-transparent p-0" onClick={request.reload}>Thử lại</button></div> : null}
      {!request.loading && !request.error && latestRequest ? <RequestSummary item={latestRequest} /> : null}
      {!request.loading && !request.error ? <RequestHistory items={items} /> : null}

      {!request.loading && !request.error && status !== 'VERIFIED' && !pendingRequest ? (
        <form className="verification-request__form mt-4" onSubmit={submit} noValidate>
          <h3 className="h6 mb-1">{status === 'REJECTED' ? 'Bổ sung và gửi lại thông tin' : 'Gửi yêu cầu xác minh'}</h3>
          <p className="small text-muted-app mb-3">{role === 'STUDENT' ? 'Dùng mã sinh viên, email trường hoặc liên kết tài liệu. Chỉ cần một thông tin.' : 'Gửi liên kết tài liệu hoặc ghi chú để quản trị viên đối chiếu.'}</p>
          {formError ? <div className="alert alert-danger small" role="alert">{formError}</div> : null}
          <div className="row g-3">
            {role === 'STUDENT' ? <>
              <div className="col-md-6"><label className="form-label" htmlFor="verification-student-code">Mã sinh viên</label><input id="verification-student-code" className="form-control" maxLength="50" value={values.studentCode} onChange={updateValue('studentCode')} /></div>
              <div className="col-md-6"><label className="form-label" htmlFor="verification-school-email">Email trường</label><input id="verification-school-email" className="form-control" type="email" inputMode="email" maxLength="191" value={values.schoolEmail} onChange={updateValue('schoolEmail')} /></div>
            </> : null}
            <div className={role === 'STUDENT' ? 'col-md-6' : 'col-12'}><label className="form-label" htmlFor="verification-document-url">Liên kết tài liệu <span className="text-muted-app fw-normal">(không bắt buộc)</span></label><input id="verification-document-url" className="form-control" type="url" inputMode="url" autoComplete="url" placeholder="https://…" maxLength="500" value={values.documentUrl} onChange={updateValue('documentUrl')} aria-describedby="verification-document-help" /><div id="verification-document-help" className="form-text">Hiện chưa hỗ trợ tải tệp trực tiếp. Chỉ dùng liên kết http(s) mà quản trị viên có thể mở.</div></div>
            <div className={role === 'STUDENT' ? 'col-md-6' : 'col-12'}><label className="form-label" htmlFor="verification-note">Ghi chú cho quản trị viên <span className="text-muted-app fw-normal">(không bắt buộc)</span></label><textarea id="verification-note" className="form-control" rows="3" maxLength="5000" value={values.note} onChange={updateValue('note')} /></div>
          </div>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4"><p className="small text-muted-app mb-0"><i className="bi bi-shield-check me-1" aria-hidden="true" />Thông tin chỉ dùng cho việc xác minh thủ công.</p><Button type="submit" loading={saving} icon="bi-send-check">Gửi yêu cầu</Button></div>
        </form>
      ) : null}
    </section>
  );
}
