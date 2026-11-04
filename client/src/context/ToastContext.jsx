import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);
let nextToastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ message, variant = 'primary', title = 'Thông báo', duration = 5000 }) => {
    const id = ++nextToastId;
    setToasts((current) => [...current, { id, message, variant, title }]);
    if (duration > 0) window.setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({ showToast, dismiss }), [showToast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container position-fixed top-0 end-0 p-3" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div className="toast show mb-2" role="status" key={toast.id}>
            <div className="toast-header">
              <i className={`bi bi-info-circle-fill text-${toast.variant} me-2`} aria-hidden="true" />
              <strong className="me-auto">{toast.title}</strong>
              <button type="button" className="btn-close" aria-label="Đóng thông báo" onClick={() => dismiss(toast.id)} />
            </div>
            <div className="toast-body">{toast.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast phải được dùng bên trong ToastProvider.');
  return context;
}
