import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { format, addDays, parseISO } from 'date-fns';
import {
  ChevronLeft, Calendar, BedDouble, FileText,
  CheckCircle, X,
} from 'lucide-react';
import { createStay, getAvailableRooms, listGhServices } from '../../api/guesthouse';
import { computeStayBilling, formatReservationRoomLabel, getServicePriceLabel, getIncludedGuests } from '../../utils/ghBilling';
import useLiveStayBill, { getBookingNights } from '../../hooks/useLiveStayBill';
import { StayBillingBreakdown } from '../../components/guesthouse/StayAddonsSection';
import client from '../../api/client';
import toast from 'react-hot-toast';
import AppLoader from '../../components/AppLoader';
import { usePermissions } from '../../hooks/usePermissions';
import {
  buildGuestRosterPayload,
  getFilledCompanions,
  shouldSendGuestRoster,
  validateGuestRoster,
} from '../../components/guesthouse/StayGuestRoster';
import { formatRs } from '../../utils/currency';
import { resolveMediaUrl } from '../../utils/media';
import { customerDisplayName } from '../../utils/customer';
import BookFutureGuestBar from '../../components/guesthouse/BookFutureGuestBar';
import { getCustomerTravelCompanions, getPrimaryCustomers } from '../../api/customers';
import { getTenant } from '../../api/core';
import {
  DEFAULT_GH_CHECK_IN_TIME,
  DEFAULT_GH_CHECK_OUT_TIME,
  ghStayTimesFromTenant,
} from '../../utils/ghStay';
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

  const prefillCheckIn = location.state?.check_in || searchParams.get('check_in') || '';
  const prefillCheckOut = location.state?.check_out || searchParams.get('check_out') || '';
  const prefillRoom = location.state?.room || searchParams.get('room') || '';
  const prefillCustomer = location.state?.prefillCustomer || searchParams.get('customer') || '';

  const [form, setForm] = useState({
    customer: prefillCustomer ? String(prefillCustomer) : '',
    room: prefillRoom ? String(prefillRoom) : '',
    check_in: prefillCheckIn,
    check_out: prefillCheckOut || (prefillCheckIn ? format(addDays(parseISO(prefillCheckIn), 1), 'yyyy-MM-dd') : ''),
    check_in_time: DEFAULT_GH_CHECK_IN_TIME,
    check_out_time: DEFAULT_GH_CHECK_OUT_TIME,
    adults_count: 1,
    children_count: 0,
    males_count: 1,
    females_count: 0,
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
  const [companions, setCompanions] = useState([]);
  const [savedTravelCompanions, setSavedTravelCompanions] = useState([]);
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
        const [custList, svcList, tenantRes] = await Promise.all([
          getPrimaryCustomers(),
          listGhServices(),
          getTenant().catch(() => null),
        ]);
        setCustomers(Array.isArray(custList) ? custList : []);
        setServices(Array.isArray(svcList) ? svcList : []);
        if (tenantRes) {
          const stayTimes = ghStayTimesFromTenant(tenantRes);
          setForm((f) => ({
            ...f,
            check_in_time: stayTimes.checkInTime,
            check_out_time: stayTimes.checkOutTime,
          }));
        }
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

  useEffect(() => {
    if (!form.customer) {
      setSavedTravelCompanions([]);
      return undefined;
    }
    let cancelled = false;
    getCustomerTravelCompanions(form.customer)
      .then((list) => {
        if (!cancelled) setSavedTravelCompanions(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setSavedTravelCompanions([]);
      });
    return () => { cancelled = true; };
  }, [form.customer]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => String(r.id) === String(form.room)),
    [rooms, form.room],
  );

  const primaryCustomer = useMemo(
    () => customers.find((c) => String(c.id) === String(form.customer)),
    [customers, form.customer],
  );
  const isPrimaryBlocked = (primaryCustomer?.list_status || 'NORMAL') === 'BLOCKLISTED';

  const familyGuestsCount = useMemo(() => {
    const males = Math.max(Number(form.males_count) || 0, 0);
    const females = Math.max(Number(form.females_count) || 0, 0);
    const adults = Math.max(males + females, 1);
    const children = Math.max(Number(form.children_count) || 0, 0);
    return adults + children;
  }, [form.males_count, form.females_count, form.children_count]);

  const filledCompanions = useMemo(
    () => getFilledCompanions(companions),
    [companions],
  );

  const validSelectedAddonIds = useMemo(() => {
    if (!selectedRoom) return [];
    const allowed = new Set(getRoomAddonServiceIds(selectedRoom).map(String));
    return selectedAddonIds.filter((id) => allowed.has(String(id)));
  }, [selectedRoom, selectedAddonIds]);

  const stayEstimate = useLiveStayBill({
    checkIn: form.check_in,
    checkOut: form.check_out,
    room: selectedRoom,
    guestsCount: familyGuestsCount,
    services,
    selectedAddonIds: validSelectedAddonIds,
    advancePaid: form.advance_paid,
  });

  const bookingNights = stayEstimate.nights || getBookingNights(form.check_in, form.check_out);

  const reloadCustomers = async () => {
    const list = await getPrimaryCustomers();
    setCustomers(Array.isArray(list) ? list : []);
    return list;
  };

  const reloadTravelCompanions = async (customerId = form.customer) => {
    if (!customerId) {
      setSavedTravelCompanions([]);
      return [];
    }
    const list = await getCustomerTravelCompanions(customerId);
    const companions = Array.isArray(list) ? list : [];
    setSavedTravelCompanions(companions);
    return companions;
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
    if (isPrimaryBlocked) {
      setFormError('Selected guest is blocklisted and cannot be booked.');
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
        guests_count: familyGuestsCount,
        adults_count: Math.max(
          (Number(form.males_count) || 0) + (Number(form.females_count) || 0),
          1,
        ),
        children_count: Math.max(Number(form.children_count) || 0, 0),
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
      if (shouldSendGuestRoster(familyGuestsCount, filledCompanions)) {
        payload.guest_roster = buildGuestRosterPayload(form.customer, primaryCustomer, companions);
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
                  title="Default from Settings → Venue Info"
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
                  title="Default from Settings → Venue Info"
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
              </div>
              <BookFutureGuestBar
                customers={customers}
                value={form.customer}
                malesCount={form.males_count}
                femalesCount={form.females_count}
                under3Count={form.children_count}
                companions={companions}
                onCompanionsChange={setCompanions}
                savedTravelCompanions={savedTravelCompanions}
                onMalesChange={(n) => setForm({
                  ...form,
                  males_count: n,
                  adults_count: Math.max(n + (Number(form.females_count) || 0), 1),
                })}
                onFemalesChange={(n) => setForm({
                  ...form,
                  females_count: n,
                  adults_count: Math.max((Number(form.males_count) || 0) + n, 1),
                })}
                onUnder3Change={(n) => setForm({ ...form, children_count: n })}
                onChange={(customerId) => setForm({ ...form, customer: customerId })}
                onCustomerCreated={async () => {
                  await reloadCustomers();
                  await reloadTravelCompanions();
                }}
                disabled={loading || submitting}
              />
              {isPrimaryBlocked && (
                <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontSize: 12, fontWeight: 700 }}>
                  This primary guest is blocklisted. Please select another guest.
                </div>
              )}
            </div>

            {/* Room selection */}
            <div className="premium-card" style={{ padding: '28px' }}>
              <SectionHeader icon={BedDouble} title="Select unit" />
              {availabilityLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Checking availability…</p>
              ) : !form.check_in || !form.check_out ? null : rooms.length === 0 ? (
                <div style={{ padding: '20px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '14px' }}>
                  No active units found. Add suites/rooms from Units first.
                </div>
              ) : (
                <>
                  {availabilityInfo && (
                    <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '700', marginBottom: '14px' }}>
                      {availabilityInfo.total_available} of {availabilityInfo.total_rooms} units available for these dates
                    </p>
                  )}
                  {availabilityInfo?.total_available === 0 && (
                    <div style={{ padding: '14px 16px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', marginBottom: '14px' }}>
                      All units are booked for these dates. Try different dates or check the calendar.
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
                        guestsCount: familyGuestsCount,
                        nights: bookingNights,
                        services,
                        selectedServiceIds: previewAddonIds,
                      })
                      : null;
                    const kind = r.unit_kind === 'SUITE' || r.is_suite ? 'Suite' : 'Room';
                    const bedText = Array.isArray(r.bed_configs) && r.bed_configs.length
                      ? r.bed_configs.map((b) => `${b.bed_type_display || b.bed_type}×${b.quantity}`).join(', ')
                      : `${r.beds} bed${r.beds !== 1 ? 's' : ''}`;
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
                              alt={`${kind} ${r.room_number}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          </div>
                        )}
                        <div style={{ padding: r.image ? '14px 16px 16px' : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: 8 }}>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: isBooked ? '#b91c1c' : selected ? 'var(--primary)' : 'var(--secondary)' }}>
                            {kind} {r.room_number}
                          </span>
                          {isBooked ? (
                            <span style={{ fontSize: '9px', fontWeight: '800', padding: '3px 8px', borderRadius: '20px', background: '#fecaca', color: '#b91c1c', textTransform: 'uppercase' }}>Booked</span>
                          ) : selected ? (
                            <CheckCircle size={18} color="var(--primary)" />
                          ) : null}
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 6px 0' }}>
                          {r.parent_number ? `${r.parent_number} · ` : ''}{bedText}
                        </p>
                        <p style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: isBooked ? 'var(--text-muted)' : 'var(--secondary)' }}>
                          {formatRs(r.price_per_night)}
                          <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>
                            {' '}/ night · {getIncludedGuests(r)} incl.
                            {r.effective_max_guests ? ` · max ${r.effective_max_guests}` : ''}
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
                          ? formatReservationRoomLabel(selectedRoom, bookingNights, familyGuestsCount)
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
                  disabled={submitting || !form.room || !form.customer || isPrimaryBlocked}
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
            disabled={submitting || !form.room || !form.customer || isPrimaryBlocked}
          >
            {submitting ? 'Booking…' : 'Confirm reservation'}
          </button>
        </div>
      </form>
    </div>
  );
}
