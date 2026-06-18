import { Link } from 'react-router-dom';
import './stay-guest-roster.css';

export default function StayGuestRosterDetail({ guests = [], charges = [] }) {
  const sortedGuests = [...guests].sort((a, b) => {
    if (a.is_primary === b.is_primary) return (a.sort_order || 0) - (b.sort_order || 0);
    return a.is_primary ? -1 : 1;
  });

  const serviceCharges = (charges || []).filter((line) => line.charge_type !== 'CUSTOM');

  return (
    <div className="stay-guest-roster">
      <div className="stay-guest-roster__detail-list">
        {sortedGuests.map((guest, index) => (
          <div
            key={guest.id || `guest-${index}`}
            className={`stay-guest-roster__detail-item${guest.is_primary ? ' stay-guest-roster__detail-item--primary' : ''}`}
          >
            <div className="stay-guest-roster__detail-top">
              <h4 className="stay-guest-roster__detail-name">{guest.full_name}</h4>
              <span className={`stay-guest-roster__detail-badge${guest.is_primary ? '' : ' stay-guest-roster__detail-badge--guest'}`}>
                {guest.is_primary ? 'Primary guest' : `Guest ${index + 1}`}
              </span>
            </div>
            <div className="stay-guest-roster__detail-grid">
              <div>
                <span className="stay-guest-roster__detail-label">CNIC / ID</span>
                <span className="stay-guest-roster__detail-value">{guest.cnic || '-'}</span>
              </div>
              <div>
                <span className="stay-guest-roster__detail-label">Phone</span>
                <span className="stay-guest-roster__detail-value">{guest.phone || '-'}</span>
              </div>
            </div>
            {guest.customer && (
              <Link to={`/gh/customers/${guest.customer}`} className="stay-guest-roster__profile-link" style={{ marginTop: 10, display: 'inline-block' }}>
                View profile →
              </Link>
            )}
          </div>
        ))}
      </div>

      {serviceCharges.length > 0 && (
        <div className="card-surface" style={{ padding: 16 }}>
          <h4 className="stay-guest-roster__title" style={{ marginBottom: 10 }}>Room add-ons</h4>
          <div className="stay-guest-roster__detail-grid">
            {serviceCharges.map((line) => (
              <div key={line.id}>
                <span className="stay-guest-roster__detail-label">{line.service_label || line.description}</span>
                <span className="stay-guest-roster__detail-value">Rs {Number(line.amount || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
