import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGhPayment, getStay } from '../../api/guesthouse';
import { formatRs, formatCollectDuePKR } from '../../utils/currency';
import GhPrintShell, { GhPrintHeader, GhPrintFooter } from '../../components/guesthouse/GhPrintShell';
import AppLoader from '../../components/AppLoader';

const METHOD_LABELS = {
  CASH: 'Cash',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
  ONLINE: 'Online',
};

export default function GhPrintPayment() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [stay, setStay] = useState(null);

  useEffect(() => {
    getGhPayment(paymentId)
      .then(async (p) => {
        setPayment(p);
        if (p.stay) {
          try {
            setStay(await getStay(p.stay));
          } catch {
            /* optional */
          }
        }
      })
      .catch(() => navigate('/gh/payments'));
  }, [paymentId, navigate]);

  if (!payment) {
    return <AppLoader fullScreen message="Loading receipt…" />;
  }

  const receiptId = payment.receipt_ref || `GHR-PAY-${String(payment.id).padStart(5, '0')}`;

  const isAdvanceReceipt = (payment.notes || '').includes('Initial advance');

  return (
    <GhPrintShell
      title={isAdvanceReceipt ? 'Advance receipt' : 'Payment receipt'}
      subtitle={receiptId}
      backTo="/gh/payments"
    >
      <GhPrintHeader docType={isAdvanceReceipt ? 'Advance receipt / ایڈوانس رسیڈ' : 'Payment receipt'} />

      <div style={{ textAlign: 'center', marginBottom: '24px', padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px dashed #5BD51E' }}>
        <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>
          Amount received
        </p>
        <p style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#166534' }}>{formatRs(payment.amount)}</p>
        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          {METHOD_LABELS[payment.payment_method] || payment.payment_method} · {payment.status}
        </p>
      </div>

      <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse' }}>
        <tbody>
          {[
            ['Receipt ID', receiptId],
            ['Date', payment.payment_date ? new Date(payment.payment_date).toLocaleString() : '-'],
            ['Stay reference', payment.stay_ref || stay?.booking_ref],
            ['Guest', payment.customer_name || stay?.customer_name],
            ['Room', payment.room_number ? `Room ${payment.room_number}` : stay?.room_number],
            ['Recorded by', payment.recorded_by_name || '-'],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ padding: '8px 0', color: '#64748b', width: '40%', fontSize: '13px' }}>{label}</td>
              <td style={{ padding: '8px 0', fontWeight: '600', fontSize: '14px' }}>{value ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {stay && (
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '20px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', color: '#64748b' }}>Stay balance after payment</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>Stay total</span><strong>{formatRs(stay.total_amount)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>Total paid</span><strong style={{ color: '#166534' }}>{formatRs(stay.advance_paid)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
            <span>Balance due</span>
            <span style={{ color: '#5BD51E' }}>{formatCollectDuePKR(stay.remaining_balance)}</span>
          </div>
        </div>
      )}

      {payment.notes && (
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
          <strong>Notes:</strong> {payment.notes}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', fontSize: '11px' }}>
        <div style={{ width: '42%', textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #94a3b8', height: '40px', marginBottom: '6px' }} />
          <p style={{ margin: 0, color: '#64748b' }}>Guest signature</p>
        </div>
        <div style={{ width: '42%', textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #94a3b8', height: '40px', marginBottom: '6px' }} />
          <p style={{ margin: 0, color: '#64748b' }}>Cashier signature</p>
        </div>
      </div>

      <GhPrintFooter />
    </GhPrintShell>
  );
}
