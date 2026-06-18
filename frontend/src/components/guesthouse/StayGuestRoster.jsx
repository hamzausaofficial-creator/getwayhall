import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Users, IdCard, Phone, ScanLine } from 'lucide-react';
import CustomerSearchSelect from '../CustomerSearchSelect';
import CnicScannerPanel from './CnicScannerPanel';
import ScannedGuestPanel from './ScannedGuestPanel';
import { customerDisplayName } from '../../utils/customer';
import { formatCnic } from '../../utils/cnicScanner';
import './stay-guest-roster.css';

const emptyCompanion = () => ({
  customer: '',
  full_name: '',
  cnic: '',
  phone: '',
});

export function buildGuestRosterPayload(primaryCustomerId, primaryCustomer, companions = []) {
  const roster = [];
  if (primaryCustomerId) {
    roster.push({
      customer: Number(primaryCustomerId),
      full_name: primaryCustomer?.full_name || primaryCustomer?.display_name || '',
      cnic: primaryCustomer?.cnic || '',
      phone: primaryCustomer?.phone || '',
      is_primary: true,
    });
  }
  companions
    .filter((guest) => guest.customer || (guest.full_name || '').trim() || (guest.cnic || '').trim())
    .forEach((guest) => {
    roster.push({
      customer: guest.customer ? Number(guest.customer) : null,
      full_name: (guest.full_name || '').trim(),
      cnic: (guest.cnic || '').trim(),
      phone: (guest.phone || '').trim(),
      is_primary: false,
    });
  });
  return roster;
}

/** Omit guest_roster for single-guest stays — backend creates primary from `customer`. */
export function shouldSendGuestRoster(guestsCount, companions = []) {
  const count = Number(guestsCount) || 1;
  if (count > 1) return true;
  return companions.some(
    (guest) => guest.customer || (guest.full_name || '').trim() || (guest.cnic || '').trim(),
  );
}

export function validateGuestRoster(primaryCustomerId, primaryCustomer, companions = [], guestsCount = 1) {
  if (!primaryCustomerId) {
    return 'Please select the primary guest who is making this booking.';
  }
  const primaryCnic = (primaryCustomer?.cnic || '').trim();
  if (!primaryCnic && !primaryCustomer?.id) {
    return 'Primary guest CNIC is required.';
  }
  if (!primaryCnic && primaryCustomer?.id) {
    return 'Primary guest profile is missing CNIC. Update the guest profile or scan ID card.';
  }
  const expectedCompanions = Math.max(0, Number(guestsCount) || 1) - 1;
  for (let i = 0; i < expectedCompanions; i += 1) {
    const guest = companions[i] || {};
    const name = (guest.full_name || '').trim();
    const cnic = (guest.cnic || '').trim();
    if (!guest.customer && !name) {
      return `Additional guest ${i + 1}: name is required.`;
    }
    if (!guest.customer && !cnic) {
      return `Additional guest ${i + 1}: CNIC is required.`;
    }
  }
  return '';
}

export default function StayGuestRoster({
  guestsCount,
  customers,
  primaryCustomerId,
  onPrimaryCustomerChange,
  companions,
  onCompanionsChange,
  showIdScanner = false,
  onIdScanPrimary,
  onIdScanCompanion,
  scanProcessing = false,
  scannedGuest,
  onScannedGuestChange,
  onScannedPhoneChange,
  onSaveScannedGuest,
  onCancelScannedGuest,
  savingScannedGuest = false,
  disabled = false,
}) {
  const [activeScanIndex, setActiveScanIndex] = useState(null);
  const companionCount = Math.max(0, Number(guestsCount) || 1) - 1;
  const primaryCustomer = customers.find((c) => String(c.id) === String(primaryCustomerId));

  useEffect(() => {
    const needed = Math.max(0, Number(guestsCount) || 1) - 1;
    if (companions.length === needed) return;
    const next = [...companions];
    while (next.length < needed) next.push(emptyCompanion());
    onCompanionsChange(next.slice(0, needed));
  }, [guestsCount, companions, onCompanionsChange]);

  const updateCompanion = (index, patch) => {
    onCompanionsChange(
      companions.map((guest, i) => (i === index ? { ...guest, ...patch } : guest)),
    );
  };

  const handleCompanionSelect = (index, customerId) => {
    const customer = customers.find((c) => String(c.id) === String(customerId));
    updateCompanion(index, {
      customer: customerId,
      full_name: customer?.full_name || customerDisplayName(customer) || '',
      cnic: customer?.cnic || '',
      phone: customer?.phone || '',
    });
  };

  return (
    <div className="stay-guest-roster">
      <div className="stay-guest-roster__primary card-surface">
        <div className="stay-guest-roster__heading">
          <div className="stay-guest-roster__heading-icon stay-guest-roster__heading-icon--primary">
            <User size={18} />
          </div>
          <div>
            <h4 className="stay-guest-roster__title">Primary guest</h4>
            <p className="stay-guest-roster__subtitle">Person making the booking — shown first on stay details</p>
          </div>
        </div>

        {showIdScanner && (
          <>
            <CnicScannerPanel
              onScan={(parsed) => {
                setActiveScanIndex('primary');
                onIdScanPrimary?.(parsed);
              }}
              disabled={disabled || scanProcessing}
            />
            {activeScanIndex === 'primary' && (
              <ScannedGuestPanel
                draft={scannedGuest}
                loading={scanProcessing && !scannedGuest}
                saving={savingScannedGuest}
                onChange={(field, value) => onScannedGuestChange?.(field, value)}
                onPhoneChange={onScannedPhoneChange}
                onSave={onSaveScannedGuest}
                onCancel={() => {
                  setActiveScanIndex(null);
                  onCancelScannedGuest?.();
                }}
              />
            )}
          </>
        )}

        <div className="input-group">
          <label>Search primary guest</label>
          <CustomerSearchSelect
            customers={customers}
            value={primaryCustomerId}
            onChange={(customerId) => {
              onPrimaryCustomerChange(customerId);
              if (customerId) setActiveScanIndex(null);
            }}
            placeholder="Name, phone, or CNIC…"
            disabled={disabled}
          />
        </div>

        {primaryCustomer && (
          <div className="stay-guest-roster__profile-card">
            <div className="stay-guest-roster__profile-main">
              <p className="stay-guest-roster__profile-name">{customerDisplayName(primaryCustomer)}</p>
              <p className="stay-guest-roster__profile-meta">
                <IdCard size={14} aria-hidden />
                {primaryCustomer.cnic || 'CNIC not set'}
              </p>
              <p className="stay-guest-roster__profile-meta">
                <Phone size={14} aria-hidden />
                {primaryCustomer.phone || '-'}
              </p>
            </div>
            <Link to={`/gh/customers/${primaryCustomer.id}`} className="stay-guest-roster__profile-link">
              View profile
            </Link>
          </div>
        )}
      </div>

      {companionCount > 0 && (
        <div className="stay-guest-roster__companions">
          <div className="stay-guest-roster__heading">
            <div className="stay-guest-roster__heading-icon">
              <Users size={18} />
            </div>
            <div>
              <h4 className="stay-guest-roster__title">Additional guests</h4>
              <p className="stay-guest-roster__subtitle">
                {companionCount} more guest{companionCount !== 1 ? 's' : ''} staying in the room — ID details for each person
              </p>
            </div>
          </div>

          {companions.map((guest, index) => (
            <div key={`companion-${index}`} className="stay-guest-roster__companion card-surface">
              <div className="stay-guest-roster__companion-head">
                <span className="stay-guest-roster__companion-badge">Guest {index + 2}</span>
                {showIdScanner && (
                  <button
                    type="button"
                    className="stay-guest-roster__scan-btn"
                    onClick={() => setActiveScanIndex(index)}
                    disabled={disabled || scanProcessing}
                  >
                    <ScanLine size={14} aria-hidden />
                    Scan ID
                  </button>
                )}
              </div>

              {showIdScanner && activeScanIndex === index && (
                <CnicScannerPanel
                  onScan={(parsed) => onIdScanCompanion?.(index, parsed)}
                  disabled={disabled || scanProcessing}
                />
              )}

              <div className="input-group">
                <label>Search existing guest (optional)</label>
                <CustomerSearchSelect
                  customers={customers}
                  value={guest.customer}
                  onChange={(customerId) => handleCompanionSelect(index, customerId)}
                  placeholder="Match by name, phone, or CNIC…"
                  disabled={disabled}
                />
              </div>

              <div className="form-grid-2 form-grid-2--gap-16">
                <div className="input-group">
                  <label>Full name</label>
                  <input
                    value={guest.full_name}
                    onChange={(e) => updateCompanion(index, { full_name: e.target.value, customer: '' })}
                    placeholder="Guest full name"
                    disabled={disabled}
                  />
                </div>
                <div className="input-group">
                  <label>CNIC / ID</label>
                  <input
                    value={guest.cnic}
                    onChange={(e) => updateCompanion(index, { cnic: formatCnic(e.target.value), customer: '' })}
                    placeholder="35202-1234567-1"
                    disabled={disabled}
                  />
                </div>
                <div className="input-group">
                  <label>Phone (optional)</label>
                  <input
                    value={guest.phone}
                    onChange={(e) => updateCompanion(index, { phone: e.target.value, customer: '' })}
                    placeholder="03xx-xxxxxxx"
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
