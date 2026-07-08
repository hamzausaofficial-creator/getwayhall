import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Users, IdCard, Phone, ScanLine, Plus, X } from 'lucide-react';
import CustomerSearchSelect from '../CustomerSearchSelect';
import CnicScannerPanel from './CnicScannerPanel';
import ScannedGuestPanel from './ScannedGuestPanel';
import { customerDisplayName } from '../../utils/customer';
import { formatCnic } from '../../utils/cnicScanner';
import './stay-guest-roster.css';

const emptyCompanion = (adultsCount = 1, index = 0) => ({
  customer: '',
  full_name: '',
  cnic: '',
  phone: '',
  address: '',
  is_minor: isChildCompanionSlot(index, adultsCount),
});

/** Companion slots after the first (adults_count - 1) are children under 18. */
export function isChildCompanionSlot(index, adultsCount = 1) {
  return index >= Math.max(Number(adultsCount) || 1, 1) - 1;
}

export function companionFromSaved(saved, isMinor) {
  return {
    customer: saved.customer_id ? String(saved.customer_id) : '',
    full_name: saved.full_name || '',
    cnic: saved.cnic || '',
    phone: saved.phone || '',
    address: saved.address || '',
    is_minor: Boolean(isMinor ?? saved.is_minor),
  };
}

export function isCompanionFilled(guest) {
  if (guest?.is_minor) {
    return Boolean((guest?.full_name || '').trim());
  }
  if (guest?.customer) return true;
  return Boolean((guest?.full_name || '').trim() && (guest?.cnic || '').trim());
}

export function getFilledCompanions(companions = []) {
  return (companions || []).filter(isCompanionFilled);
}

/** Primary + each companion with name/CNIC or profile selected */
export function deriveGuestsCount(companions = []) {
  return 1 + getFilledCompanions(companions).length;
}

export function buildGuestRosterPayload(primaryCustomerId, primaryCustomer, companions = []) {
  const roster = [];
  if (primaryCustomerId) {
    roster.push({
      customer: Number(primaryCustomerId),
      full_name: primaryCustomer?.full_name || primaryCustomer?.display_name || '',
      cnic: primaryCustomer?.cnic || '',
      phone: primaryCustomer?.phone || '',
      address: primaryCustomer?.address || '',
      is_minor: false,
      is_primary: true,
    });
  }
  companions
    .filter((guest) => isCompanionFilled(guest))
    .forEach((guest) => {
    roster.push({
      customer: guest.customer ? Number(guest.customer) : null,
      full_name: (guest.full_name || '').trim(),
      cnic: (guest.cnic || '').trim(),
      phone: (guest.phone || '').trim(),
      address: (guest.address || '').trim(),
      is_minor: Boolean(guest.is_minor),
      linked_primary: primaryCustomerId ? Number(primaryCustomerId) : null,
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

export function validateGuestRoster(primaryCustomerId, primaryCustomer, companions = []) {
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
  for (const guest of getFilledCompanions(companions)) {
    const name = (guest.full_name || '').trim();
    const cnic = (guest.cnic || '').trim();
    const address = (guest.address || '').trim();
    const slotIndex = companions.indexOf(guest);
    const label = slotIndex >= 0 ? slotIndex + 1 : 1;
    if (String(guest.customer) === String(primaryCustomerId)) {
      return `Additional guest ${label} cannot be the same as the primary booker.`;
    }
    if (!guest.customer && !name) {
      return `Additional guest ${label}: name is required.`;
    }
    if (guest.is_minor) {
      if (!guest.customer && !address) {
        return `Guest ${label + 1}: address is required for guests under 18.`;
      }
      continue;
    }
    if (!guest.customer && !cnic) {
      return `Guest ${label + 1}: CNIC / ID card is required for guests aged 18+.`;
    }
  }
  const emptySlots = companions.length - getFilledCompanions(companions).length;
  if (emptySlots > 0) {
    return `You have ${emptySlots} empty guest slot${emptySlots !== 1 ? 's' : ''}. Fill details or click Remove.`;
  }
  return '';
}

export default function StayGuestRoster({
  customers,
  primaryCustomerId,
  onPrimaryCustomerChange,
  companions,
  onCompanionsChange,
  maxAdditionalGuests,
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
  hidePrimaryPicker = false,
}) {
  const [activeScanIndex, setActiveScanIndex] = useState(null);
  const totalGuests = deriveGuestsCount(companions);
  const pendingSlots = Math.max(0, companions.length - getFilledCompanions(companions).length);
  const primaryCustomer = customers.find((c) => String(c.id) === String(primaryCustomerId));
  const canAddGuest = maxAdditionalGuests === undefined || companions.length < maxAdditionalGuests;

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

  const addCompanion = () => {
    if (!canAddGuest) return;
    onCompanionsChange([...companions, {
      customer: '',
      full_name: '',
      cnic: '',
      phone: '',
      address: '',
      is_minor: false,
    }]);
  };

  const removeCompanion = (index) => {
    onCompanionsChange(companions.filter((_, i) => i !== index));
  };

  return (
    <div className="stay-guest-roster">
      {!hidePrimaryPicker && (
      <div className="stay-guest-roster__primary card-surface">
        <div className="stay-guest-roster__heading">
          <div className="stay-guest-roster__heading-icon stay-guest-roster__heading-icon--primary">
            <User size={18} />
          </div>
          <div>
            <h4 className="stay-guest-roster__title">Primary guest</h4>
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
            excludeStatuses={['BLOCKLISTED']}
            priorityStatuses={['WHITELISTED']}
            disabled={disabled}
          />
        </div>

        {primaryCustomer && (
          <div className="stay-guest-roster__profile-card stay-guest-roster__profile-card--primary">
            <div className="stay-guest-roster__profile-main">
              <span className="stay-guest-roster__profile-badge">Primary booker</span>
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
      )}

      {hidePrimaryPicker && showIdScanner && (
        <div className="stay-guest-roster__primary card-surface">
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
        </div>
      )}

      <div className="stay-guest-roster__total-bar">
        <div className="stay-guest-roster__total-bar-left">
          <Users size={16} aria-hidden />
          <span>
            <strong>{totalGuests}</strong> guest{totalGuests !== 1 ? 's' : ''} on this stay
            {pendingSlots > 0 && (
              <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>
                {' '}({pendingSlots} slot{pendingSlots !== 1 ? 's' : ''} incomplete)
              </span>
            )}
          </span>
        </div>
        <span className="stay-guest-roster__total-bar-hint">Each guest is charged the same nightly room rate as the primary guest</span>
      </div>

      {companions.length > 0 && (
        <div className="stay-guest-roster__companions">
          <div className="stay-guest-roster__heading">
            <div className="stay-guest-roster__heading-icon">
              <Users size={18} />
            </div>
            <div>
              <h4 className="stay-guest-roster__title">Additional guests</h4>
              <p className="stay-guest-roster__subtitle">
                {companions.length} more guest{companions.length !== 1 ? 's' : ''} — each needs name &amp; CNIC
              </p>
            </div>
          </div>

          {companions.map((guest, index) => (
            <div key={`companion-${index}`} className="stay-guest-roster__companion card-surface">
              <div className="stay-guest-roster__companion-head">
                <span className="stay-guest-roster__companion-badge">Guest {index + 2}</span>
                <div className="stay-guest-roster__companion-actions">
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
                  <button
                    type="button"
                    className="stay-guest-roster__remove-btn"
                    onClick={() => removeCompanion(index)}
                    disabled={disabled}
                    aria-label={`Remove guest ${index + 2}`}
                  >
                    <X size={14} aria-hidden />
                    Remove
                  </button>
                </div>
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
                  customers={customers.filter((c) => String(c.id) !== String(primaryCustomerId))}
                  value={guest.customer}
                  onChange={(customerId) => handleCompanionSelect(index, customerId)}
                  placeholder="Match by name, phone, or CNIC…"
                  excludeStatuses={['BLOCKLISTED']}
                  priorityStatuses={['WHITELISTED']}
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

      <button
        type="button"
        className="stay-guest-roster__add-btn"
        onClick={addCompanion}
        disabled={disabled || !canAddGuest}
      >
        <Plus size={16} aria-hidden />
        Add another guest
      </button>
      {maxAdditionalGuests !== undefined && !canAddGuest && (
        <p className="stay-guest-roster__limit-hint">
          Room capacity reached ({totalGuests} of {maxAdditionalGuests + 1} guests).
        </p>
      )}
    </div>
  );
}
