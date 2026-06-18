import { Calculator, AlertCircle } from 'lucide-react';
import { StayBillingBreakdown } from './StayAddonsSection';
import { formatRs } from '../../utils/currency';
import './live-booking-estimate.css';

export default function LiveBookingEstimate({
  bill,
  advance,
  showAdvance = true,
  title = 'Live bill estimate',
}) {
  if (!bill) return null;

  if (bill.status === 'error') {
    return (
      <div className="live-bill live-bill--error">
        <AlertCircle size={18} aria-hidden />
        <span>{bill.error}</span>
      </div>
    );
  }

  if (bill.status === 'partial') {
    return (
      <div className="live-bill live-bill--partial">
        <Calculator size={18} color="var(--primary)" aria-hidden />
        <div>
          <p className="live-bill__title">{title}</p>
          <p className="live-bill__hint">{bill.hint}</p>
          {bill.guests > 0 && (
            <p className="live-bill__meta">
              {bill.guests} guest{bill.guests !== 1 ? 's' : ''}
              {bill.nights > 0 ? ` · ${bill.nights} night${bill.nights !== 1 ? 's' : ''}` : ''}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="live-bill live-bill--ready">
      <div className="live-bill__head">
        <Calculator size={18} color="var(--primary)" aria-hidden />
        <div className="live-bill__head-text">
          <p className="live-bill__title">{title}</p>
          <p className="live-bill__total">{formatRs(bill.total)}</p>
        </div>
      </div>
      <StayBillingBreakdown
        billing={bill}
        advance={showAdvance ? advance : undefined}
        compact
      />
      {bill.advanceExceedsTotal && (
        <p className="live-bill__warn">Advance cannot exceed total ({formatRs(bill.total)}).</p>
      )}
    </div>
  );
}
