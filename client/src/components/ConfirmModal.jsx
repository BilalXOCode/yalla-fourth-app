// Small in-page confirmation dialog. Reuses the Find Matches details-modal
// shell (.modal / .modal__panel) so the look is identical to the rest of the
// site. Used in place of the native browser confirm() for destructive actions
// like deleting a match. Cancel closes and does nothing; confirm runs onConfirm.
import { useEffect } from 'react';
import './MatchModal.css';
import './ConfirmModal.css';

export default function ConfirmModal({ message, confirmLabel, cancelLabel, onConfirm, onCancel, busy = false }) {
  // Close on Escape, and lock background scroll while open.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  return (
    <div className="modal" role="dialog" aria-modal="true" onMouseDown={onCancel}>
      <div className="modal__panel confirm__panel" onMouseDown={(e) => e.stopPropagation()}>
        <p className="confirm__msg">{message}</p>
        <div className="confirm__actions">
          <button type="button" className="btn btn-ghost confirm__cancel" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className="btn confirm__delete" onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
