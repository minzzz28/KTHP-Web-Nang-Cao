import { useEffect, useId } from 'react';

export function Modal({ open, title, children, onClose, className = '', footer = null }) {
  const headingId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="confirmation-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose?.()}>
      <section className={`confirmation-dialog modal-panel ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <div className="modal-panel__header d-flex align-items-start justify-content-between gap-3 mb-3">
          <h2 id={headingId} className="h5 mb-0">{title}</h2>
          <button type="button" className="btn-close" aria-label="Đóng hộp thoại" onClick={onClose} />
        </div>
        <div className="modal-panel__body">{children}</div>
        {footer ? <div className="modal-panel__footer">{footer}</div> : null}
      </section>
    </div>
  );
}
