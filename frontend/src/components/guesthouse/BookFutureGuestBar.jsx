import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomerSearchSelect from '../CustomerSearchSelect';
import { createCustomer } from '../../api/customers';
import {
  buildCustomerPayload,
  buildMinorCustomerPayload,
  customerDisplayName,
  FEMALE_RELATION_OPTIONS,
  GENDER_OPTIONS,
  relativeFieldLabel,
  validateGhCustomerForm,
  validateUnder3GuestForm,
} from '../../utils/customer';
import { formatPakPhone, PAK_PHONE_INPUT_MAX_LENGTH, PAK_PHONE_PLACEHOLDER } from '../../utils/phone';
import {
  CNIC_INPUT_MAX_LENGTH,
  CNIC_PLACEHOLDER,
  formatCnicInput,
} from '../../utils/cnicScanner';
import {
  buildPartyCompanionSlots,
  companionFromSaved,
  getPrimaryGuestGender,
  isCompanionFilled,
} from './StayGuestRoster';

const emptyGuest = {
  full_name: '',
  cnic: '',
  phone: '',
  email: '',
  gender: '',
  relative_relation: '',
  relative_name: '',
  address: '',
};

function partyAdultsCount(malesCount, femalesCount) {
  return Math.max((Number(malesCount) || 0) + (Number(femalesCount) || 0), 1);
}

function companionLabel(guest, subIndex = 0) {
  if (guest?.is_minor) return `Child ${subIndex + 1}`;
  if (guest?.gender === 'FEMALE') return `Female ${subIndex + 1}`;
  if (guest?.gender === 'MALE') return `Male ${subIndex + 1}`;
  return `Guest ${subIndex + 1}`;
}

function groupCompanions(companions = []) {
  const males = [];
  const females = [];
  const under3 = [];
  companions.forEach((guest, index) => {
    if (guest.is_minor) under3.push({ guest, index });
    else if (guest.gender === 'FEMALE') females.push({ guest, index });
    else males.push({ guest, index });
  });
  return { males, females, under3 };
}

function companionDisplayName(guest, primaryCustomers, savedTravelCompanions = []) {
  if (guest?.is_minor) {
    const childName = (guest.full_name || '').trim();
    if (childName) return childName;
    if (guest.customer) {
      const fromPrimary = primaryCustomers.find((c) => String(c.id) === String(guest.customer));
      if (fromPrimary) return customerDisplayName(fromPrimary);
      const fromSaved = savedTravelCompanions.find(
        (c) => String(c.customer_id) === String(guest.customer),
      );
      if (fromSaved?.full_name) return fromSaved.full_name;
    }
    if ((guest.relative_name || '').trim()) {
      return `Father: ${guest.relative_name.trim()}`;
    }
    return 'Add details';
  }
  if (guest.customer) {
    const fromPrimary = primaryCustomers.find((c) => String(c.id) === String(guest.customer));
    if (fromPrimary) return customerDisplayName(fromPrimary);
    const fromSaved = savedTravelCompanions.find(
      (c) => String(c.customer_id) === String(guest.customer),
    );
    if (fromSaved?.full_name) return fromSaved.full_name;
  }
  return (guest.full_name || '').trim() || 'Add details';
}

function savedGuestMatchesCompanion(saved, guest) {
  if (saved.customer_id && guest.customer) {
    return String(guest.customer) === String(saved.customer_id);
  }
  return (guest.full_name || '').trim().toLowerCase() === (saved.full_name || '').trim().toLowerCase()
    && Boolean(guest.is_minor) === Boolean(saved.is_minor);
}

function savedGuestKey(saved) {
  return `${saved.customer_id || saved.full_name}-${saved.is_minor ? 'c' : 'a'}`;
}

function renderCompanionChip(guest, index, subIndex, {
  disabled,
  onOpen,
  onRemove,
  customers,
  savedTravelCompanions,
}) {
  return (
    <div
      key={`companion-chip-${index}`}
      className={`book-future-party-bar__companion-chip${isCompanionFilled(guest) ? ' book-future-party-bar__companion-chip--filled' : ''}${guest.is_minor ? ' book-future-party-bar__companion-chip--child' : ''}${guest.gender === 'FEMALE' ? ' book-future-party-bar__companion-chip--female' : ''}${guest.gender === 'MALE' ? ' book-future-party-bar__companion-chip--male' : ''}`}
    >
      <button
        type="button"
        className="book-future-party-bar__companion-chip-btn"
        onClick={() => onOpen(index)}
        disabled={disabled}
      >
        {companionLabel(guest, subIndex)}: {companionDisplayName(guest, customers, savedTravelCompanions)}
      </button>
      <button
        type="button"
        className="book-future-party-bar__companion-remove"
        onClick={() => onRemove(index)}
        disabled={disabled}
        aria-label={`Remove ${companionLabel(guest, subIndex)}`}
      >
        <X size={12} />
      </button>
    </div>
  );
}

function applySavedCompanions(slots, savedList) {
  if (!savedList?.length || !slots.length) return slots;

  const savedMales = savedList.filter(
    (row) => !row.is_minor && (row.gender || 'MALE').toUpperCase() === 'MALE',
  );
  const savedFemales = savedList.filter(
    (row) => !row.is_minor && (row.gender || '').toUpperCase() === 'FEMALE',
  );
  const savedChildren = savedList.filter((row) => row.is_minor);
  let maleIdx = 0;
  let femaleIdx = 0;
  let childIdx = 0;

  return slots.map((slot) => {
    if (isCompanionFilled(slot)) return slot;
    if (slot.is_minor) {
      const source = savedChildren[childIdx++];
      if (!source) return slot;
      return { ...companionFromSaved(source, true), gender: slot.gender || source.gender || '' };
    }
    if (slot.gender === 'FEMALE') {
      const source = savedFemales[femaleIdx++];
      if (!source) return slot;
      return { ...companionFromSaved(source, false), gender: 'FEMALE' };
    }
    const source = savedMales[maleIdx++];
    if (!source) return slot;
    return { ...companionFromSaved(source, false), gender: 'MALE' };
  });
}

export default function BookFutureGuestBar({
  customers,
  value,
  onChange,
  onCustomerCreated,
  malesCount = 1,
  femalesCount = 0,
  under3Count = 0,
  onMalesChange,
  onFemalesChange,
  onUnder3Change,
  companions = [],
  onCompanionsChange,
  savedTravelCompanions = [],
  disabled = false,
}) {
  const [primaryModalOpen, setPrimaryModalOpen] = useState(false);
  const [companionModalIndex, setCompanionModalIndex] = useState(null);
  const [guestForm, setGuestForm] = useState(emptyGuest);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const lastAutoFillKey = useRef('');
  const prevPrimaryGenderRef = useRef('');

  const primaryCustomer = useMemo(
    () => customers.find((c) => String(c.id) === String(value)),
    [customers, value],
  );
  const primaryGender = useMemo(
    () => getPrimaryGuestGender(primaryCustomer, malesCount, femalesCount),
    [primaryCustomer, malesCount, femalesCount],
  );

  const adultsCount = partyAdultsCount(malesCount, femalesCount);
  const childrenCount = Math.max(Number(under3Count) || 0, 0);
  const totalGuests = adultsCount + childrenCount;
  const companionsNeeded = Math.max(totalGuests - 1, 0);
  const companionGroups = useMemo(() => groupCompanions(companions), [companions]);
  const activeCompanion = companionModalIndex !== null
    ? (companions[companionModalIndex] || null)
    : null;
  const isChildModal = companionModalIndex !== null && Boolean(activeCompanion?.is_minor);
  const slotGender = activeCompanion?.is_minor
    ? ''
    : (activeCompanion?.gender || 'MALE').toUpperCase();

  const syncCompanionsToCount = (
    nextMales,
    nextFemales,
    nextUnder3,
    currentCompanions = companions,
    pg = primaryGender,
    openPreference = null,
  ) => {
    const nextSlots = buildPartyCompanionSlots(nextMales, nextFemales, nextUnder3, pg);

    const filledMales = currentCompanions.filter(
      (g) => !g.is_minor && g.gender === 'MALE' && isCompanionFilled(g),
    );
    const filledFemales = currentCompanions.filter(
      (g) => !g.is_minor && g.gender === 'FEMALE' && isCompanionFilled(g),
    );
    const filledChildren = currentCompanions.filter(
      (g) => g.is_minor && isCompanionFilled(g),
    );
    let malePtr = 0;
    let femalePtr = 0;
    let childPtr = 0;

    let next = nextSlots.map((slot) => {
      if (slot.is_minor) {
        const filled = filledChildren[childPtr++];
        return filled ? { ...slot, ...filled, is_minor: true } : slot;
      }
      if (slot.gender === 'FEMALE') {
        const filled = filledFemales[femalePtr++];
        return filled
          ? { ...slot, ...filled, is_minor: false, gender: 'FEMALE' }
          : slot;
      }
      const filled = filledMales[malePtr++];
      return filled
        ? { ...slot, ...filled, is_minor: false, gender: 'MALE' }
        : slot;
    });

    if (value && savedTravelCompanions.length > 0) {
      next = applySavedCompanions(next, savedTravelCompanions);
    }

    onCompanionsChange?.(next);

    let firstEmpty = -1;
    if (openPreference === 'MALE') {
      firstEmpty = next.findIndex(
        (g) => !g.is_minor && g.gender === 'MALE' && !isCompanionFilled(g),
      );
    } else if (openPreference === 'FEMALE') {
      firstEmpty = next.findIndex(
        (g) => !g.is_minor && g.gender === 'FEMALE' && !isCompanionFilled(g),
      );
    } else if (openPreference === 'under3') {
      firstEmpty = next.findIndex((g) => g.is_minor && !isCompanionFilled(g));
    } else {
      firstEmpty = next.findIndex((g) => !isCompanionFilled(g));
    }
    if (firstEmpty >= 0 && next.length > currentCompanions.length) {
      openCompanionModal(firstEmpty, next);
    }
    if (companionModalIndex !== null && companionModalIndex >= next.length) {
      setCompanionModalIndex(null);
    }
    return next;
  };

  useEffect(() => {
    if (!value || !savedTravelCompanions.length || !companions.length) return;
    const key = `${value}:${companions.length}:${malesCount}:${femalesCount}:${under3Count}`;
    if (lastAutoFillKey.current === key) return;

    const next = applySavedCompanions(companions, savedTravelCompanions);
    const changed = next.some((guest, index) => JSON.stringify(guest) !== JSON.stringify(companions[index]));
    if (changed) {
      onCompanionsChange?.(next);
    }
    lastAutoFillKey.current = key;
  }, [value, savedTravelCompanions, companions, malesCount, femalesCount, under3Count, onCompanionsChange]);

  useEffect(() => {
    if (!value || prevPrimaryGenderRef.current === primaryGender) {
      prevPrimaryGenderRef.current = primaryGender;
      return;
    }
    prevPrimaryGenderRef.current = primaryGender;
    syncCompanionsToCount(malesCount, femalesCount, under3Count, companions, primaryGender);
  }, [primaryGender, value]);

  useEffect(() => {
    if (!value) lastAutoFillKey.current = '';
  }, [value]);

  const clampAdults = (males, females) => {
    let nextMales = Math.max(Number(males) || 0, 0);
    let nextFemales = Math.max(Number(females) || 0, 0);
    if (nextMales + nextFemales < 1) nextMales = 1;
    return { nextMales, nextFemales };
  };

  const handleMalesChange = (raw) => {
    const { nextMales, nextFemales } = clampAdults(raw, femalesCount);
    onMalesChange?.(nextMales);
    if (nextFemales !== femalesCount) onFemalesChange?.(nextFemales);
    syncCompanionsToCount(nextMales, nextFemales, under3Count, companions, primaryGender, 'MALE');
  };

  const handleFemalesChange = (raw) => {
    const { nextMales, nextFemales } = clampAdults(malesCount, raw);
    onFemalesChange?.(nextFemales);
    if (nextMales !== malesCount) onMalesChange?.(nextMales);
    syncCompanionsToCount(nextMales, nextFemales, under3Count, companions, primaryGender, 'FEMALE');
  };

  const handleUnder3Change = (raw) => {
    const next = Math.max(Number(raw) || 0, 0);
    onUnder3Change?.(next);
    syncCompanionsToCount(malesCount, femalesCount, next, companions, primaryGender, 'under3');
  };

  const resetForm = () => {
    setGuestForm(emptyGuest);
    setFormErrors({});
  };

  const openPrimaryModal = () => {
    resetForm();
    setCompanionModalIndex(null);
    setPrimaryModalOpen(true);
  };

  const openCompanionModal = (index, list = companions) => {
    const guest = list[index] || buildPartyCompanionSlots(
      malesCount,
      femalesCount,
      under3Count,
      primaryGender,
    )[index] || {
      ...emptyGuest,
      gender: 'MALE',
      is_minor: false,
    };
    const lockedGender = guest.is_minor ? '' : (guest.gender || 'MALE').toUpperCase();
    setPrimaryModalOpen(false);
    setCompanionModalIndex(index);
    setGuestForm({
      full_name: guest.full_name || '',
      cnic: formatCnicInput(guest.cnic || ''),
      phone: formatPakPhone(guest.phone || ''),
      email: '',
      gender: lockedGender || (guest.is_minor ? '' : 'MALE'),
      relative_relation: guest.relative_relation
        || (lockedGender === 'MALE' ? 'FATHER' : '')
        || (guest.is_minor ? 'FATHER' : ''),
      relative_name: guest.relative_name || '',
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
    setGuestForm((prev) => {
      if (field === 'gender') {
        return {
          ...prev,
          gender: val,
          relative_relation: val === 'MALE' ? 'FATHER' : '',
          relative_name: prev.relative_name,
        };
      }
      return { ...prev, [field]: val };
    });
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        if (field === 'gender') {
          delete next.relative_relation;
          delete next.relative_name;
        }
        return next;
      });
    }
  };

  const handlePrimaryCreate = async (e) => {
    e.preventDefault();
    const errors = validateGhCustomerForm(guestForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(Object.values(errors)[0]);
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

  const saveCompanionSlot = (index, guestData, { silent = false } = {}) => {
    const next = companions.map((guest, i) => (i === index ? { ...guest, ...guestData } : guest));
    onCompanionsChange?.(next);

    if (silent) return;

    const nextUnfilled = next.findIndex((guest, i) => i > index && !isCompanionFilled(guest));
    if (nextUnfilled >= 0) {
      openCompanionModal(nextUnfilled, next);
      toast('Add the next guest on this stay', { icon: 'ℹ️' });
    } else {
      closeModals();
    }
  };

  const isSavedGuestSelected = (saved) => (
    companions.some((guest) => savedGuestMatchesCompanion(saved, guest))
  );

  const toggleSavedGuest = (saved) => {
    if (disabled) return;

    const selectedIndex = companions.findIndex((guest) => savedGuestMatchesCompanion(saved, guest));
    if (selectedIndex >= 0) {
      removeCompanion(selectedIndex);
      toast(`${saved.full_name} removed from this stay`, { icon: 'ℹ️' });
      return;
    }

    const childSlot = Boolean(saved.is_minor);
    let nextMales = Math.max(Number(malesCount) || 0, 0);
    let nextFemales = Math.max(Number(femalesCount) || 0, 0);
    let nextUnder3 = Math.max(Number(under3Count) || 0, 0);
    let nextCompanions = [...companions];
    const savedGender = (saved.gender || 'MALE').toUpperCase();

    let slotIndex = nextCompanions.findIndex(
      (guest) => !isCompanionFilled(guest)
        && Boolean(guest.is_minor) === childSlot
        && (childSlot || (guest.gender || 'MALE').toUpperCase() === savedGender),
    );

    if (slotIndex < 0) {
      if (childSlot) {
        nextUnder3 += 1;
      } else if (savedGender === 'FEMALE') {
        nextFemales += 1;
      } else {
        nextMales += 1;
      }
      nextCompanions = buildPartyCompanionSlots(
        nextMales,
        nextFemales,
        nextUnder3,
        primaryGender,
      ).map((slot, index) => (
        companions[index] && isCompanionFilled(companions[index])
          ? { ...slot, ...companions[index], gender: companions[index].gender || slot.gender }
          : slot
      ));
      slotIndex = nextCompanions.findIndex(
        (guest) => !isCompanionFilled(guest)
          && Boolean(guest.is_minor) === childSlot
          && (childSlot || (guest.gender || 'MALE').toUpperCase() === savedGender),
      );
      onMalesChange?.(nextMales);
      onFemalesChange?.(nextFemales);
      onUnder3Change?.(nextUnder3);
    }

    if (slotIndex < 0) {
      toast.error('Could not add guest to this stay.');
      return;
    }

    nextCompanions = nextCompanions.map((guest, index) => (
      index === slotIndex
        ? {
          ...guest,
          ...companionFromSaved(saved, childSlot),
          gender: guest.gender || saved.gender || '',
        }
        : guest
    ));
    onCompanionsChange?.(nextCompanions);
    toast.success(`${saved.full_name} added to this stay`);
  };

  const handleCompanionSave = async (e) => {
    e.preventDefault();
    const index = companionModalIndex;
    if (index === null) return;
    const childSlot = Boolean(companions[index]?.is_minor ?? activeCompanion?.is_minor);

    if (childSlot) {
      const errors = validateUnder3GuestForm(guestForm);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        toast.error(Object.values(errors)[0]);
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
          relative_name: guestForm.relative_name,
          cnic: guestForm.cnic,
          linked_primary: value,
          phone: guestForm.phone,
        }));
        onCustomerCreated?.(created);
        saveCompanionSlot(index, companionFromSaved({
          customer_id: created.id,
          full_name: created.full_name || guestForm.full_name,
          cnic: created.cnic,
          relative_name: created.relative_name || guestForm.relative_name,
          relative_relation: 'FATHER',
          is_minor: true,
        }, true));
        toast.success('Child saved');
      } catch (err) {
        const data = err.response?.data;
        const msg = data?.cnic?.[0] || data?.relative_name?.[0] || data?.detail || 'Could not save child guest';
        toast.error(msg);
      } finally {
        setSaving(false);
      }
      return;
    }

    const presetGender = slotGender || 'MALE';
    const errors = validateGhCustomerForm(
      { ...guestForm, gender: presetGender },
      { requireProfileExtras: true },
    );
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(Object.values(errors)[0]);
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
        gender: presetGender,
        linked_primary: value,
      }));
      onCustomerCreated?.(created);
      saveCompanionSlot(index, {
        customer: String(created.id),
        full_name: created.full_name || customerDisplayName(created),
        cnic: created.cnic || '',
        phone: created.phone || '',
        address: created.address || '',
        gender: created.gender || presetGender,
        relative_relation: created.relative_relation || '',
        relative_name: created.relative_name || '',
        is_minor: false,
      });
      toast.success(`${companionLabel({ gender: created.gender || presetGender }, 0)} saved`);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.cnic?.[0] || data?.phone?.[0] || data?.detail || 'Could not save guest';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const removeCompanion = (index) => {
    const removed = companions[index];
    const next = companions.filter((_, i) => i !== index);
    onCompanionsChange?.(next);

    let nextMales = Math.max(Number(malesCount) || 0, 0);
    let nextFemales = Math.max(Number(femalesCount) || 0, 0);
    let nextUnder3 = Math.max(Number(under3Count) || 0, 0);

    if (removed?.is_minor) {
      nextUnder3 = Math.max(nextUnder3 - 1, 0);
    } else if ((removed?.gender || '').toUpperCase() === 'FEMALE') {
      nextFemales = Math.max(nextFemales - 1, 0);
    } else {
      nextMales = Math.max(nextMales - 1, 0);
    }
    if (nextMales + nextFemales < 1) nextMales = 1;

    onMalesChange?.(nextMales);
    onFemalesChange?.(nextFemales);
    onUnder3Change?.(nextUnder3);

    if (companionModalIndex === index) closeModals();
  };

  const modalOpen = primaryModalOpen || companionModalIndex !== null;
  const isCompanionModal = companionModalIndex !== null;

  return (
    <>
      <div className="book-future-party-bar">
        <div className="book-future-party-bar__counts">
          <label className="book-future-party-bar__count">
            <span>Male</span>
            <input
              type="number"
              min={0}
              max={50}
              value={malesCount}
              onChange={(e) => handleMalesChange(parseInt(e.target.value, 10) || 0)}
              disabled={disabled}
              aria-label="Male guests"
            />
          </label>
          <label className="book-future-party-bar__count">
            <span>Female</span>
            <input
              type="number"
              min={0}
              max={50}
              value={femalesCount}
              onChange={(e) => handleFemalesChange(parseInt(e.target.value, 10) || 0)}
              disabled={disabled}
              aria-label="Female guests"
            />
          </label>
          <label className="book-future-party-bar__count">
            <span>Children</span>
            <input
              type="number"
              min={0}
              max={50}
              value={under3Count}
              onChange={(e) => handleUnder3Change(parseInt(e.target.value, 10) || 0)}
              disabled={disabled}
              aria-label="Children guests"
            />
          </label>
        </div>

        <div className="book-future-party-bar__search">
          <CustomerSearchSelect
            customers={customers}
            value={value}
            onChange={onChange}
            placeholder="Primary guest…"
            excludeStatuses={['BLOCKLISTED']}
            priorityStatuses={['WHITELISTED']}
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
            {savedTravelCompanions.map((saved) => {
              const selected = isSavedGuestSelected(saved);
              return (
                <button
                  key={savedGuestKey(saved)}
                  type="button"
                  className={`book-future-party-bar__saved-chip book-future-party-bar__saved-chip--btn${saved.is_minor ? ' book-future-party-bar__saved-chip--child' : ''}${selected ? ' book-future-party-bar__saved-chip--selected' : ''}`}
                  title={selected ? 'Click to remove from this stay' : (saved.is_minor ? 'Click to add child' : 'Click to add guest')}
                  onClick={() => toggleSavedGuest(saved)}
                  disabled={disabled}
                  aria-pressed={selected}
                >
                  {saved.full_name}
                  {saved.is_minor ? ' (child)' : saved.cnic ? ` · ${saved.cnic}` : ''}
                  {saved.stays_together > 1 ? ` · ${saved.stays_together} stays` : ''}
                  {selected && <span className="book-future-party-bar__saved-check"> ✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {companions.length > 0 && (
        <div className="book-future-party-bar__companions-wrap">
          {companionGroups.males.length > 0 && (
            <div className="book-future-party-bar__companions">
              <span className="book-future-party-bar__companions-label book-future-party-bar__companions-label--male">
                Male guests
              </span>
              {companionGroups.males.map(({ guest, index }, subIndex) => renderCompanionChip(
                guest,
                index,
                subIndex,
                {
                  disabled,
                  onOpen: openCompanionModal,
                  onRemove: removeCompanion,
                  customers,
                  savedTravelCompanions,
                },
              ))}
            </div>
          )}
          {companionGroups.females.length > 0 && (
            <div className="book-future-party-bar__companions">
              <span className="book-future-party-bar__companions-label book-future-party-bar__companions-label--female">
                Female guests
              </span>
              {companionGroups.females.map(({ guest, index }, subIndex) => renderCompanionChip(
                guest,
                index,
                subIndex,
                {
                  disabled,
                  onOpen: openCompanionModal,
                  onRemove: removeCompanion,
                  customers,
                  savedTravelCompanions,
                },
              ))}
            </div>
          )}
          {companionGroups.under3.length > 0 && (
            <div className="book-future-party-bar__companions">
              <span className="book-future-party-bar__companions-label book-future-party-bar__companions-label--child">
                Child
              </span>
              {companionGroups.under3.map(({ guest, index }, subIndex) => renderCompanionChip(
                guest,
                index,
                subIndex,
                {
                  disabled,
                  onOpen: openCompanionModal,
                  onRemove: removeCompanion,
                  customers,
                  savedTravelCompanions,
                },
              ))}
            </div>
          )}
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
                    ? 'Add child'
                    : `Add ${slotGender === 'FEMALE' ? 'female' : 'male'} guest`)
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
                    <div className="input-group">
                      <label>Child name <span className="req">*</span></label>
                      <input
                        autoFocus
                        value={guestForm.full_name}
                        onChange={(e) => updateField('full_name', e.target.value)}
                        placeholder="Child full name"
                        aria-invalid={!!formErrors.full_name}
                      />
                      {formErrors.full_name && <p className="field-error">{formErrors.full_name}</p>}
                    </div>
                    <div className="input-group">
                      <label>Father name <span className="req">*</span></label>
                      <input
                        value={guestForm.relative_name}
                        onChange={(e) => updateField('relative_name', e.target.value)}
                        placeholder="Father full name"
                        aria-invalid={!!formErrors.relative_name}
                      />
                      {formErrors.relative_name && <p className="field-error">{formErrors.relative_name}</p>}
                    </div>
                    <div className="input-group">
                      <label>Father CNIC / ID <span className="req">*</span></label>
                      <input
                        value={guestForm.cnic}
                        onChange={(e) => updateField('cnic', formatCnicInput(e.target.value))}
                        placeholder={CNIC_PLACEHOLDER}
                        maxLength={CNIC_INPUT_MAX_LENGTH}
                        style={{ fontFamily: 'monospace' }}
                        aria-invalid={!!formErrors.cnic}
                      />
                      {formErrors.cnic && <p className="field-error">{formErrors.cnic}</p>}
                    </div>
                    <p className="book-future-guest-modal__note">
                      Child name, father name, and father CNIC are required.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="form-grid-2">
                      <div className="input-group">
                        <label>Name <span className="req">*</span></label>
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
                        <label>CNIC / Passport / ID <span className="req">*</span></label>
                        <input
                          value={guestForm.cnic}
                          onChange={(e) => updateField('cnic', formatCnicInput(e.target.value))}
                          placeholder={CNIC_PLACEHOLDER}
                          maxLength={CNIC_INPUT_MAX_LENGTH}
                          style={{ fontFamily: 'monospace' }}
                          aria-invalid={!!formErrors.cnic}
                        />
                        {formErrors.cnic && <p className="field-error">{formErrors.cnic}</p>}
                      </div>
                    </div>

                    {slotGender === 'MALE' && (
                      <div className="input-group">
                        <label>Father name <span className="req">*</span></label>
                        <input
                          value={guestForm.relative_name}
                          onChange={(e) => updateField('relative_name', e.target.value)}
                          placeholder="Father full name"
                          aria-invalid={!!formErrors.relative_name}
                        />
                        {formErrors.relative_name && <p className="field-error">{formErrors.relative_name}</p>}
                      </div>
                    )}

                    {slotGender === 'FEMALE' && (
                      <div className="form-grid-2">
                        <div className="input-group">
                          <label>Relation <span className="req">*</span></label>
                          <select
                            value={guestForm.relative_relation}
                            onChange={(e) => updateField('relative_relation', e.target.value)}
                            aria-invalid={!!formErrors.relative_relation}
                          >
                            <option value="">Select…</option>
                            {FEMALE_RELATION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          {formErrors.relative_relation && (
                            <p className="field-error">{formErrors.relative_relation}</p>
                          )}
                        </div>
                        <div className="input-group">
                          <label>
                            {relativeFieldLabel('FEMALE', guestForm.relative_relation)}{' '}
                            <span className="req">*</span>
                          </label>
                          <input
                            value={guestForm.relative_name}
                            onChange={(e) => updateField('relative_name', e.target.value)}
                            placeholder={relativeFieldLabel('FEMALE', guestForm.relative_relation)}
                            aria-invalid={!!formErrors.relative_name}
                          />
                          {formErrors.relative_name && (
                            <p className="field-error">{formErrors.relative_name}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="input-group">
                      <label>Contact <span className="req">*</span></label>
                      <input
                        value={guestForm.phone}
                        onChange={(e) => updateField('phone', formatPakPhone(e.target.value))}
                        placeholder={PAK_PHONE_PLACEHOLDER}
                        inputMode="numeric"
                        maxLength={PAK_PHONE_INPUT_MAX_LENGTH}
                        aria-invalid={!!formErrors.phone}
                      />
                      {formErrors.phone && <p className="field-error">{formErrors.phone}</p>}
                    </div>

                    <div className="input-group">
                      <label>Permanent address <span className="req">*</span></label>
                      <textarea
                        rows={2}
                        value={guestForm.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        placeholder="House / street, city"
                        aria-invalid={!!formErrors.address}
                      />
                      {formErrors.address && <p className="field-error">{formErrors.address}</p>}
                    </div>
                  </>
                )}

                <div className="book-future-guest-modal__actions">
                  <button type="button" className="btn-secondary" onClick={closeModals} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving
                      ? 'Saving…'
                      : 'Save guest'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePrimaryCreate} className="book-future-guest-modal__form" noValidate>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label>Name <span className="req">*</span></label>
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
                    <label>CNIC / Passport / ID <span className="req">*</span></label>
                    <input
                      value={guestForm.cnic}
                      onChange={(e) => updateField('cnic', formatCnicInput(e.target.value))}
                      placeholder={CNIC_PLACEHOLDER}
                      maxLength={CNIC_INPUT_MAX_LENGTH}
                      style={{ fontFamily: 'monospace' }}
                      aria-invalid={!!formErrors.cnic}
                    />
                    {formErrors.cnic && <p className="field-error">{formErrors.cnic}</p>}
                  </div>
                </div>

                <div className="input-group">
                  <label>Gender <span className="req">*</span></label>
                  <div
                    className={`book-future-guest-modal__gender${formErrors.gender ? ' book-future-guest-modal__gender--error' : ''}`}
                    role="radiogroup"
                    aria-label="Gender"
                  >
                    {GENDER_OPTIONS.map((opt) => {
                      const active = guestForm.gender === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={`book-future-guest-modal__gender-option${active ? ' is-active' : ''}`}
                        >
                          <input
                            type="radio"
                            name="guest-gender"
                            value={opt.value}
                            checked={active}
                            onChange={() => updateField('gender', opt.value)}
                          />
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                  {formErrors.gender && <p className="field-error">{formErrors.gender}</p>}
                </div>

                {guestForm.gender === 'MALE' && (
                  <div className="input-group">
                    <label>Father name <span className="req">*</span></label>
                    <input
                      value={guestForm.relative_name}
                      onChange={(e) => updateField('relative_name', e.target.value)}
                      placeholder="Father full name"
                      aria-invalid={!!formErrors.relative_name}
                    />
                    {formErrors.relative_name && <p className="field-error">{formErrors.relative_name}</p>}
                  </div>
                )}

                {guestForm.gender === 'FEMALE' && (
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label>Relation <span className="req">*</span></label>
                      <select
                        value={guestForm.relative_relation}
                        onChange={(e) => updateField('relative_relation', e.target.value)}
                        aria-invalid={!!formErrors.relative_relation}
                      >
                        <option value="">Select…</option>
                        {FEMALE_RELATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {formErrors.relative_relation && (
                        <p className="field-error">{formErrors.relative_relation}</p>
                      )}
                    </div>
                    <div className="input-group">
                      <label>
                        {relativeFieldLabel('FEMALE', guestForm.relative_relation)}{' '}
                        <span className="req">*</span>
                      </label>
                      <input
                        value={guestForm.relative_name}
                        onChange={(e) => updateField('relative_name', e.target.value)}
                        placeholder={relativeFieldLabel('FEMALE', guestForm.relative_relation)}
                        aria-invalid={!!formErrors.relative_name}
                      />
                      {formErrors.relative_name && (
                        <p className="field-error">{formErrors.relative_name}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label>Contact <span className="req">*</span></label>
                  <input
                    value={guestForm.phone}
                    onChange={(e) => updateField('phone', formatPakPhone(e.target.value))}
                    placeholder={PAK_PHONE_PLACEHOLDER}
                    inputMode="numeric"
                    maxLength={PAK_PHONE_INPUT_MAX_LENGTH}
                    aria-invalid={!!formErrors.phone}
                  />
                  {formErrors.phone && <p className="field-error">{formErrors.phone}</p>}
                </div>

                <div className="input-group">
                  <label>Permanent address <span className="req">*</span></label>
                  <textarea
                    rows={2}
                    value={guestForm.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="House / street, city"
                    aria-invalid={!!formErrors.address}
                  />
                  {formErrors.address && <p className="field-error">{formErrors.address}</p>}
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
