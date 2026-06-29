import { Link } from 'react-router-dom';
import { User, Users } from 'lucide-react';
import './stay-guest-roster.css';

function guestMetaParts(guest) {
  if (guest.is_minor) {
    return guest.address ? [guest.address] : [];
  }
  return [guest.cnic, guest.phone].filter(Boolean);
}

export default function StayGuestRosterDetail({ guests = [], charges = [] }) {
  const sortedGuests = [...guests].sort((a, b) => {
    if (a.is_primary === b.is_primary) return (a.sort_order || 0) - (b.sort_order || 0);
    return a.is_primary ? -1 : 1;
  });

  const primary = sortedGuests.find((g) => g.is_primary) || sortedGuests[0];
  const companions = primary ? sortedGuests.filter((g) => g !== primary) : [];

  const serviceCharges = (charges || []).filter((line) => line.charge_type !== 'CUSTOM');

  if (!primary) {
    return null;
  }

  const primaryMeta = guestMetaParts(primary);

  return (
    <div className="stay-guest-roster">
      <div className="sd-guest-party">
        <div className="sd-guest-party__primary">
          <div className="sd-guest-party__icon" aria-hidden>
            <User size={18} strokeWidth={2.25} />
          </div>
          <div className="sd-guest-party__main">
            <div className="sd-guest-party__title-row">
              <p className="sd-guest-party__name">{primary.full_name}</p>
              <span className="sd-guest-party__badge">Primary</span>
              {primary.customer && (
                <Link to={`/gh/customers/${primary.customer}`} className="sd-guest-party__link">
                  Profile →
                </Link>
              )}
            </div>
            {primaryMeta.length > 0 && (
              <p className="sd-guest-party__meta">{primaryMeta.join(' · ')}</p>
            )}
          </div>
        </div>

        {companions.length > 0 && (
          <div className="sd-guest-party__others">
            <p className="sd-guest-party__others-label">
              <Users size={12} />
              {companions.length} with stay
            </p>
            {companions.map((guest, index) => {
              const meta = guestMetaParts(guest);
              return (
                <div key={guest.id || `companion-${index}`} className="sd-guest-party__row">
                  <div className="sd-guest-party__row-main">
                    <span className="sd-guest-party__row-name">
                      {guest.full_name}
                      {guest.is_minor && <em className="sd-guest-party__child">Under 18</em>}
                    </span>
                    {meta.length > 0 && (
                      <span className="sd-guest-party__row-meta">{meta.join(' · ')}</span>
                    )}
                  </div>
                  {guest.customer && (
                    <Link to={`/gh/customers/${guest.customer}`} className="sd-guest-party__link sd-guest-party__link--row">
                      Profile
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {serviceCharges.length > 0 && (
        <div className="stay-guest-roster__addons">
          <p className="stay-guest-roster__addons-title">Room add-ons</p>
          <div className="stay-guest-roster__addons-list">
            {serviceCharges.map((line) => (
              <span key={line.id} className="stay-guest-roster__addons-item">
                {line.service_label || line.description}
                <strong>Rs {Number(line.amount || 0).toLocaleString()}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
