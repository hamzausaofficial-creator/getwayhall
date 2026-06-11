import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGhPayment } from '../../api/guesthouse';
import { formatRs } from '../../utils/currency';
import GhPrintShell from '../../components/guesthouse/GhPrintShell';
import AppLoader from '../../components/AppLoader';
import AppLogo from '../../components/AppLogo';
import { BRAND_GUEST_HOUSE } from '../../constants/brand';

const METHOD_LABELS = {
  CASH: 'Cash',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  ONLINE: 'Online',
};

export default function PrintGhPayment() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    getGhPayment(paymentId)
      .then(setPayment)
      .catch(() => navigate('/gh/payments'));
  }, [paymentId, navigate]);

  if (!payment) {
    return <AppLoader fullScreen message="Loading receipt…" />;
  }

  const slipId = `PAY-${String(payment.id).padStart(5, '0')}`;
  const paidAt = payment.payment_date
    ? new Date(payment.payment_date).toLocaleString()
    : new Date().toLocaleString();

  return (
    <GhPrintShell
      title="Payment receipt"
      backTo="/gh/payments"
      thermal
    >
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <AppLogo size="sm" tone="dark" />
        </div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '900' }}>{BRAND_GUEST_HOUSE.toUpperCase()}</h3>
        <p style={{ margin: 0, fontSize: '10px' }}>Payment receipt</p>
        <p style={{ margin: '8px 0' }}>--------------------------------</p>
      </div>

      <p style={{ margin: '4px 0' }}><strong>Slip ID:</strong> {slipId}</p>
      <p style={{ margin: '4px 0' }}><strong>Date:</strong> {paidAt}</p>
      <p style={{ margin: '4px 0' }}><strong>Guest:</strong> {payment.customer_name || '-'}</p>
      <p style={{ margin: '4px 0' }}><strong>Stay ref:</strong> {payment.stay_ref || '-'}</p>
      <p style={{ margin: '4px 0' }}><strong>Room:</strong> {payment.room_number || '-'}</p>
      <p style={{ margin: '4px 0' }}><strong>Method:</strong> {METHOD_LABELS[payment.payment_method] || payment.payment_method}</p>
      <p style={{ margin: '4px 0' }}><strong>Status:</strong> {payment.status}</p>
      {payment.recorded_by_name && (
        <p style={{ margin: '4px 0' }}><strong>Received by:</strong> {payment.recorded_by_name}</p>
      )}

      <div
        style={{
          borderTop: '1px dashed #000',
          borderBottom: '1px dashed #000',
          padding: '12px 0',
          margin: '14px 0',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: '0 0 6px 0', fontSize: '11px', textTransform: 'uppercase' }}>Amount received</p>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900' }}>{formatRs(payment.amount)}</h2>
      </div>

      {payment.stay_remaining != null && (
        <p style={{ margin: '4px 0' }}>
          <strong>Balance after payment:</strong> {formatRs(payment.stay_remaining)}
        </p>
      )}

      {payment.notes && (
        <div style={{ marginTop: '12px', fontSize: '10px' }}>
          <p style={{ margin: '0 0 4px 0' }}><strong>Notes:</strong></p>
          <p style={{ margin: 0, fontStyle: 'italic' }}>{payment.notes}</p>
        </div>
      )}

      <p style={{ margin: '20px 0 8px 0' }}>--------------------------------</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginTop: '16px' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 20px 0' }}>_________________</p>
          <p style={{ margin: 0 }}>Guest signature</p>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 20px 0' }}>_________________</p>
          <p style={{ margin: 0 }}>Authorized</p>
        </div>
      </div>
      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '9px', color: '#64748b' }}>
        Thank you for staying with us
      </p>
    </GhPrintShell>
  );
}
