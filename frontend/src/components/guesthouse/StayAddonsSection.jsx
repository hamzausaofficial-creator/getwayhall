import { Link } from 'react-router-dom';
import { Snowflake, Plus } from 'lucide-react';
import { formatRs } from '../../utils/currency';
import { computeServiceAmount, getIncludedGuests, getServicePriceLabel } from '../../utils/ghBilling';

const PRICING_HINT = {
  PER_NIGHT: 'Charged per night',
  PER_STAY: 'One-time per stay',
  PER_GUEST: 'Per guest, per night',
};

export function StayAddonsPicker({ services, selectedIds, onToggle, nights, guestsCount }) {
  if (!services.length) {
    return (
      <div className="premium-card" style={{ padding: '20px 24px' }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          No add-on services configured. Add AC, breakfast, laundry, etc. in{' '}
          <Link to="/gh/settings?tab=services" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Settings → Add-on Services
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="premium-card" style={{ padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Snowflake size={20} color="var(--primary)" />
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--secondary)' }}>
            Extra services
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            AC, breakfast, laundry, and other add-ons
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {services.map((svc) => {
          const active = selectedIds.includes(svc.id);
          const lineAmount = nights > 0 ? computeServiceAmount(svc, nights, guestsCount) : Number(svc.price);
          return (
            <button
              key={svc.id}
              type="button"
              onClick={() => onToggle(svc.id)}
              style={{
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: '12px',
                border: active ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: active ? 'var(--primary-light)' : 'var(--surface)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: active ? 'var(--primary)' : 'var(--secondary)' }}>
                  {svc.label}
                </span>
                {active && <Plus size={16} color="var(--primary)" style={{ transform: 'rotate(45deg)' }} />}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
                {getServicePriceLabel(svc)} · {PRICING_HINT[svc.pricing_unit]}
              </p>
              {nights > 0 && (
                <p style={{ fontSize: '13px', fontWeight: '800', margin: '8px 0 0 0', color: active ? 'var(--primary)' : 'var(--secondary)' }}>
                  +{formatRs(lineAmount)}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StayBillingBreakdown({ billing, advance = 0, compact = false }) {
  if (!billing) return null;

  const due = Math.max(0, billing.total - (Number(advance) || 0));
  const rowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: compact ? '12px' : '13px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '10px' }}>
      <div style={rowStyle}>
        <span style={{ color: 'var(--text-muted)' }}>Room ({billing.nights} night{billing.nights !== 1 ? 's' : ''})</span>
        <span style={{ fontWeight: '700' }}>{formatRs(billing.roomBase)}</span>
      </div>
      {billing.extraGuests > 0 && (
        <div style={rowStyle}>
          <span style={{ color: 'var(--text-muted)' }}>
            Extra guests ({billing.extraGuests} × {formatRs(billing.extraFee)}/night)
          </span>
          <span style={{ fontWeight: '700' }}>{formatRs(billing.extraGuestTotal)}</span>
        </div>
      )}
      {billing.serviceLines.map((line) => (
        <div key={line.id} style={rowStyle}>
          <span style={{ color: 'var(--text-muted)' }}>{line.label}</span>
          <span style={{ fontWeight: '700' }}>{formatRs(line.amount)}</span>
        </div>
      ))}
      <div style={{ ...rowStyle, paddingTop: '8px', borderTop: '1px solid var(--border)', fontWeight: '800' }}>
        <span>Total</span>
        <span>{formatRs(billing.total)}</span>
      </div>
      {advance !== undefined && (
        <div style={{ ...rowStyle, fontWeight: '800', color: due > 0 ? 'var(--error)' : 'var(--primary)' }}>
          <span>Balance due</span>
          <span>{formatRs(due)}</span>
        </div>
      )}
    </div>
  );
}

export function GuestsCountHint({ room, guestsCount }) {
  if (!room) return null;
  const included = getIncludedGuests(room);
  const guests = Number(guestsCount) || 1;
  const extra = Math.max(guests - included, 0);
  const extraFee = Number(room.extra_guest_fee_per_night) || 0;

  return (
    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
      Room includes {included} guest{included !== 1 ? 's' : ''}.
      {extra > 0 && extraFee > 0
        ? ` ${extra} extra guest${extra !== 1 ? 's' : ''} - ${formatRs(extraFee)} / guest / night.`
        : extra > 0
          ? ` ${extra} extra guest${extra !== 1 ? 's' : ''} (no extra fee set for this room).`
          : ' No extra guest charge.'}
    </p>
  );
}
