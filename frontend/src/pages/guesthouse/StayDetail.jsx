import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, User, BedDouble, CreditCard, Printer, Edit2, Wallet,
} from 'lucide-react';
import {
  getStay, stayCheckIn, stayCheckOut, stayCancel, stayConfirm, listGhPayments,
} from '../../api/guesthouse';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import { formatRs, formatCollectDuePKR, hasCollectDue } from '../../utils/currency';

const STATUS_STYLE = {
  PENDING: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  CONFIRMED: { bg: '#dcfce7', color: '#166534', label: 'Confirmed' },
  CHECKED_IN: { bg: '#dbeafe', color: '#1e40af', label: 'Checked In' },
  CHECKED_OUT: { bg: '#f1f5f9', color: '#64748b', label: 'Checked Out' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const DetailRow = ({ label, value, highlight }) => (
  <div>
    <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</p>
    <p style={{ fontSize: '15px', fontWeight: highlight ? '800' : '600', color: highlight ? 'var(--primary)' : 'var(--text-main)' }}>{value ?? '—'}</p>
  </div>
);

export default function StayDetail() {
  const { stayId } = useParams();
  const navigate = useNavigate();
  const { canManage } = usePermissions();
  const [stay, setStay] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, pays] = await Promise.all([
        getStay(stayId),
        listGhPayments({ stay: stayId }),
      ]);
      setStay(s);
      setPayments(pays);
    } catch {
      toast.error('Stay not found');
      navigate('/gh/stays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stayId) load();
  }, [stayId]);

  const runAction = async (fn, msg) => {
    try {
      const updated = await fn(stayId);
      setStay(updated);
      toast.success(msg);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed');
    }
  };

  if (loading) {
    return <div className="animate-fade-in" style={{ padding: '48px', textAlign: 'center' }}>Loading stay…</div>;
  }
  if (!stay) return null;

  const st = STATUS_STYLE[stay.status] || STATUS_STYLE.PENDING;
  const due = Number(stay.remaining_balance || 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button type="button" className="btn-secondary" onClick={() => navigate('/gh/stays')} style={{ padding: '10px' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{stay.booking_ref}</h2>
            <p style={{ color: 'var(--text-muted)' }}>Room {stay.room_number} · {stay.customer_name}</p>
          </div>
        </div>
        <div className="page-header__actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn-secondary" onClick={() => navigate(`/gh/print/stay/${stay.id}`)}>
            <Printer size={16} /> Print invoice
          </button>
          {canManage && (
            <button type="button" className="btn-secondary" onClick={() => navigate(`/gh/stays/${stay.id}/edit`)}>
              <Edit2 size={16} /> Edit
            </button>
          )}
          {canManage && hasCollectDue(due) && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate(`/gh/payments/new?stay=${stay.id}`)}
            >
              <CreditCard size={16} /> Record Payment
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="premium-card" style={{ padding: '24px' }}>
          <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: st.bg, color: st.color }}>{st.label}</span>
          <span style={{ marginLeft: '8px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: stay.payment_status === 'PAID' ? '#dcfce7' : '#fef3c7', color: stay.payment_status === 'PAID' ? '#166534' : '#92400e' }}>
            {stay.payment_status}
          </span>
          {canManage && stay.status !== 'CANCELLED' && stay.status !== 'CHECKED_OUT' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
              {stay.status === 'PENDING' && (
                <button type="button" className="btn-secondary" onClick={() => runAction(stayConfirm, 'Stay confirmed')}>Confirm</button>
              )}
              {['CONFIRMED', 'PENDING'].includes(stay.status) && (
                <button type="button" className="btn-primary" onClick={() => runAction(stayCheckIn, 'Checked in')}>Check In</button>
              )}
              {stay.status === 'CHECKED_IN' && (
                <button type="button" className="btn-primary" onClick={() => runAction(stayCheckOut, 'Checked out')}>Check Out</button>
              )}
              {stay.status !== 'CHECKED_IN' && (
                <button type="button" className="btn-secondary" style={{ color: '#ef4444' }} onClick={() => runAction(stayCancel, 'Stay cancelled')}>Cancel</button>
              )}
            </div>
          )}
        </div>
        <div className="premium-card" style={{ padding: '24px' }}>
          <DetailRow label="Grand Total" value={formatRs(stay.total_amount)} highlight />
          <div style={{ marginTop: '12px' }}><DetailRow label="Paid" value={formatRs(stay.advance_paid)} /></div>
          <div style={{ marginTop: '12px' }}><DetailRow label="Balance Due" value={formatCollectDuePKR(due)} highlight={hasCollectDue(due)} /></div>
        </div>
      </div>

      <div className="premium-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Stay details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
          <DetailRow label="Guest" value={stay.customer_name} />
          <DetailRow label="Phone" value={stay.customer_phone} />
          <DetailRow label="Room" value={`${stay.room_number} (${stay.room_type})`} />
          <DetailRow label="Check-in" value={stay.check_in} />
          <DetailRow label="Check-out" value={stay.check_out} />
          <DetailRow label="Nights" value={stay.nights} />
          <DetailRow label="Guests" value={stay.guests_count} />
          <DetailRow label="Rate/night" value={formatRs(stay.price_per_night)} />
        </div>
        {stay.notes && <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>{stay.notes}</p>}
      </div>

      <div className="premium-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Payment history</h3>
        {payments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No payments recorded.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Amount', 'Method', 'Status', 'Notes', ''].map((h) => (
                  <th key={h} style={{ padding: '10px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px' }}>{p.payment_date ? new Date(p.payment_date).toLocaleString() : '—'}</td>
                  <td style={{ padding: '10px', fontWeight: '700' }}>{formatRs(p.amount)}</td>
                  <td style={{ padding: '10px' }}>{p.payment_method}</td>
                  <td style={{ padding: '10px' }}>{p.status}</td>
                  <td style={{ padding: '10px' }}>{p.notes || '—'}</td>
                  <td style={{ padding: '10px' }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      title="Print receipt"
                      onClick={() => navigate(`/gh/print/payment/${p.id}`)}
                    >
                      <Printer size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Link to="/gh/payments" style={{ display: 'inline-block', marginTop: '12px', fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>View all payments →</Link>
      </div>
    </div>
  );
}
