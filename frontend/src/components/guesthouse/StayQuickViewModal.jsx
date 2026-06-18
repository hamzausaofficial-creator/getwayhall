import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X, BedDouble, Calendar as CalendarIcon, CreditCard, Printer, Edit2, XCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import StatusBadge from '../ui/StatusBadge';
import { formatCollectDue, hasCollectDue } from '../../utils/currency';
import { canCancelGhStay } from '../../utils/ghStay';
import './stay-quick-modal.css';

const formatStayDate = (value) => {
  if (!value) return '-';
  try {
    return format(parseISO(value), 'dd MMM yyyy');
  } catch {
    return value;
  }
};

const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

export default function StayQuickViewModal({
  stay,
  onClose,
  onCancel,
  canAccessPayments,
  canCancelStay,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!stay) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [stay, onClose]);

  if (!stay) return null;

  const due = Math.max(0, Number(stay.total_amount) - Number(stay.advance_paid));
  const dueOutstanding = hasCollectDue(due);
  const canRecordPayment = canAccessPayments && dueOutstanding && stay.status !== 'CANCELLED';
  const canCancel = canCancelStay && canCancelGhStay(stay);

  const openStay = () => {
    navigate(`/gh/stays/${stay.id}`, { state: { from: '/gh/calendar', fromLabel: 'Back to calendar' } });
    onClose();
  };

  const printDocuments = () => {
    navigate(
      stay.status === 'CANCELLED'
        ? `/gh/print/${stay.id}?doc=cancellation`
        : `/gh/print/${stay.id}`,
    );
    onClose();
  };

  const recordPayment = () => {
    navigate('/gh/payments/new', { state: { preselectedStayId: stay.id } });
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="card stay-quick-modal animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stay-quick-modal-title"
      >
        <div className="stay-quick-modal__header">
          <div style={{ minWidth: 0 }}>
            <p className="stay-quick-modal__ref">{stay.booking_ref}</p>
            <h2 id="stay-quick-modal-title" className="stay-quick-modal__name">
              {stay.customer_name || 'Guest'}
            </h2>
            <StatusBadge status={stay.status} />
          </div>
          <button
            type="button"
            className="stay-quick-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="stay-quick-modal__body">
          <div className="stay-quick-modal__meta">
            <div className="stay-quick-modal__meta-item">
              <BedDouble size={16} aria-hidden />
              <div>
                <span className="stay-quick-modal__meta-label">Room</span>
                <span className="stay-quick-modal__meta-value">{stay.room_number || '-'}</span>
              </div>
            </div>
            <div className="stay-quick-modal__meta-item">
              <CalendarIcon size={16} aria-hidden />
              <div>
                <span className="stay-quick-modal__meta-label">Stay</span>
                <span className="stay-quick-modal__meta-value">
                  {formatStayDate(stay.check_in)}
                  {' → '}
                  {formatStayDate(stay.check_out)}
                </span>
              </div>
            </div>
          </div>

          <div className="stay-quick-modal__payments">
            <div className="stay-quick-modal__pay-cell">
              <span className="stay-quick-modal__pay-label">Total</span>
              <span className="stay-quick-modal__pay-value">{formatMoney(stay.total_amount)}</span>
            </div>
            <div className="stay-quick-modal__pay-cell">
              <span className="stay-quick-modal__pay-label">Paid</span>
              <span className="stay-quick-modal__pay-value">{formatMoney(stay.advance_paid)}</span>
            </div>
            <div className={`stay-quick-modal__pay-cell stay-quick-modal__pay-cell--due${dueOutstanding ? '' : ' is-clear'}`}>
              <span className="stay-quick-modal__pay-label">Due</span>
              <span className="stay-quick-modal__pay-value">{formatCollectDue(due)}</span>
            </div>
          </div>

          <div className="stay-quick-modal__actions">
            <button
              type="button"
              className="btn-primary stay-quick-modal__btn stay-quick-modal__btn--primary"
              onClick={openStay}
            >
              <Edit2 size={16} aria-hidden />
              View stay details
            </button>

            <div className={`stay-quick-modal__actions-row${canRecordPayment ? '' : ' stay-quick-modal__actions-row--single'}`}>
              <button
                type="button"
                className="stay-quick-modal__btn stay-quick-modal__btn--secondary"
                onClick={printDocuments}
              >
                <Printer size={16} aria-hidden />
                Print documents
              </button>
              {canRecordPayment && (
                <button
                  type="button"
                  className="stay-quick-modal__btn stay-quick-modal__btn--secondary"
                  onClick={recordPayment}
                >
                  <CreditCard size={16} aria-hidden />
                  Record payment
                </button>
              )}
            </div>

            {canCancel && (
              <button
                type="button"
                className="stay-quick-modal__btn stay-quick-modal__btn--danger"
                onClick={() => onCancel(stay)}
              >
                <XCircle size={16} aria-hidden />
                Cancel stay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
