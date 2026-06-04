import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStay, listGhPayments } from '../../api/guesthouse';
import { formatRs, formatCollectDuePKR } from '../../utils/currency';
import GhPrintShell, { GhPrintHeader, GhPrintFooter } from '../../components/guesthouse/GhPrintShell';

const METHOD_LABELS = {
  CASH: 'Cash',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
  ONLINE: 'Online',
};

export default function GhPrintStay() {
  const { stayId } = useParams();
  const navigate = useNavigate();
  const [stay, setStay] = useState(null);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    Promise.all([getStay(stayId), listGhPayments({ stay: stayId })])
      .then(([s, p]) => {
        setStay(s);
        setPayments(p);
      })
      .catch(() => navigate('/gh/stays'));
  }, [stayId, navigate]);

  if (!stay) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Loading document…</div>;
  }

  const row = (label, value, bold) => (
    <tr key={label}>
      <td style={{ padding: '8px 0', color: '#64748b', width: '38%', fontSize: '13px', verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '8px 0', fontWeight: bold ? '800' : '600', fontSize: '14px' }}>{value ?? '—'}</td>
    </tr>
  );

  return (
    <GhPrintShell
      title="Stay invoice"
      subtitle={stay.booking_ref}
      backTo={`/gh/stays/${stay.id}`}
    >
      <GhPrintHeader docType="Stay booking invoice" />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Reference</p>
          <p style={{ fontSize: '22px', fontWeight: '900', margin: 0, fontFamily: 'monospace' }}>{stay.booking_ref}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Status</p>
          <p style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>{stay.status?.replace(/_/g, ' ')}</p>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Payment: {stay.payment_status}</p>
        </div>
      </div>

      <table style={{ width: '100%', marginBottom: '28px', borderCollapse: 'collapse' }}>
        <tbody>
          {row('Guest name', stay.customer_name, true)}
          {row('Phone', stay.customer_phone)}
          {row('Room', `Room ${stay.room_number} (${stay.room_type})`)}
          {row('Check-in', stay.check_in)}
          {row('Check-out', stay.check_out)}
          {row('Nights', stay.nights)}
          {row('Guests', stay.guests_count)}
          {row('Rate per night', formatRs(stay.price_per_night))}
        </tbody>
      </table>

      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '28px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
          <span>Subtotal ({stay.nights} night{stay.nights !== 1 ? 's' : ''})</span>
          <strong>{formatRs(stay.total_amount)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#166534' }}>
          <span>Total paid</span>
          <strong>{formatRs(stay.advance_paid)}</strong>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '2px solid #5BD51E',
            fontSize: '18px',
            fontWeight: '900',
            color: '#5BD51E',
          }}
        >
          <span>Balance due</span>
          <span>{formatCollectDuePKR(stay.remaining_balance)}</span>
        </div>
      </div>

      {payments.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '12px' }}>
            Payment history
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['Date', 'Amount', 'Method', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '8px', textAlign: 'left', color: '#64748b', fontWeight: '700' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px' }}>
                    {p.payment_date ? new Date(p.payment_date).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '8px', fontWeight: '700', color: '#166534' }}>{formatRs(p.amount)}</td>
                  <td style={{ padding: '8px' }}>{METHOD_LABELS[p.payment_method] || p.payment_method}</td>
                  <td style={{ padding: '8px' }}>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {stay.notes && (
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
          <strong>Notes:</strong> {stay.notes}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', fontSize: '11px' }}>
        <div style={{ width: '42%', textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #94a3b8', height: '48px', marginBottom: '6px' }} />
          <p style={{ margin: 0, color: '#64748b' }}>Guest signature</p>
        </div>
        <div style={{ width: '42%', textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #94a3b8', height: '48px', marginBottom: '6px' }} />
          <p style={{ margin: 0, color: '#64748b' }}>Authorized signature</p>
        </div>
      </div>

      <GhPrintFooter />
    </GhPrintShell>
  );
}
