import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, XCircle, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { stayCancel } from '../../api/guesthouse';
import { formatRs } from '../../utils/currency';

export default function CancelStayModal({ stay, open, onClose, onCancelled }) {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [refundAdvance, setRefundAdvance] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open || !stay) return null;

  const advance = Number(stay.advance_paid) || 0;

  const runCancel = async (andPrint) => {
    setSubmitting(true);
    try {
      await stayCancel(stay.id, {
        reason: reason.trim(),
        refund_advance: refundAdvance,
      });
      toast.success(
        refundAdvance && advance > 0
          ? 'Stay cancelled - advance refunded'
          : 'Stay cancelled successfully',
      );
      onCancelled?.();
      onClose();
      if (andPrint) {
        navigate(`/gh/print/stay/${stay.id}?doc=cancellation`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel stay');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <XCircle size={20} color="#ef4444" /> Cancel stay
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={22} />
          </button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
          <strong>{stay.customer_name || 'Guest'}</strong>
          <br />
          {stay.booking_ref} · Room {stay.room_number}
        </p>

        <div className="input-group" style={{ marginBottom: '16px' }}>
          <label>Reason for cancellation</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Guest had urgent work / travel plan changed"
            style={{ width: '100%', resize: 'none' }}
          />
        </div>

        {advance > 0 && (
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '14px',
              marginBottom: '20px',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={refundAdvance}
              onChange={(e) => setRefundAdvance(e.target.checked)}
              style={{ marginTop: '3px' }}
            />
            <span>
              Refund advance of <strong>{formatRs(advance)}</strong> to guest
            </span>
          </label>
        )}

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Stay will be marked cancelled. Room will be free for other bookings. You can print a cancellation notice for the guest.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="btn-primary"
            disabled={submitting}
            onClick={() => runCancel(true)}
            style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '700' }}
          >
            <Printer size={16} />
            {submitting ? 'Cancelling…' : 'Cancel & print notice'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={submitting}
            onClick={() => runCancel(false)}
            style={{ width: '100%', padding: '12px', fontWeight: '700', color: '#b91c1c', borderColor: '#fecaca' }}
          >
            {submitting ? 'Cancelling…' : 'Cancel only'}
          </button>
        </div>
      </div>
    </div>
  );
}
