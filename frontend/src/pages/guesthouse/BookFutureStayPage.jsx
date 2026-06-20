import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { format, addDays, parseISO } from 'date-fns';
import {
  ChevronLeft, Calendar, User, BedDouble, FileText,
  CheckCircle, X, HelpCircle, Sparkles, Users,
} from 'lucide-react';
import { createStay, getAvailableRooms, listGhServices } from '../../api/guesthouse';
import { computeStayBilling, formatReservationRoomLabel, getServicePriceLabel, getIncludedGuests } from '../../utils/ghBilling';
import useLiveStayBill, { getBookingNights } from '../../hooks/useLiveStayBill';
import { StayBillingBreakdown, GuestsCountHint } from '../../components/guesthouse/StayAddonsSection';
import client from '../../api/client';
import toast from 'react-hot-toast';
import AppLoader from '../../components/AppLoader';
import { usePermissions } from '../../hooks/usePermissions';
import { useGhPageVisibility } from '../../context/GhPageVisibilityContext';
import { GH_MODULE_KEYS } from '../../constants/ghPages';
import StayGuestRoster, {
  buildGuestRosterPayload,
  deriveGuestsCount,
  getFilledCompanions,
  shouldSendGuestRoster,
  validateGuestRoster,
} from '../../components/guesthouse/StayGuestRoster';
import { formatRs } from '../../utils/currency';
import { resolveMediaUrl } from '../../utils/media';
import { customerDisplayName } from '../../utils/customer';
import {
  resolveGuestFromIdScan,
  isPhoneCompleteForAutoSave,
  saveGuestFromDraft,
} from '../../utils/idCardCustomer';
import './book-future-stay.css';

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
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
      <Icon size={20} color="var(--primary)" />
    </div>
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--secondary)' }}>{title}</h3>
      {subtitle && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{subtitle}</p>
      )}
    </div>
  </div>
);

function createReservationPreviewId() {
  const datePart = format(new Date(), 'yyMMdd');
  const randPart = String(Math.floor(1000 + Math.random() * 9000));
  return `GH${datePart}${randPart}`;
}

function getRoomAddonServiceIds(room) {
  return (room?.addon_service_ids || []).map((id) => Number(id));
}

function getRoomAddonServices(room, allServices) {
  const allowed = new Set(getRoomAddonServiceIds(room).map(String));
  return allServices.filter((s) => allowed.has(String(s.id)));
}

export default function BookFutureStayPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { canOperate } = usePermissions();
  const { isModuleVisible, isModuleInMaintenance } = useGhPageVisibility();
  const showIdScanner = isModuleVisible(GH_MODULE_KEYS.ID_SCANNER)
    && !isModuleInMaintenance(GH_MODULE_KEYS.ID_SCANNER);

  const prefillCheckIn = location.state?.check_in || searchParams.get('check_in') || '';
  const prefillCheckOut = location.state?.check_out || searchParams.get('check_out') || '';
  const prefillRoom = location.state?.room || searchParams.get('room') || '';
  const prefillCustomer = location.state?.prefillCustomer || searchParams.get('customer') || '';

  const [form, setForm] = useState({
    customer: prefillCustomer ? String(prefillCustomer) : '',
    room: prefillRoom ? String(prefillRoom) : '',
    check_in: prefillCheckIn,
    check_out: prefillCheckOut || (prefillCheckIn ? format(addDays(parseISO(prefillCheckIn), 1), 'yyyy-MM-dd') : ''),
    check_in_time: '14:00',
    check_out_time: '11:00',
    guests_count: 1,
    advance_paid: '',
    advance_payment_method: 'CASH',
    notes: '',
  });
  const [rooms, setRooms] = useState([]);
  const [bookedRoomIds, setBookedRoomIds] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityInfo, setAvailabilityInfo] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [scannedGuest, setScannedGuest] = useState(null);
  const [creatingGuest, setCreatingGuest] = useState(false);
  const [companions, setCompanions] = useState([]);
  const savingGuestRef = useRef(false);
  const reservationPreviewId = useRef(createReservationPreviewId()).current;

  const toggleAddon = (id) => {
    setSelectedAddonIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  const selectRoom = (roomId) => {
    setForm((f) => ({ ...f, room: String(roomId) }));
    setSelectedAddonIds([]);
  };

  useEffect(() => {
    if (!canOperate) {
      toast.error('You do not have permission to book stays.');
      navigate('/gh/calendar');
    }
  }, [canOperate, navigate]);

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        const [custRes, svcList] = await Promise.all([
          client.get('/customers/'),
          listGhServices(),
        ]);
        const custData = custRes.data?.results || custRes.data || [];
        setCustomers(Array.isArray(custData) ? custData : []);
        setServices(Array.isArray(svcList) ? svcList : []);
      } catch {
        toast.error('Failed to load booking data');
        navigate('/gh/calendar');
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, [navigate]);

  useEffect(() => {
    if (!form.check_in || !form.check_out) {
      setRooms([]);
      setBookedRoomIds([]);
      setAvailabilityInfo(null);
      if (form.room) {
        setForm((f) => ({ ...f, room: '' }));
        setSelectedAddonIds([]);
      }
      return undefined;
    }
    let cancelled = false;
    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      try {
        const data = await getAvailableRooms({
          check_in: form.check_in,
          check_out: form.check_out,
        });
        if (cancelled) return;
        const allRooms = data.all_rooms || data.available_rooms || [];
        const booked = new Set((data.booked_room_ids || []).map(String));
        setRooms(allRooms);
        setBookedRoomIds([...booked]);
        setAvailabilityInfo(data);
        if (form.room && booked.has(String(form.room))) {
          setForm((f) => ({ ...f, room: '' }));
          setSelectedAddonIds([]);
        }
      } catch {
        if (!cancelled) toast.error('Could not check room availability');
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    };
    loadAvailability();
    return () => { cancelled = true; };
  }, [form.check_in, form.check_out]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => String(r.id) === String(form.room)),
    [rooms, form.room],
  );

  const primaryCustomer = useMemo(
    () => customers.find((c) => String(c.id) === String(form.customer)),
    [customers, form.customer],
  );

  const filledCompanions = useMemo(
    () => getFilledCompanions(companions),
    [companions],
  );

  const effectiveGuestsCount = useMemo(
    () => deriveGuestsCount(companions),
    [companions],
  );

  const maxAdditionalGuests = useMemo(() => {
    if (!selectedRoom) return undefined;
    return Math.max((Number(selectedRoom.beds) || 1) - 1, 0);
  }, [selectedRoom]);

  const validSelectedAddonIds = useMemo(() => {
    if (!selectedRoom) return [];
    const allowed = new Set(getRoomAddonServiceIds(selectedRoom).map(String));
    return selectedAddonIds.filter((id) => allowed.has(String(id)));
  }, [selectedRoom, selectedAddonIds]);

  const stayEstimate = useLiveStayBill({
    checkIn: form.check_in,
    checkOut: form.check_out,
    room: selectedRoom,
    guestsCount: effectiveGuestsCount,
    services,
    selectedAddonIds: validSelectedAddonIds,
    advancePaid: form.advance_paid,
  });

  const bookingNights = stayEstimate.nights || getBookingNights(form.check_in, form.check_out);

  const reloadCustomers = async () => {
    const custRes = await client.get('/customers/');
    const custData = custRes.data?.results || custRes.data || [];
    const list = Array.isArray(custData) ? custData : [];
    setCustomers(list);
    return list;
  };

  const selectGuest = (customer) => {
    setForm((f) => ({ ...f, customer: String(customer.id) }));
    setScannedGuest(null);
    toast.success(`Guest selected: ${customerDisplayName(customer)}`, { id: 'id-scan' });
  };

  const saveGuestFromScan = async (guestDraft) => {
    if (savingGuestRef.current) return false;
    savingGuestRef.current = true;
    setCreatingGuest(true);
    try {
      const result = await saveGuestFromDraft(guestDraft);
      if (!result.ok) {
        toast.error(result.error || 'Please complete all required fields');
        return false;
      }
      const list = await reloadCustomers();
      const match = list.find((c) => c.id === result.customer.id) || result.customer;
      selectGuest(match);
      if (result.created) {
        toast.success(`Guest saved & selected: ${customerDisplayName(match)}`, { id: 'id-scan' });
      }
      return true;
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.cnic?.[0] || data?.phone?.[0] || data?.detail || 'Failed to save guest';
      toast.error(msg);
      return false;
    } finally {
      savingGuestRef.current = false;
      setCreatingGuest(false);
    }
  };

  const handleIdScan = async (parsed) => {
    if (creatingGuest || savingGuestRef.current) return;
    setScannedGuest(null);
    setForm((f) => ({ ...f, customer: '' }));
    setCreatingGuest(true);
    try {
      const result = await resolveGuestFromIdScan(parsed, { customers });
      if (result.status === 'invalid') {
        toast.error('Could not read ID card. Scan again.');
        return;
      }
      if (result.status === 'existing') {
        const list = await reloadCustomers();
        const match = list.find((c) => c.id === result.customer.id) || result.customer;
        selectGuest(match);
        return;
      }
      if (result.status === 'created') {
        const list = await reloadCustomers();
        const created = list.find((c) => c.id === result.customer.id) || result.customer;
        setForm((f) => ({ ...f, customer: String(created.id) }));
        setScannedGuest(null);
        toast.success(`New guest saved: ${customerDisplayName(created)}`, { id: 'id-scan' });
        return;
      }
      setScannedGuest(result.draft);
      setForm((f) => ({ ...f, customer: '' }));
      toast('ID card read — check fields and add phone', { id: 'id-scan', icon: 'ℹ️' });
    } catch {
      toast.error('Failed to process ID card scan');
    } finally {
      setCreatingGuest(false);
    }
  };

  const handleScannedGuestChange = (field, value) => {
    setScannedGuest((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const handleScannedPhoneChange = async (value) => {
    if (!scannedGuest) return;
    const next = { ...scannedGuest, phone: value };
    setScannedGuest(next);
    if (isPhoneCompleteForAutoSave(value)) {
      await saveGuestFromScan(next);
    }
  };

  const handleCreateGuestFromScan = async () => {
    if (!scannedGuest) return;
    await saveGuestFromScan(scannedGuest);
  };

  const handleCompanionIdScan = async (index, parsed) => {
    if (creatingGuest || savingGuestRef.current) return;
    setCreatingGuest(true);
    try {
      const result = await resolveGuestFromIdScan(parsed, { customers });
      if (result.status === 'invalid') {
        toast.error('Could not read ID card. Scan again.');
        return;
      }
      if (result.status === 'existing' || result.status === 'created') {
        const list = await reloadCustomers();
        const match = list.find((c) => c.id === result.customer.id) || result.customer;
        setCompanions((prev) => prev.map((guest, i) => (
          i === index
            ? {
              customer: String(match.id),
              full_name: match.full_name || customerDisplayName(match),
              cnic: match.cnic || '',
              phone: match.phone || '',
            }
            : guest
        )));
        toast.success(`Guest ${index + 2} added from ID scan`);
        return;
      }
      setCompanions((prev) => prev.map((guest, i) => (
        i === index
          ? {
            ...guest,
            full_name: result.draft.full_name || '',
            cnic: result.draft.cnic || '',
            phone: result.draft.phone || '',
            customer: '',
          }
          : guest
      )));
      toast('ID read — complete guest details', { icon: 'ℹ️' });
    } catch {
      toast.error('Failed to process ID card scan');
    } finally {
      setCreatingGuest(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (stayEstimate?.error) {
      setFormError(stayEstimate.error);
      return;
    }
    if (stayEstimate?.advanceExceedsTotal) {
      setFormError(`Advance cannot exceed stay total (${formatRs(stayEstimate.total)}).`);
      return;
    }
    if (!form.customer || !form.room) {
      setFormError('Please select a guest and room.');
      return;
    }
    const rosterError = validateGuestRoster(form.customer, primaryCustomer, companions);
    if (rosterError) {
      setFormError(rosterError);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customer: Number(form.customer),
        room: Number(form.room),
        check_in: form.check_in,
        check_out: form.check_out,
        guests_count: effectiveGuestsCount,
        advance_paid: parseFloat(form.advance_paid) || 0,
        advance_payment_method: form.advance_payment_method,
        addon_service_ids: validSelectedAddonIds,
        status: 'CONFIRMED',
        notes: [
          form.check_in_time ? `Check-in time: ${form.check_in_time}` : '',
          form.check_out_time ? `Check-out time: ${form.check_out_time}` : '',
          form.notes.trim(),
        ].filter(Boolean).join('\n'),
      };
      if (shouldSendGuestRoster(effectiveGuestsCount, filledCompanions)) {
        payload.guest_roster = buildGuestRosterPayload(form.customer, primaryCustomer, filledCompanions);
      }
      const created = await createStay(payload);
      toast.success('Future stay booked successfully');
      if (Number(form.advance_paid) > 0) {
        navigate(`/gh/print/stay/${created.id}?doc=advance`);
      } else {
        navigate(`/gh/stays/${created.id}`);
      }
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Could not book stay';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <AppLoader message="Loading booking form…" />;
  }

  return (
    <div className="animate-fade-in">
      <button
        type="button"
        className="dashboard-header__icon-btn"
        onClick={() => navigate('/gh/calendar')}
        aria-label="Back to calendar"
        style={{ marginBottom: '12px' }}
      >
        <ChevronLeft size={22} />
      </button>

      {(formError || stayEstimate?.error) && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '14px',
            padding: '16px 20px',
            color: '#b91c1c',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '20px',
          }}
        >
          {formError || stayEstimate?.error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="booking-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Hero header */}
            <div
              style={{
                background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--surface) 60%)',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                padding: '14px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    padding: '3px 8px',
                    borderRadius: '20px',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={9} /> Future booking
                </span>
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.03em', margin: '0 0 10px 0', color: 'var(--secondary)' }}>
                Reservation
              </h1>
              <div className="book-future-datetime-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Calendar size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                <input
                  type="date"
                  required
                  value={form.check_in}
                  onChange={(e) => {
                    const checkIn = e.target.value;
                    setForm((f) => ({
                      ...f,
                      check_in: checkIn,
                      check_out: f.check_out && f.check_out <= checkIn
                        ? format(addDays(parseISO(checkIn), 1), 'yyyy-MM-dd')
                        : f.check_out,
                    }));
                  }}
                  aria-label="Check-in date"
                />
                <input
                  type="time"
                  value={form.check_in_time}
                  onChange={(e) => setForm({ ...form, check_in_time: e.target.value })}
                  aria-label="Check-in time"
                />
                <span style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '12px' }}>→</span>
                <input
                  type="date"
                  required
                  value={form.check_out}
                  min={form.check_in ? format(addDays(parseISO(form.check_in), 1), 'yyyy-MM-dd') : undefined}
                  onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                  aria-label="Check-out date"
                />
                <input
                  type="time"
                  value={form.check_out_time}
                  onChange={(e) => setForm({ ...form, check_out_time: e.target.value })}
                  aria-label="Check-out time"
                />
                {form.check_in && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={bookingNights > 0 ? bookingNights : 1}
                      onChange={(e) => {
                        const nights = Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 1));
                        setForm((f) => ({
                          ...f,
                          check_out: format(addDays(parseISO(f.check_in), nights), 'yyyy-MM-dd'),
                        }));
                      }}
                      style={{
                        width: '2.75rem',
                        padding: '5px 4px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: 'var(--primary)',
                        textAlign: 'center',
                        background: 'var(--surface)',
                      }}
                      aria-label="Number of nights"
                    />
                    <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      night{(bookingNights > 0 ? bookingNights : 1) !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {stayEstimate?.ready && (
                  <span style={{ color: 'var(--secondary)', fontWeight: '800', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    · {formatRs(stayEstimate.total)}
                  </span>
                )}
              </div>
            </div>

            {/* Room selection */}
            <div className="premium-card" style={{ padding: '28px' }}>
              <SectionHeader icon={BedDouble} title="Select room" subtitle="Total for your guests shows on each room card" />
              {availabilityLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Checking availability…</p>
              ) : !form.check_in || !form.check_out ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  Set check-in and check-out dates in the header above to see available rooms.
                </p>
              ) : rooms.length === 0 ? (
                <div style={{ padding: '20px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '14px' }}>
                  No active rooms found. Add rooms from Room Management first.
                </div>
              ) : (
                <>
                  {availabilityInfo && (
                    <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '700', marginBottom: '14px' }}>
                      {availabilityInfo.total_available} of {availabilityInfo.total_rooms} rooms available for these dates
                    </p>
                  )}
                  {availabilityInfo?.total_available === 0 && (
                    <div style={{ padding: '14px 16px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', marginBottom: '14px' }}>
                      All rooms are booked for these dates. Try different dates or check the calendar.
                    </div>
                  )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                  {rooms.map((r) => {
                    const selected = String(form.room) === String(r.id);
                    const isBooked = bookedRoomIds.includes(String(r.id)) || r.is_available === false;
                    const roomAddons = getRoomAddonServices(r, services);
                    const previewAddonIds = selected ? validSelectedAddonIds : [];
                    const preview = bookingNights > 0 && !isBooked
                      ? computeStayBilling({
                        room: r,
                        guestsCount: effectiveGuestsCount,
                        nights: bookingNights,
                        services,
                        selectedServiceIds: previewAddonIds,
                      })
                      : null;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        disabled={isBooked}
                        onClick={() => !isBooked && selectRoom(r.id)}
                        style={{
                          textAlign: 'left',
                          padding: r.image ? '0' : '18px',
                          borderRadius: '14px',
                          border: isBooked ? '1px solid #fecaca' : selected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: isBooked ? '#fef2f2' : selected ? 'var(--primary-light)' : 'var(--surface)',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          opacity: isBooked ? 0.75 : 1,
                          transition: 'all 0.15s ease',
                          boxShadow: selected && !isBooked ? '0 4px 16px rgba(91, 213, 30, 0.15)' : 'none',
                          overflow: 'hidden',
                        }}
                      >
                        {r.image && (
                          <div style={{ height: '110px', overflow: 'hidden', background: 'var(--surface-muted)' }}>
                            <img
                              src={resolveMediaUrl(r.image)}
                              alt={`Room ${r.room_number}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          </div>
                        )}
                        <div style={{ padding: r.image ? '14px 16px 16px' : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: 8 }}>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: isBooked ? '#b91c1c' : selected ? 'var(--primary)' : 'var(--secondary)' }}>
                            {r.room_number}
                          </span>
                          {isBooked ? (
                            <span style={{ fontSize: '9px', fontWeight: '800', padding: '3px 8px', borderRadius: '20px', background: '#fecaca', color: '#b91c1c', textTransform: 'uppercase' }}>Booked</span>
                          ) : selected ? (
                            <CheckCircle size={18} color="var(--primary)" />
                          ) : null}
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 6px 0', textTransform: 'capitalize' }}>
                          {r.room_type?.toLowerCase()} · {r.beds} bed{r.beds !== 1 ? 's' : ''}
                        </p>
                        <p style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: isBooked ? 'var(--text-muted)' : 'var(--secondary)' }}>
                          {formatRs(r.price_per_night)}
                          <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>
                            {' '}/ night · {getIncludedGuests(r)} incl.
                          </span>
                        </p>
                        {preview && (
                          <p style={{ fontSize: '13px', fontWeight: '800', margin: '8px 0 0', color: 'var(--primary)' }}>
                            Stay total: {formatRs(preview.total)}
                          </p>
                        )}
                        {selected && !isBooked && roomAddons.length > 0 && (
                          <div
                            className="book-room-addons"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <p className="book-room-addons__label">Extra services</p>
                            {roomAddons.map((svc) => (
                              <label key={svc.id} className="book-room-addons__item">
                                <input
                                  type="checkbox"
                                  checked={selectedAddonIds.includes(svc.id)}
                                  onChange={() => toggleAddon(svc.id)}
                                />
                                <span className="book-room-addons__name">{svc.label}</span>
                                <span className="book-room-addons__price">{getServicePriceLabel(svc)}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                </>
              )}
            </div>

            {/* Guests */}
            <div className="premium-card" style={{ padding: '28px' }}>
              <SectionHeader
                icon={User}
                title="Guests on this stay"
                subtitle="Add guests — bill updates instantly for room, add-ons & balance"
              />
              <StayGuestRoster
                customers={customers}
                primaryCustomerId={form.customer}
                maxAdditionalGuests={maxAdditionalGuests}
                onPrimaryCustomerChange={(customerId) => {
                  setForm({ ...form, customer: customerId });
                  if (customerId) setScannedGuest(null);
                }}
                companions={companions}
                onCompanionsChange={setCompanions}
                showIdScanner={showIdScanner}
                onIdScanPrimary={handleIdScan}
                onIdScanCompanion={handleCompanionIdScan}
                scanProcessing={creatingGuest}
                scannedGuest={scannedGuest}
                onScannedGuestChange={handleScannedGuestChange}
                onScannedPhoneChange={handleScannedPhoneChange}
                onSaveScannedGuest={handleCreateGuestFromScan}
                onCancelScannedGuest={() => setScannedGuest(null)}
                savingScannedGuest={creatingGuest}
                disabled={loading || submitting}
              />
              {selectedRoom && (
                <div style={{ marginTop: '16px' }}>
                  <GuestsCountHint room={selectedRoom} guestsCount={effectiveGuestsCount} />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="premium-card" style={{ padding: '28px' }}>
              <SectionHeader icon={FileText} title="Notes" subtitle="Special requests or arrival details (optional)" />
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Expected arrival time, ID requirements, dietary needs…"
                style={{ width: '100%', resize: 'vertical', minHeight: '80px', padding: '14px', borderRadius: '10px', fontSize: '14px' }}
              />
            </div>
          </div>

          {/* Sticky summary sidebar */}
          <div style={{ position: 'sticky', top: '88px', display: 'flex', flexDirection: 'column', gap: '20px', alignSelf: 'start' }}>
            <div className="premium-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '18px', border: '1px solid var(--border)' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, #3da015 100%)',
                  padding: '14px 16px',
                  color: '#fff',
                }}
              >
                <p style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px 0', opacity: 0.9 }}>
                  Reservation ID
                </p>
                <p style={{ fontSize: '10px', fontWeight: '700', margin: '0 0 8px 0', letterSpacing: '0.02em', opacity: 0.95 }}>
                  {reservationPreviewId}
                </p>
                <p style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 3px 0', lineHeight: 1.25 }}>
                  {primaryCustomer ? customerDisplayName(primaryCustomer) : '—'}
                </p>
                <p style={{ fontSize: '13px', fontWeight: '600', margin: 0, opacity: 0.9 }}>
                  {primaryCustomer?.phone?.trim() || '—'}
                </p>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {stayEstimate?.ready ? (
                  <>
                    <StayBillingBreakdown
                      billing={stayEstimate}
                      compact
                      roomLabel={
                        selectedRoom
                          ? formatReservationRoomLabel(selectedRoom, bookingNights, effectiveGuestsCount)
                          : undefined
                      }
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <span style={{ fontWeight: 800, fontSize: 13 }}>Advance</span>
                        <input
                          type="number"
                          min={0}
                          step="100"
                          placeholder="0"
                          value={form.advance_paid}
                          onChange={(e) => setForm({ ...form, advance_paid: e.target.value })}
                          style={{
                            width: '110px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '700',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[0, 25, 50, 100].map((pct) => {
                          const amt = pct === 0 ? 0 : Math.round(stayEstimate.total * pct / 100);
                          const label = pct === 0 ? 'None' : `${pct}%`;
                          const active = Number(form.advance_paid) === amt;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setForm({ ...form, advance_paid: amt ? String(amt) : '' })}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                border: '1px solid var(--border)',
                                background: active ? 'var(--primary)' : 'var(--surface)',
                                color: active ? '#fff' : 'var(--text-main)',
                                cursor: 'pointer',
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <span>Balance due</span>
                      <span style={{ color: stayEstimate.due > 0 ? 'var(--error)' : 'var(--primary)' }}>{formatRs(stayEstimate.due)}</span>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    {!form.customer
                      ? 'Select a guest to see name and number.'
                      : !selectedRoom
                        ? 'Select a room to see pricing.'
                        : (stayEstimate?.hint || 'Select dates from the calendar to see the full bill.')}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || !form.room || !form.customer}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '16px',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '15px',
                    marginTop: '8px',
                    opacity: (!form.room || !form.customer) ? 0.6 : 1,
                  }}
                >
                  <CheckCircle size={20} />
                  {submitting ? 'Booking…' : 'Confirm reservation'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/gh/calendar')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: '700',
                  }}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--primary-light)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 8px 0' }}>
                <HelpCircle size={14} /> Tip
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Advance payment secures the room. Remaining balance can be collected at check-in from the Payments page.
              </p>
            </div>
          </div>
        </div>

        <div className="booking-mobile-bar" aria-live="polite">
          <div className="booking-mobile-bar__total">
            <p className="booking-mobile-bar__label">Total</p>
            <p className="booking-mobile-bar__amount">
              {stayEstimate?.ready ? formatRs(stayEstimate.total) : '—'}
            </p>
            {stayEstimate?.ready && (
              <p className="booking-mobile-bar__due">Due: {formatRs(stayEstimate.due)}</p>
            )}
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !form.room || !form.customer}
          >
            {submitting ? 'Booking…' : 'Confirm reservation'}
          </button>
        </div>
      </form>
    </div>
  );
}
