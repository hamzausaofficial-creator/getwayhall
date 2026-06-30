import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Wallet, FileText, CheckCircle, XCircle } from 'lucide-react';
import { getStay, listGhPayments } from '../../api/guesthouse';
import { formatRs, formatCollectDuePKR } from '../../utils/currency';
import GhPrintShell, { GhPrintHeader, GhPrintFooter } from '../../components/guesthouse/GhPrintShell';
import AppLoader from '../../components/AppLoader';

const METHOD_LABELS = {
  CASH: 'Cash',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
  ONLINE: 'Online',
};

const DOC_TABS_ACTIVE = [
  { id: 'advance', label: 'Advance Receipt', urdu: 'ایڈوانس رسیڈ' },
  { id: 'invoice', label: 'Stay Invoice', urdu: 'سٹے بل' },
];
const DOC_TAB_CANCELLED = { id: 'cancellation', label: 'Cancellation Notice', urdu: 'منسوخی نوٹس' };

export default function GhPrintStay() {
  const { stayId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stay, setStay] = useState(null);
  const [payments, setPayments] = useState([]);
  const activeDoc = searchParams.get('doc') || 'invoice';

  useEffect(() => {
    Promise.all([getStay(stayId), listGhPayments({ stay: stayId })])
      .then(([s, p]) => {
        setStay(s);
        setPayments(p);
        const doc = searchParams.get('doc');
        if (doc === 'cancellation' || s.status === 'CANCELLED') {
          setSearchParams({ doc: 'cancellation' }, { replace: true });
        }
      })
      .catch(() => navigate('/gh/stays'));
  }, [stayId, navigate, setSearchParams]);

  const setDoc = (docId) => {
    setSearchParams({ doc: docId }, { replace: true });
  };

  if (!stay) {
    return <AppLoader fullScreen message="Loading document…" />;
  }

  const advancePaid = Number(stay.advance_paid) || 0;
  const remaining = stay.status === 'CANCELLED' ? 0 : (Number(stay.remaining_balance) || 0);
  const initialPayment = payments.find((p) => (p.notes || '').includes('Initial advance'));
  const docTabs = stay.status === 'CANCELLED' ? [DOC_TAB_CANCELLED] : DOC_TABS_ACTIVE;
  const resolvedDoc = stay.status === 'CANCELLED' ? 'cancellation' : activeDoc;

  const row = (label, value, bold) => (
    <tr key={label}>
      <td style={{ padding: '8px 0', color: '#64748b', width: '38%', fontSize: '13px', verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '8px 0', fontWeight: bold ? '800' : '600', fontSize: '14px' }}>{value ?? '-'}</td>
    </tr>
  );

  return (
    <GhPrintShell
      title={
        resolvedDoc === 'cancellation'
          ? 'Cancellation notice'
          : resolvedDoc === 'advance'
            ? 'Advance receipt'
            : 'Stay invoice'
      }
      subtitle={stay.booking_ref}
      backTo={`/gh/stays/${stay.id}`}
      autoPrint={false}
    >
      <div className="print-hide" style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {docTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setDoc(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: resolvedDoc === tab.id ? '2px solid #5BD51E' : '1px solid #e2e8f0',
              background: resolvedDoc === tab.id ? '#f0fdf4' : '#fff',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {tab.id === 'advance' ? <Wallet size={14} /> : tab.id === 'cancellation' ? <XCircle size={14} /> : <FileText size={14} />}
            {tab.label}
          </button>
        ))}
      </div>

      <GhPrintHeader
        docType={
          resolvedDoc === 'cancellation'
            ? 'Stay cancellation notice / منسوخی نوٹس'
            : resolvedDoc === 'advance'
              ? 'Advance receipt / ایڈوانس رسیڈ'
              : 'Stay booking invoice'
        }
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Reference</p>
          <p style={{ fontSize: '22px', fontWeight: '900', margin: 0, fontFamily: 'monospace' }}>{stay.booking_ref}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Guest</p>
          <p style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>{stay.customer_name}</p>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>{stay.customer_phone || '-'}</p>
        </div>
      </div>

      {resolvedDoc === 'cancellation' ? (
        <>
          <div style={{
            textAlign: 'center',
            padding: '28px 24px',
            marginBottom: '28px',
            borderRadius: '12px',
            border: '2px solid #fecaca',
            backgroundColor: '#fef2f2',
          }}>
            <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#991b1b', margin: '0 0 8px 0' }}>
              STAY CANCELLED / سٹے منسوخ
            </h2>
            <p style={{ fontSize: '14px', color: '#7f1d1d', margin: 0, fontWeight: '600' }}>
              This reservation is no longer valid. The room has been released.
            </p>
          </div>

          <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse' }}>
            <tbody>
              {row('Reference', stay.booking_ref, true)}
              {row('Cancelled on', stay.cancelled_at ? new Date(stay.cancelled_at).toLocaleString() : new Date().toLocaleString())}
              {row('Guest', stay.customer_name, true)}
              {row('Phone', stay.customer_phone)}
              {row('Room', `Room ${stay.room_number} (${stay.room_type})`)}
              {row('Check-in', stay.check_in)}
              {row('Check-out', stay.check_out)}
              {row('Nights', stay.nights)}
              {stay.cancellation_reason && row('Cancellation reason', stay.cancellation_reason)}
            </tbody>
          </table>

          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span>Original stay total</span>
              <strong>{formatRs(stay.total_amount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#166534' }}>
              <span>Advance received</span>
              <strong>{formatRs(advancePaid)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px dashed #cbd5e1', fontSize: '16px', fontWeight: '900', color: '#15803d' }}>
              <span>Balance due (now)</span>
              <span>PKR 0</span>
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', fontSize: '13px', lineHeight: 1.6, marginBottom: '24px' }}>
            <h5 style={{ fontWeight: '800', fontSize: '14px', marginBottom: '10px', color: '#0f172a' }}>Important notice:</h5>
            <ol style={{ paddingLeft: '18px', margin: 0, color: '#475569' }}>
              <li style={{ marginBottom: '8px' }}>Room {stay.room_number} is now available for other guests on these dates.</li>
              <li style={{ marginBottom: '8px' }}>No further payment is due on this cancelled stay.</li>
              <li>If advance was refunded, a separate refund receipt has been recorded in the payment history.</li>
            </ol>
          </div>
        </>
      ) : resolvedDoc === 'advance' ? (
        <>
          <div style={{
            backgroundColor: '#f5fdf2',
            border: '1.5px dashed #c0f7a6',
            padding: '24px 30px',
            borderRadius: '12px',
            textAlign: 'center',
            marginBottom: '28px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#288005', textTransform: 'uppercase' }}>
              Secure Stay Advance Amount (ایڈوانس رقم)
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#5BD51E', margin: '8px 0' }}>
              PKR {advancePaid.toLocaleString()}
            </h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#c0f7a6', color: '#1e5e03', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
              <CheckCircle size={12} /> SECURED DEPOSIT
            </div>
            {initialPayment && (
              <p style={{ fontSize: '12px', color: '#64748b', margin: '12px 0 0 0' }}>
                Method: {METHOD_LABELS[initialPayment.payment_method] || initialPayment.payment_method}
                {initialPayment.payment_date && ` · ${new Date(initialPayment.payment_date).toLocaleString()}`}
              </p>
            )}
          </div>

          <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse' }}>
            <tbody>
              {row('Room', `Room ${stay.room_number} (${stay.room_type})`)}
              {row('Check-in', stay.check_in)}
              {row('Check-out', stay.check_out)}
              {row('Nights', stay.nights)}
              {row('Stay total', formatRs(stay.total_amount))}
              {row('Advance received', formatRs(advancePaid), true)}
              {row('Balance due', formatCollectDuePKR(remaining), true)}
            </tbody>
          </table>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', fontSize: '13px', lineHeight: 1.6, marginBottom: '24px' }}>
            <h5 style={{ fontWeight: '800', fontSize: '14px', marginBottom: '10px', color: '#0f172a' }}>
              Terms & Conditions (شرائط):
            </h5>
            <ol style={{ paddingLeft: '18px', margin: 0, color: '#475569' }}>
              <li style={{ marginBottom: '8px' }}>
                Advance of <strong>PKR {advancePaid.toLocaleString()}</strong> reserves Room {stay.room_number} for {stay.check_in} to {stay.check_out}.
              </li>
              <li style={{ marginBottom: '8px' }}>
                Remaining balance of <strong>{formatCollectDuePKR(remaining)}</strong> is due at check-in.
              </li>
              <li style={{ marginBottom: '8px' }}>
                Cancellations within 48 hours of check-in may forfeit the advance deposit.
              </li>
              <li>Guest must present valid CNIC/ID at check-in.</li>
            </ol>
          </div>
        </>
      ) : (
        <>
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
            {stay.billing_breakdown ? (
              <>
                {Number(stay.billing_breakdown.extra_guest_total) > 0 ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                      <span>Room base ({stay.billing_breakdown.included_guests} guests incl.)</span>
                      <strong>{formatRs(stay.billing_breakdown.room_base)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                      <span>Extra guests ({stay.billing_breakdown.extra_guests} × {formatRs(stay.billing_breakdown.extra_guest_fee_per_night)}/night)</span>
                      <strong>{formatRs(stay.billing_breakdown.extra_guest_total)}</strong>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span>
                      Room ({stay.billing_breakdown.included_guests ?? 1} guests incl. × {formatRs(stay.price_per_night)}/night × {stay.billing_breakdown.nights} nights)
                    </span>
                    <strong>{formatRs(stay.billing_breakdown.room_guest_total ?? stay.billing_breakdown.room_base)}</strong>
                  </div>
                )}
                {(stay.billing_breakdown.service_charges || []).map((line) => (
                  <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span>{line.description}</span>
                    <strong>{formatRs(line.amount)}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontWeight: 800 }}>
                  <span>Total</span>
                  <strong>{formatRs(stay.total_amount)}</strong>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span>Subtotal ({stay.nights} night{stay.nights !== 1 ? 's' : ''})</span>
                <strong>{formatRs(stay.total_amount)}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#166534' }}>
              <span>Advance paid</span>
              <strong>{formatRs(stay.advance_paid)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid #5BD51E', fontSize: '18px', fontWeight: '900', color: '#5BD51E' }}>
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
                      <td style={{ padding: '8px' }}>{p.payment_date ? new Date(p.payment_date).toLocaleString() : '-'}</td>
                      <td style={{ padding: '8px', fontWeight: '700', color: '#166534' }}>{formatRs(p.amount)}</td>
                      <td style={{ padding: '8px' }}>{METHOD_LABELS[p.payment_method] || p.payment_method}</td>
                      <td style={{ padding: '8px' }}>{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
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
