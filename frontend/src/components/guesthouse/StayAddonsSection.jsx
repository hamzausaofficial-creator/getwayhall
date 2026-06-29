import { Link } from 'react-router-dom';
import { Snowflake, Plus } from 'lucide-react';
import { formatRs } from '../../utils/currency';
import { computeServiceAmount, getServicePriceLabel, formatRoomGuestChargeLabel, getIncludedGuests } from '../../utils/ghBilling';

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
            Add-on Services
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

export function StayBillingBreakdown({ billing, advance, compact = false, roomLabel }) {
  if (!billing) return null;

  const due = Math.max(0, billing.total - (Number(advance) || 0));
  const rowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: compact ? '12px' : '13px', gap: '12px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '10px' }}>
      {billing.extraGuestTotal > 0 ? (
        <>
          <div style={rowStyle}>
            <span style={{ color: 'var(--text-muted)', flex: 1, minWidth: 0 }}>
              Room base ({billing.included} guest{billing.included !== 1 ? 's' : ''} incl.)
            </span>
            <span style={{ fontWeight: '700', flexShrink: 0 }}>{formatRs(billing.roomBase)}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: 'var(--text-muted)', flex: 1, minWidth: 0 }}>
              Extra guests ({billing.extraGuests} × {formatRs(billing.extraFee)}/night × {billing.nights}n)
            </span>
            <span style={{ fontWeight: '700', flexShrink: 0 }}>{formatRs(billing.extraGuestTotal)}</span>
          </div>
        </>
      ) : (
        <div style={rowStyle}>
          <span style={{ color: 'var(--text-muted)', flex: 1, minWidth: 0 }}>{roomLabel || formatRoomGuestChargeLabel(billing)}</span>
          <span style={{ fontWeight: '700', flexShrink: 0 }}>{formatRs(billing.roomGuestTotal ?? billing.roomBase)}</span>
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
  const guests = Math.max(Number(guestsCount) || 1, 1);
  const included = getIncludedGuests(room);
  const extraFee = Number(room.extra_guest_fee_per_night) || 0;
  const extraGuests = Math.max(guests - included, 0);
  const nightly = Number(room.price_per_night) || 0;

  if (extraGuests > 0 && extraFee > 0) {
    return (
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
        Base rate covers {included} guest{included !== 1 ? 's' : ''} ({formatRs(nightly)}/night).
        {' '}
        {extraGuests} extra guest{extraGuests !== 1 ? 's' : ''} × {formatRs(extraFee)}/night each.
      </p>
    );
  }

  return (
    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
      Base rate covers up to {included} guest{included !== 1 ? 's' : ''} at {formatRs(nightly)}/night — no extra guest fee.
    </p>
  );
}
