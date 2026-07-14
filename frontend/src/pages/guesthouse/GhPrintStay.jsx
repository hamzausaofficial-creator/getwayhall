import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Wallet, FileText, XCircle } from 'lucide-react';
import { getStay, listGhPayments } from '../../api/guesthouse';
import { formatRs, formatCollectDuePKR } from '../../utils/currency';
import { relativeFieldLabel } from '../../utils/customer';
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

function PrintRow({ label, value, bold = false }) {
  return (
    <tr>
      <td>{label}</td>
      <td className={bold ? 'gh-print-table__bold' : undefined}>{value ?? '-'}</td>
    </tr>
  );
}

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
  const advanceReceiptId = initialPayment?.receipt_ref || null;
  const docTabs = stay.status === 'CANCELLED' ? [DOC_TAB_CANCELLED] : DOC_TABS_ACTIVE;
  const resolvedDoc = stay.status === 'CANCELLED' ? 'cancellation' : activeDoc;
  const relativeName = (stay.customer_relative_name || '').trim();
  const relativeLabel = relativeName
    ? relativeFieldLabel(stay.customer_gender || 'MALE', stay.customer_relative_relation || 'FATHER')
    : '';

  return (
    <GhPrintShell
      title={
        resolvedDoc === 'cancellation'
          ? 'Cancellation notice'
          : resolvedDoc === 'advance'
            ? 'Advance receipt'
            : 'Stay invoice'
      }
      subtitle={resolvedDoc === 'advance' && advanceReceiptId ? advanceReceiptId : stay.booking_ref}
      backTo={`/gh/stays/${stay.id}`}
      autoPrint={false}
    >
      <div className="print-hide" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
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
            ? 'Stay cancellation notice'
            : resolvedDoc === 'advance'
              ? null
              : 'Stay booking invoice'
        }
      />

      <div className="gh-print-meta">
        {resolvedDoc === 'advance' && advanceReceiptId ? (
          <div>
            <p className="gh-print-meta__label">Receipt ID</p>
            <p className="gh-print-meta__ref">{advanceReceiptId}</p>
          </div>
        ) : (
          <div>
            <p className="gh-print-meta__label">Reference</p>
            <p className="gh-print-meta__ref">{stay.booking_ref}</p>
          </div>
        )}
        <div style={{ textAlign: 'right' }}>
          <p className="gh-print-meta__label">Guest</p>
          <p className="gh-print-meta__guest">{stay.customer_name}</p>
          {relativeName && (
            <p className="gh-print-meta__relative">{relativeLabel}: {relativeName}</p>
          )}
          <p className="gh-print-meta__phone">{stay.customer_phone || '-'}</p>
        </div>
      </div>

      {resolvedDoc === 'advance' && advanceReceiptId && (
        <table className="gh-print-table">
          <tbody>
            <PrintRow label="Stay reference" value={stay.booking_ref} />
          </tbody>
        </table>
      )}

      {resolvedDoc === 'cancellation' ? (
        <>
          <div className="gh-print-cancel-banner">
            <h2>STAY CANCELLED / سٹے منسوخ</h2>
            <p>This reservation is no longer valid. The room has been released.</p>
          </div>

          <table className="gh-print-table">
            <tbody>
              <PrintRow label="Reference" value={stay.booking_ref} bold />
              <PrintRow label="Cancelled on" value={stay.cancelled_at ? new Date(stay.cancelled_at).toLocaleString() : new Date().toLocaleString()} />
              <PrintRow label="Guest" value={stay.customer_name} bold />
              <PrintRow label="Phone" value={stay.customer_phone} />
              <PrintRow label="Room" value={`Room ${stay.room_number} (${stay.room_type})`} />
              <PrintRow label="Check-in" value={stay.check_in} />
              <PrintRow label="Check-out" value={stay.check_out} />
              <PrintRow label="Nights" value={stay.nights} />
              {stay.cancellation_reason && <PrintRow label="Cancellation reason" value={stay.cancellation_reason} />}
            </tbody>
          </table>

          <div className="gh-print-bill">
            <div className="gh-print-bill__row">
              <span>Original stay total</span>
              <strong>{formatRs(stay.total_amount)}</strong>
            </div>
            <div className="gh-print-bill__row" style={{ color: '#166534' }}>
              <span>Advance received</span>
              <strong>{formatRs(advancePaid)}</strong>
            </div>
            <div className="gh-print-bill__total" style={{ color: '#15803d', borderTopColor: '#cbd5e1' }}>
              <span>Balance due (now)</span>
              <span>PKR 0</span>
            </div>
          </div>

          <div className="gh-print-terms">
            <p className="gh-print-terms__title">Important notice:</p>
            <ol>
              <li>Room {stay.room_number} is now available for other guests on these dates.</li>
              <li>No further payment is due on this cancelled stay.</li>
              <li>If advance was refunded, a separate refund receipt has been recorded.</li>
            </ol>
          </div>
        </>
      ) : resolvedDoc === 'advance' ? (
        <>
          <div className="gh-print-amount">
            <h2 className="gh-print-amount__value">PKR {advancePaid.toLocaleString()}</h2>
            {initialPayment && (
              <p className="gh-print-amount__meta">
                Method: {METHOD_LABELS[initialPayment.payment_method] || initialPayment.payment_method}
                {initialPayment.payment_date && ` · ${new Date(initialPayment.payment_date).toLocaleString()}`}
              </p>
            )}
          </div>

          <table className="gh-print-table">
            <tbody>
              {advanceReceiptId && <PrintRow label="Receipt ID" value={advanceReceiptId} bold />}
              <PrintRow label="Room" value={`Room ${stay.room_number} (${stay.room_type})`} />
              <PrintRow label="Check-in" value={stay.check_in} />
              <PrintRow label="Check-out" value={stay.check_out} />
              <PrintRow label="Nights" value={stay.nights} />
              <PrintRow label="Stay total" value={formatRs(stay.total_amount)} />
              <PrintRow label="Advance received" value={formatRs(advancePaid)} bold />
              <PrintRow label="Balance due" value={formatCollectDuePKR(remaining)} bold />
            </tbody>
          </table>
        </>
      ) : (
        <>
          <table className="gh-print-table">
            <tbody>
              <PrintRow label="Guest name" value={stay.customer_name} bold />
              <PrintRow label="Phone" value={stay.customer_phone} />
              <PrintRow label="Room" value={`Room ${stay.room_number} (${stay.room_type})`} />
              <PrintRow label="Check-in" value={stay.check_in} />
              <PrintRow label="Check-out" value={stay.check_out} />
              <PrintRow label="Nights" value={stay.nights} />
              <PrintRow label="Guests" value={stay.guests_count} />
              <PrintRow label="Rate per night" value={formatRs(stay.price_per_night)} />
            </tbody>
          </table>

          <div className="gh-print-bill">
            {stay.billing_breakdown ? (
              <>
                {Number(stay.billing_breakdown.extra_guest_total) > 0 ? (
                  <>
                    <div className="gh-print-bill__row">
                      <span>Room base ({stay.billing_breakdown.included_guests} guests incl.)</span>
                      <strong>{formatRs(stay.billing_breakdown.room_base)}</strong>
                    </div>
                    <div className="gh-print-bill__row">
                      <span>Extra guests ({stay.billing_breakdown.extra_guests} × {formatRs(stay.billing_breakdown.extra_guest_fee_per_night)}/night)</span>
                      <strong>{formatRs(stay.billing_breakdown.extra_guest_total)}</strong>
                    </div>
                  </>
                ) : (
                  <div className="gh-print-bill__row">
                    <span>
                      Room ({stay.billing_breakdown.included_guests ?? 1} guests incl. × {formatRs(stay.price_per_night)}/night × {stay.billing_breakdown.nights} nights)
                    </span>
                    <strong>{formatRs(stay.billing_breakdown.room_guest_total ?? stay.billing_breakdown.room_base)}</strong>
                  </div>
                )}
                {(stay.billing_breakdown.service_charges || []).map((line) => (
                  <div key={line.id} className="gh-print-bill__row">
                    <span>{line.description}</span>
                    <strong>{formatRs(line.amount)}</strong>
                  </div>
                ))}
                <div className="gh-print-bill__row" style={{ fontWeight: 800, paddingTop: 4, borderTop: '1px solid #e2e8f0' }}>
                  <span>Total</span>
                  <strong>{formatRs(stay.total_amount)}</strong>
                </div>
              </>
            ) : (
              <div className="gh-print-bill__row">
                <span>Subtotal ({stay.nights} night{stay.nights !== 1 ? 's' : ''})</span>
                <strong>{formatRs(stay.total_amount)}</strong>
              </div>
            )}
            <div className="gh-print-bill__row" style={{ color: '#166534' }}>
              <span>Advance paid</span>
              <strong>{formatRs(stay.advance_paid)}</strong>
            </div>
            <div className="gh-print-bill__total">
              <span>Balance due</span>
              <span>{formatCollectDuePKR(stay.remaining_balance)}</span>
            </div>
          </div>

          {payments.length > 0 && (
            <section className="gh-print-payments">
              <h3>Payment history</h3>
              <table>
                <thead>
                  <tr>
                    {['Date', 'Amount', 'Method'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 4).map((p) => (
                    <tr key={p.id}>
                      <td>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'}</td>
                      <td style={{ fontWeight: 700, color: '#166534' }}>{formatRs(p.amount)}</td>
                      <td>{METHOD_LABELS[p.payment_method] || p.payment_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}

      {stay.notes && (
        <p className="gh-print-notes">
          <strong>Notes:</strong> {stay.notes}
        </p>
      )}

      <div className="gh-print-signatures">
        <div className="gh-print-signatures__box">
          <div className="gh-print-signatures__line" />
          <p>Guest signature</p>
        </div>
        <div className="gh-print-signatures__box">
          <div className="gh-print-signatures__line" />
          <p>Authorized signature</p>
        </div>
      </div>

      {resolvedDoc !== 'advance' && <GhPrintFooter />}
    </GhPrintShell>
  );
}
