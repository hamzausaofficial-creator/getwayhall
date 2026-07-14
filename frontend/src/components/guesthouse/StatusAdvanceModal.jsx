import { createPortal } from 'react-dom';
import { AlertTriangle, X, CheckCircle, LogIn, LogOut } from 'lucide-react';

const ACTION_META = {
  CONFIRMED: {
    title: 'Confirm booking?',
    actionLabel: 'Yes, confirm',
    Icon: CheckCircle,
    body: 'This will mark the stay as Confirmed.',
  },
  CHECKED_IN: {
    title: 'Check in guest?',
    actionLabel: 'Yes, check in',
    Icon: LogIn,
    body: 'This will mark the guest as Checked in.',
  },
  CHECKED_OUT: {
    title: 'Check out guest?',
    actionLabel: 'Yes, check out',
    Icon: LogOut,
    body: 'This will mark the stay as Checked out.',
  },
};

export default function StatusAdvanceModal({
  open,
  targetStatus,
  guestName,
  bookingRef,
  submitting = false,
  onClose,
  onConfirm,
}) {
  if (!open || !targetStatus) return null;

  const meta = ACTION_META[targetStatus];
  if (!meta) return null;
  const { Icon } = meta;

  return createPortal(
    <div className="sd-status-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="sd-status-modal card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sd-status-modal-title"
      >
        <div className="sd-status-modal__head">
          <h3 id="sd-status-modal-title">
            <Icon size={20} aria-hidden />
            {meta.title}
          </h3>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        {(guestName || bookingRef) && (
          <p className="sd-status-modal__guest">
            {guestName && <strong>{guestName}</strong>}
            {bookingRef ? ` · ${bookingRef}` : ''}
          </p>
        )}

        <div className="sd-status-modal__warn">
          <AlertTriangle size={18} aria-hidden />
          <div>
            <p className="sd-status-modal__warn-title">Check before you continue</p>
            <p className="sd-status-modal__warn-text">
              If you need to change guest details, room, dates, charges, or payment, do that first.
              After you confirm, the stay status will be updated.
            </p>
          </div>
        </div>

        <p className="sd-status-modal__body">{meta.body}</p>

        <div className="sd-status-modal__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel — make changes first
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Updating…' : meta.actionLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
