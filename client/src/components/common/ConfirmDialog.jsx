import { useEffect } from 'react';
import { Button } from './Button';

export function ConfirmDialog({ open, title = 'Xác nhận thao tác', description, confirmLabel = 'Xác nhận', onConfirm, onCancel, loading = false, danger = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && onCancel?.();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="confirmation-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onCancel?.()}>
      <section className="confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title" className="h5">{title}</h2>
        <p className="text-muted-app mb-4">{description}</p>
        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Hủy</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </section>
    </div>
  );
}
