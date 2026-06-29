import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomerSearchSelect from '../CustomerSearchSelect';
import { createCustomer } from '../../api/customers';
import {
  buildCustomerPayload,
  buildMinorCustomerPayload,
  customerDisplayName,
  validateGhCustomerForm,
  validateMinorGuestForm,
} from '../../utils/customer';
import {
  companionFromSaved,
  isChildCompanionSlot,
  isCompanionFilled,
} from './StayGuestRoster';

const emptyGuest = {
  full_name: '',
  cnic: '',
  phone: '',
  email: '',
  address: '',
};

const makeEmptyCompanion = (adultsCount, index) => ({
  customer: '',
  full_name: '',
  cnic: '',
  phone: '',
  address: '',
  is_minor: isChildCompanionSlot(index, adultsCount),
});

function companionLabel(index, adultsCount) {
  const child = isChildCompanionSlot(index, adultsCount);
  return child ? `Child ${index - Math.max(adultsCount - 1, 0) + 1}` : `Adult guest ${index + 1}`;
}

function companionDisplayName(guest, customers) {
  if (guest.customer) {
    const match = customers.find((c) => String(c.id) === String(guest.customer));
    if (match) return customerDisplayName(match);
  }
  return (guest.full_name || '').trim() || 'Add details';
}

function applySavedCompanions(slots, savedList, adultsCount) {
  if (!savedList?.length || !slots.length) return slots;

  const savedAdults = savedList.filter((row) => !row.is_minor);
  const savedChildren = savedList.filter((row) => row.is_minor);
  let adultIdx = 0;
  let childIdx = 0;

  return slots.map((slot, index) => {
    if (isCompanionFilled(slot)) return slot;
    const childSlot = isChildCompanionSlot(index, adultsCount);
    const source = childSlot ? savedChildren[childIdx++] : savedAdults[adultIdx++];
    if (!source) return { ...slot, is_minor: childSlot };
    return companionFromSaved(source, childSlot);
  });
}

export default function BookFutureGuestBar({
  customers,
  value,
  onChange,
  onCustomerCreated,
  adultsCount = 1,
  childrenCount = 0,
  onAdultsChange,
  onChildrenChange,
  companions = [],
  onCompanionsChange,
  savedTravelCompanions = [],
  disabled = false,
}) {
  const [primaryModalOpen, setPrimaryModalOpen] = useState(false);
  const [companionModalIndex, setCompanionModalIndex] = useState(null);
  const [guestForm, setGuestForm] = useState(emptyGuest);
  const [companionSearchId, setCompanionSearchId] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const lastAutoFillKey = useRef('');

  const totalGuests = Math.max(Number(adultsCount) || 1, 1) + Math.max(Number(childrenCount) || 0, 0);
  const companionsNeeded = Math.max(totalGuests - 1, 0);
  const isChildModal = companionModalIndex !== null
    && isChildCompanionSlot(companionModalIndex, adultsCount);

  const syncCompanionsToCount = (nextAdults, nextChildren, currentCompanions = companions) => {
    const total = Math.max(Number(nextAdults) || 1, 1) + Math.max(Number(nextChildren) || 0, 0);
    const needed = Math.max(total - 1, 0);

    if (needed > currentCompanions.length) {
      const slotsToAdd = needed - currentCompanions.length;
      const added = Array.from({ length: slotsToAdd }, (_, offset) => (
        makeEmptyCompanion(nextAdults, currentCompanions.length + offset)
      ));
      let next = [...currentCompanions, ...added];
      if (value && savedTravelCompanions.length > 0) {
        next = applySavedCompanions(next, savedTravelCompanions, nextAdults);
      }
      onCompanionsChange?.(next);
      const firstNewIndex = currentCompanions.length;
      if (!isCompanionFilled(next[firstNewIndex])) {
        openCompanionModal(firstNewIndex, next);
      }
      return next;
    }

    if (needed < currentCompanions.length) {
      const next = currentCompanions.slice(0, needed);
      onCompanionsChange?.(next);
      if (companionModalIndex !== null && companionModalIndex >= needed) {
        setCompanionModalIndex(null);
      }
      return next;
    }

    return currentCompanions;
  };

  useEffect(() => {
    if (!value || !savedTravelCompanions.length || !companions.length) return;
    const key = `${value}:${companions.length}:${adultsCount}:${childrenCount}`;
    if (lastAutoFillKey.current === key) return;

    const next = applySavedCompanions(companions, savedTravelCompanions, adultsCount);
    const changed = next.some((guest, index) => JSON.stringify(guest) !== JSON.stringify(companions[index]));
    if (changed) {
      onCompanionsChange?.(next);
    }
    lastAutoFillKey.current = key;
  }, [value, savedTravelCompanions, companions, adultsCount, childrenCount, onCompanionsChange]);

  useEffect(() => {
    if (!value) lastAutoFillKey.current = '';
  }, [value]);

  const handleAdultsChange = (nextAdults) => {
    onAdultsChange?.(nextAdults);
    syncCompanionsToCount(nextAdults, childrenCount);
  };

  const handleChildrenChange = (nextChildren) => {
    onChildrenChange?.(nextChildren);
    syncCompanionsToCount(adultsCount, nextChildren);
  };

  const resetForm = () => {
    setGuestForm(emptyGuest);
    setCompanionSearchId('');
    setFormErrors({});
  };

  const openPrimaryModal = () => {
    resetForm();
    setCompanionModalIndex(null);
    setPrimaryModalOpen(true);
  };

  const openCompanionModal = (index, list = companions) => {
    const guest = list[index] || makeEmptyCompanion(adultsCount, index);
    setPrimaryModalOpen(false);
    setCompanionModalIndex(index);
    setCompanionSearchId(guest.customer ? String(guest.customer) : '');
    setGuestForm({
      full_name: guest.full_name || '',
      cnic: guest.cnic || '',
      phone: guest.phone || '',
      email: '',
      address: guest.address || '',
    });
    setFormErrors({});
  };

  const closeModals = () => {
    if (saving) return;
    setPrimaryModalOpen(false);
    setCompanionModalIndex(null);
    resetForm();
  };

  const updateField = (field, val) => {
    setGuestForm((prev) => ({ ...prev, [field]: val }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePrimaryCreate = async (e) => {
    e.preventDefault();
    const errors = validateGhCustomerForm(guestForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      const created = await createCustomer(buildCustomerPayload(guestForm));
      toast.success(`Guest added: ${customerDisplayName(created)}`);
      closeModals();
      onCustomerCreated?.(created);
      onChange(String(created.id));
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const apiErrors = {};
        Object.entries(data).forEach(([key, val]) => {
          apiErrors[key] = Array.isArray(val) ? val[0] : String(val);
        });
        if (Object.keys(apiErrors).length > 0) {
          setFormErrors(apiErrors);
          toast.error(apiErrors[Object.keys(apiErrors)[0]] || 'Could not add guest');
          return;
        }
      }
      toast.error('Could not add guest');
    } finally {
      setSaving(false);
    }
  };

  const saveCompanionSlot = (index, guestData) => {
    const next = companions.map((guest, i) => (i === index ? { ...guest, ...guestData } : guest));
    onCompanionsChange?.(next);

    const nextUnfilled = next.findIndex((guest, i) => i > index && !isCompanionFilled(guest));
    if (nextUnfilled >= 0) {
      openCompanionModal(nextUnfilled, next);
      toast('Add the next guest on this stay', { icon: 'ℹ️' });
    } else {
      closeModals();
    }
  };

  const applySavedGuestToSlot = (saved, index) => {
    const childSlot = isChildCompanionSlot(index, adultsCount);
    if (Boolean(saved.is_minor) !== childSlot) {
      toast.error(childSlot ? 'Select a child under 18 for this slot.' : 'Select an adult guest (18+) for this slot.');
      return;
    }
    saveCompanionSlot(index, companionFromSaved(saved, childSlot));
    toast.success(`${companionLabel(index, adultsCount)} added`);
  };

  const handleCompanionSave = async (e) => {
    e.preventDefault();
    const index = companionModalIndex;
    if (index === null) return;
    const childSlot = isChildCompanionSlot(index, adultsCount);

    if (childSlot) {
      if (companionSearchId) {
        const match = customers.find((c) => String(c.id) === String(companionSearchId));
        if (!match) {
          toast.error('Please select a valid guest.');
          return;
        }
        saveCompanionSlot(index, companionFromSaved({
          customer_id: match.id,
          full_name: match.full_name || customerDisplayName(match),
          cnic: match.cnic,
          phone: match.phone,
          address: match.address,
          is_minor: true,
        }, true));
        toast.success(`${companionLabel(index, adultsCount)} added`);
        return;
      }

      const errors = validateMinorGuestForm(guestForm);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        toast.error('Please enter name and address.');
        return;
      }

      if (!value) {
        toast.error('Select the primary guest first.');
        return;
      }

      setSaving(true);
      try {
        const created = await createCustomer(buildMinorCustomerPayload({
          full_name: guestForm.full_name,
          address: guestForm.address,
          linked_primary: value,
          phone: guestForm.phone,
        }));
        onCustomerCreated?.(created);
        saveCompanionSlot(index, companionFromSaved({
          customer_id: created.id,
          full_name: created.full_name || customerDisplayName(created),
          address: created.address,
          is_minor: true,
        }, true));
        toast.success(`Child profile saved with primary guest`);
      } catch (err) {
        const data = err.response?.data;
        const msg = data?.address?.[0] || data?.full_name?.[0] || data?.detail || 'Could not save child guest';
        toast.error(msg);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (companionSearchId) {
      if (String(companionSearchId) === String(value)) {
        toast.error('Additional guest cannot be the same as the primary guest.');
        return;
      }
      const match = customers.find((c) => String(c.id) === String(companionSearchId));
      if (!match) {
        toast.error('Please select a valid guest.');
        return;
      }
      if (!(match.cnic || '').trim()) {
        toast.error('Adult guest must have CNIC / ID on their profile.');
        return;
      }
      saveCompanionSlot(index, {
        customer: String(match.id),
        full_name: match.full_name || customerDisplayName(match),
        cnic: match.cnic || '',
        phone: match.phone || '',
        address: match.address || '',
        is_minor: false,
      });
      toast.success(`${companionLabel(index, adultsCount)} added: ${customerDisplayName(match)}`);
      return;
    }

    const errors = validateGhCustomerForm(guestForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('CNIC / ID card is required for guests aged 18+.');
      return;
    }

    if (!value) {
      toast.error('Select the primary guest first.');
      return;
    }

    setSaving(true);
    try {
      const created = await createCustomer(buildCustomerPayload({
        ...guestForm,
        linked_primary: value,
      }));
      onCustomerCreated?.(created);
      saveCompanionSlot(index, {
        customer: String(created.id),
        full_name: created.full_name || customerDisplayName(created),
        cnic: created.cnic || '',
        phone: created.phone || '',
        address: created.address || '',
        is_minor: false,
      });
      toast.success(`${companionLabel(index, adultsCount)} saved with primary profile`);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.cnic?.[0] || data?.phone?.[0] || data?.detail || 'Could not save guest';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const removeCompanion = (index) => {
    const next = companions.filter((_, i) => i !== index);
    onCompanionsChange?.(next);

    const currentTotal = Math.max(Number(adultsCount) || 1, 1) + Math.max(Number(childrenCount) || 0, 0);
    const newTotal = 1 + next.length;
    if (currentTotal > newTotal) {
      let adults = Math.max(Number(adultsCount) || 1, 1);
      let children = Math.max(Number(childrenCount) || 0, 0);
      let diff = currentTotal - newTotal;
      while (diff > 0) {
        if (children > 0) {
          children -= 1;
        } else if (adults > 1) {
          adults -= 1;
        }
        diff -= 1;
      }
      onAdultsChange?.(adults);
      onChildrenChange?.(children);
    }

    if (companionModalIndex === index) closeModals();
  };

  const modalOpen = primaryModalOpen || companionModalIndex !== null;
  const isCompanionModal = companionModalIndex !== null;
  const savedAdults = savedTravelCompanions.filter((row) => !row.is_minor);
  const savedChildren = savedTravelCompanions.filter((row) => row.is_minor);

  return (
    <>
      <div className="book-future-party-bar">
        <div className="book-future-party-bar__counts">
          <label className="book-future-party-bar__count">
            <span>18+</span>
            <input
              type="number"
              min={1}
              max={50}
              value={adultsCount}
              onChange={(e) => handleAdultsChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
              disabled={disabled}
              aria-label="Adults aged 18 and above"
            />
          </label>
          <label className="book-future-party-bar__count">
            <span>Under 18</span>
            <input
              type="number"
              min={0}
              max={50}
              value={childrenCount}
              onChange={(e) => handleChildrenChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
              disabled={disabled}
              aria-label="Children under 18"
            />
          </label>
        </div>

        <div className="book-future-party-bar__search">
          <CustomerSearchSelect
            customers={customers}
            value={value}
            onChange={onChange}
            placeholder="Primary guest…"
            disabled={disabled}
          />
        </div>

        <button
          type="button"
          className="book-future-party-bar__add-btn"
          onClick={openPrimaryModal}
          disabled={disabled}
          title="Add new primary guest"
        >
          <UserPlus size={15} aria-hidden />
          <span>Add</span>
        </button>
      </div>

      {value && savedTravelCompanions.length > 0 && (
        <div className="book-future-party-bar__saved">
          <span className="book-future-party-bar__saved-label">Guests who stayed with this customer</span>
          <div className="book-future-party-bar__saved-list">
            {savedTravelCompanions.map((saved) => (
              <span
                key={`${saved.customer_id || saved.full_name}-${saved.is_minor ? 'c' : 'a'}`}
                className={`book-future-party-bar__saved-chip${saved.is_minor ? ' book-future-party-bar__saved-chip--child' : ''}`}
                title={saved.is_minor ? 'Under 18' : '18+ with ID'}
              >
                {saved.full_name}
                {saved.is_minor ? ' (child)' : saved.cnic ? ` · ${saved.cnic}` : ''}
                {saved.stays_together > 1 ? ` · ${saved.stays_together} stays` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {companions.length > 0 && (
        <div className="book-future-party-bar__companions">
          <span className="book-future-party-bar__companions-label">
            <Users size={13} aria-hidden />
            With primary
          </span>
          {companions.map((guest, index) => (
            <div
              key={`companion-chip-${index}`}
              className={`book-future-party-bar__companion-chip${isCompanionFilled(guest) ? ' book-future-party-bar__companion-chip--filled' : ''}${guest.is_minor ? ' book-future-party-bar__companion-chip--child' : ''}`}
            >
              <button
                type="button"
                className="book-future-party-bar__companion-chip-btn"
                onClick={() => openCompanionModal(index)}
                disabled={disabled}
              >
                {companionLabel(index, adultsCount)}: {companionDisplayName(guest, customers)}
              </button>
              <button
                type="button"
                className="book-future-party-bar__companion-remove"
                onClick={() => removeCompanion(index)}
                disabled={disabled}
                aria-label={`Remove ${companionLabel(index, adultsCount)}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {companionsNeeded > companions.length && (
        <p className="book-future-party-bar__hint">
          {companionsNeeded - companions.length} more guest{companionsNeeded - companions.length !== 1 ? 's' : ''} needed — increase count to add details.
        </p>
      )}

      {modalOpen && createPortal(
        <div className="book-future-guest-modal-backdrop" onClick={closeModals}>
          <div
            className="book-future-guest-modal card modal-panel modal-panel--sm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-future-guest-modal-title"
          >
            <div className="book-future-guest-modal__head">
              <h3 id="book-future-guest-modal-title">
                {isCompanionModal
                  ? (isChildModal
                    ? `Add child under 18 (${companionLabel(companionModalIndex, adultsCount)})`
                    : `Add adult guest 18+ (${companionLabel(companionModalIndex, adultsCount)})`)
                  : 'Add new primary guest'}
              </h3>
              <button type="button" onClick={closeModals} disabled={saving} aria-label="Close">
                <X size={22} />
              </button>
            </div>

            {isCompanionModal ? (
              <form onSubmit={handleCompanionSave} className="book-future-guest-modal__form" noValidate>
                {isChildModal ? (
                  <>
                    {(savedChildren.length > 0 || companionSearchId) && (
                      <div className="input-group">
                        <label>Previously stayed with primary</label>
                        <select
                          value={companionSearchId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setCompanionSearchId(id);
                            const match = savedChildren.find((row) => String(row.customer_id) === id)
                              || customers.find((c) => String(c.id) === id);
                            if (match) {
                              setGuestForm({
                                full_name: match.full_name || '',
                                cnic: '',
                                phone: match.phone || '',
                                email: '',
                                address: match.address || '',
                              });
                            }
                          }}
                          disabled={disabled || saving}
                        >
                          <option value="">Select saved child…</option>
                          {savedChildren.map((row) => (
                            <option key={row.customer_id || row.full_name} value={row.customer_id || ''}>
                              {row.full_name}{row.address ? ` — ${row.address}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="input-group">
                      <label>Full name <span className="req">*</span></label>
                      <input
                        autoFocus
                        value={guestForm.full_name}
                        onChange={(e) => {
                          updateField('full_name', e.target.value);
                          setCompanionSearchId('');
                        }}
                        placeholder="Child full name"
                        aria-invalid={!!formErrors.full_name}
                      />
                      {formErrors.full_name && <p className="field-error">{formErrors.full_name}</p>}
                    </div>
                    <div className="input-group">
                      <label>Address <span className="req">*</span></label>
                      <textarea
                        rows={2}
                        value={guestForm.address}
                        onChange={(e) => {
                          updateField('address', e.target.value);
                          setCompanionSearchId('');
                        }}
                        placeholder="Home address"
                        aria-invalid={!!formErrors.address}
                      />
                      {formErrors.address && <p className="field-error">{formErrors.address}</p>}
                    </div>
                    <p className="book-future-guest-modal__note">No ID card needed for guests under 18.</p>
                  </>
                ) : (
                  <>
                    <div className="input-group">
                      <label>Search existing guest (CNIC required)</label>
                      <CustomerSearchSelect
                        customers={customers.filter((c) => String(c.id) !== String(value) && (c.cnic || '').trim())}
                        value={companionSearchId}
                        onChange={(customerId) => {
                          setCompanionSearchId(customerId);
                          const match = customers.find((c) => String(c.id) === String(customerId));
                          if (match) {
                            setGuestForm({
                              full_name: match.full_name || customerDisplayName(match),
                              cnic: match.cnic || '',
                              phone: match.phone || '',
                              email: match.email || '',
                              address: match.address || '',
                            });
                          }
                        }}
                        placeholder="Name, phone, or CNIC…"
                        disabled={disabled || saving}
                      />
                    </div>

                    {savedAdults.length > 0 && (
                      <div className="book-future-party-bar__saved-pick">
                        <span className="book-future-party-bar__saved-label">Or pick from past stays</span>
                        <div className="book-future-party-bar__saved-list">
                          {savedAdults.map((saved) => (
                            <button
                              key={saved.customer_id || saved.cnic || saved.full_name}
                              type="button"
                              className="book-future-party-bar__saved-chip book-future-party-bar__saved-chip--btn"
                              onClick={() => applySavedGuestToSlot(saved, companionModalIndex)}
                              disabled={disabled || saving}
                            >
                              {saved.full_name}{saved.cnic ? ` · ${saved.cnic}` : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="book-future-guest-modal__divider">Or add new adult guest</p>

                    <div className="form-grid-2">
                      <div className="input-group">
                        <label>Full name <span className="req">*</span></label>
                        <input
                          value={guestForm.full_name}
                          onChange={(e) => {
                            updateField('full_name', e.target.value);
                            setCompanionSearchId('');
                          }}
                          placeholder="Guest full name"
                          aria-invalid={!!formErrors.full_name}
                        />
                        {formErrors.full_name && <p className="field-error">{formErrors.full_name}</p>}
                      </div>
                      <div className="input-group">
                        <label>CNIC / ID <span className="req">*</span></label>
                        <input
                          value={guestForm.cnic}
                          onChange={(e) => {
                            updateField('cnic', e.target.value);
                            setCompanionSearchId('');
                          }}
                          placeholder="35202-1234567-9"
                          style={{ fontFamily: 'monospace' }}
                          aria-invalid={!!formErrors.cnic}
                        />
                        {formErrors.cnic && <p className="field-error">{formErrors.cnic}</p>}
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Phone <span className="req">*</span></label>
                      <input
                        value={guestForm.phone}
                        onChange={(e) => {
                          updateField('phone', e.target.value);
                          setCompanionSearchId('');
                        }}
                        placeholder="0300 1234567"
                        aria-invalid={!!formErrors.phone}
                      />
                      {formErrors.phone && <p className="field-error">{formErrors.phone}</p>}
                    </div>
                  </>
                )}

                <div className="book-future-guest-modal__actions">
                  <button type="button" className="btn-secondary" onClick={closeModals} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : `Save ${companionLabel(companionModalIndex, adultsCount)}`}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePrimaryCreate} className="book-future-guest-modal__form" noValidate>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label>Full name <span className="req">*</span></label>
                    <input
                      autoFocus
                      value={guestForm.full_name}
                      onChange={(e) => updateField('full_name', e.target.value)}
                      placeholder="Guest full name"
                      aria-invalid={!!formErrors.full_name}
                    />
                    {formErrors.full_name && <p className="field-error">{formErrors.full_name}</p>}
                  </div>
                  <div className="input-group">
                    <label>CNIC / ID <span className="req">*</span></label>
                    <input
                      value={guestForm.cnic}
                      onChange={(e) => updateField('cnic', e.target.value)}
                      placeholder="35202-1234567-9"
                      style={{ fontFamily: 'monospace' }}
                      aria-invalid={!!formErrors.cnic}
                    />
                    {formErrors.cnic && <p className="field-error">{formErrors.cnic}</p>}
                  </div>
                </div>
                <div className="input-group">
                  <label>Phone <span className="req">*</span></label>
                  <input
                    value={guestForm.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="0300 1234567"
                    aria-invalid={!!formErrors.phone}
                  />
                  {formErrors.phone && <p className="field-error">{formErrors.phone}</p>}
                </div>
                <div className="input-group">
                  <label>Email <span className="opt">(optional)</span></label>
                  <input
                    type="email"
                    value={guestForm.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    aria-invalid={!!formErrors.email}
                  />
                  {formErrors.email && <p className="field-error">{formErrors.email}</p>}
                </div>
                <div className="book-future-guest-modal__actions">
                  <button type="button" className="btn-secondary" onClick={closeModals} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save guest'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
