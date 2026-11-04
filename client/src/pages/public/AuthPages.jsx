import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { SelectInput, TextInput } from '../../components/common/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cleanText, safeNextPath } from '../../utils/records';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/i;

function normalizeUsername(value) {
  return cleanText(value, 30).toLowerCase();
}

function normalizeEmail(value) {
  return cleanText(value, 160).toLowerCase();
}

function usernameValidationMessage(username) {
  if (!USERNAME_PATTERN.test(username)) {
    return 'Tên đăng nhập gồm 3–30 ký tự, bắt đầu bằng chữ hoặc số; chỉ dùng chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.';
  }
  return null;
}

function portalPath(role) {
  if (role === 'LANDLORD') return '/landlord';
  if (role === 'ADMIN') return '/admin';
  return '/student';
}

function AuthShell({ title, description, children, footer }) {
  return (
    <section className="auth-page">
      <div className="container">
        <div className="auth-shell">
          <aside className="auth-intro">
            <div className="section-kicker mb-3">Trọ Sinh Viên</div>
            <h1>Tìm nơi ở phù hợp, quản lý cuộc sống dễ dàng hơn.</h1>
            <p className="mb-0">Thông tin phòng, lịch xem và trao đổi được tập trung trong một không gian rõ ràng, riêng tư.</p>
          </aside>
          <main className="auth-form-panel">
            <div className="mb-4"><h2 className="page-title mb-2">{title}</h2><p className="text-muted-app mb-0">{description}</p></div>
            {children}
            {footer ? <div className="auth-footer mt-4 pt-3">{footer}</div> : null}
          </main>
        </div>
      </div>
    </section>
  );
}

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to={portalPath(user?.role)} replace />;

  const submit = async (event) => {
    event.preventDefault();
    const rawIdentifier = cleanText(values.identifier, 160);
    const identifier = rawIdentifier.includes('@') ? normalizeEmail(rawIdentifier) : normalizeUsername(rawIdentifier);
    const nextErrors = {};
    if (!identifier) {
      nextErrors.identifier = 'Nhập email hoặc tên đăng nhập để tiếp tục.';
    } else if (rawIdentifier.includes('@') && !EMAIL_PATTERN.test(identifier)) {
      nextErrors.identifier = 'Email chưa hợp lệ. Hoặc nhập tên đăng nhập không có ký tự @.';
    } else if (!rawIdentifier.includes('@')) {
      const usernameError = usernameValidationMessage(identifier);
      if (usernameError) nextErrors.identifier = usernameError;
    }
    if (!values.password) nextErrors.password = 'Nhập mật khẩu để tiếp tục.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const signedInUser = await login({ identifier, password: values.password });
      showToast({ variant: 'success', title: 'Đăng nhập thành công', message: `Chào mừng bạn quay lại, ${signedInUser.fullName || 'bạn'}!` });
      navigate(safeNextPath(new URLSearchParams(location.search).get('next'), portalPath(signedInUser.role)), { replace: true });
    } catch (error) {
      setErrors({ form: error.message || 'Không thể đăng nhập. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Đăng nhập" description="Dùng tài khoản của bạn để tiếp tục." footer={<>Chưa có tài khoản? <Link to="/register">Tạo tài khoản mới</Link></>}>
      <form noValidate onSubmit={submit}>
        {errors.form ? <div className="alert alert-danger" role="alert">{errors.form}</div> : null}
        <TextInput id="login-identifier" label="Email hoặc tên đăng nhập" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength="160" value={values.identifier} error={errors.identifier} onChange={(event) => setValues((current) => ({ ...current, identifier: event.target.value }))} placeholder="ban@gmail.com hoặc ban.nguyen" helpText="Bạn có thể đăng nhập bằng email hoặc tên đăng nhập." className="mb-3" />
        <TextInput id="login-password" label="Mật khẩu" type="password" autoComplete="current-password" value={values.password} error={errors.password} onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))} className="mb-4" />
        <Button type="submit" loading={submitting} className="w-100" icon="bi-box-arrow-in-right">Đăng nhập</Button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState({ fullName: '', username: '', email: '', phone: '', role: 'STUDENT', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  if (isAuthenticated) return <Navigate to={portalPath(user?.role)} replace />;

  const updateValue = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const fullName = cleanText(values.fullName, 100);
    const username = normalizeUsername(values.username);
    const email = normalizeEmail(values.email);
    const phone = cleanText(values.phone, 25);
    const nextErrors = {};
    if (fullName.length < 2) nextErrors.fullName = 'Họ tên cần có ít nhất 2 ký tự.';
    if (!username && !email) {
      nextErrors.contact = 'Nhập ít nhất email hoặc tên đăng nhập để tạo tài khoản.';
    }
    if (username) {
      const usernameError = usernameValidationMessage(username);
      if (usernameError) nextErrors.username = usernameError;
    }
    if (email && !EMAIL_PATTERN.test(email)) nextErrors.email = 'Nhập địa chỉ email hợp lệ.';
    if (phone && !/^[0-9+\-\s()]{8,25}$/.test(phone)) nextErrors.phone = 'Số điện thoại chưa hợp lệ.';
    if (values.password.length < 8) nextErrors.password = 'Mật khẩu cần có ít nhất 8 ký tự.';
    if (values.password !== values.confirmPassword) nextErrors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      await register({ fullName, username: username || undefined, email: email || undefined, phone: phone || undefined, role: values.role, password: values.password });
      showToast({ variant: 'success', title: 'Đã tạo tài khoản', message: 'Tài khoản đã sẵn sàng. Hãy đăng nhập để bắt đầu.' });
      navigate('/login', { replace: true });
    } catch (error) {
      setErrors({ form: error.message || 'Không thể tạo tài khoản. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Tạo tài khoản" description="Đăng ký với vai trò sinh viên hoặc chủ trọ." footer={<>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></>}>
      <form noValidate onSubmit={submit}>
        {errors.form ? <div className="alert alert-danger" role="alert">{errors.form}</div> : null}
        <TextInput id="register-name" label="Họ và tên" autoComplete="name" value={values.fullName} error={errors.fullName} onChange={updateValue('fullName')} className="mb-3" />
        <TextInput id="register-username" label="Tên đăng nhập (không bắt buộc)" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength="30" value={values.username} error={errors.username} onChange={updateValue('username')} helpText="Dùng để đăng nhập không cần email. 3–30 ký tự, bắt đầu bằng chữ hoặc số; dùng chữ, số, dấu chấm, gạch dưới hoặc gạch ngang." className="mb-3" />
        <TextInput id="register-email" label="Email (không bắt buộc)" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength="160" value={values.email} error={errors.email} onChange={updateValue('email')} helpText="Bạn có thể dùng email để đăng nhập. Cần nhập ít nhất email hoặc tên đăng nhập." className="mb-1" />
        {errors.contact ? <div className="invalid-feedback d-block mb-3" role="alert">{errors.contact}</div> : <div className="mb-3" />}
        <TextInput id="register-phone" label="Số điện thoại (không bắt buộc)" type="tel" autoComplete="tel" value={values.phone} error={errors.phone} onChange={updateValue('phone')} className="mb-3" />
        <SelectInput id="register-role" label="Bạn là" value={values.role} onChange={updateValue('role')} className="mb-3"><option value="STUDENT">Sinh viên</option><option value="LANDLORD">Chủ trọ</option></SelectInput>
        <TextInput id="register-password" label="Mật khẩu" type="password" autoComplete="new-password" value={values.password} error={errors.password} onChange={updateValue('password')} helpText="Tối thiểu 8 ký tự." className="mb-3" />
        <TextInput id="register-confirm-password" label="Xác nhận mật khẩu" type="password" autoComplete="new-password" value={values.confirmPassword} error={errors.confirmPassword} onChange={updateValue('confirmPassword')} className="mb-4" />
        <Button type="submit" loading={submitting} className="w-100" icon="bi-person-plus">Tạo tài khoản</Button>
      </form>
    </AuthShell>
  );
}
