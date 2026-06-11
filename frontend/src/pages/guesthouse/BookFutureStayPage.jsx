import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { format, addDays, parseISO, differenceInCalendarDays } from 'date-fns';
import {
  ChevronLeft, Calendar, User, BedDouble, Wallet, FileText,
  CheckCircle, X, HelpCircle, Sparkles, Users, CreditCard,
  Banknote, Building2, Globe,
} from 'lucide-react';
import { createStay, getAvailableRooms, listGhServices } from '../../api/guesthouse';
import { computeStayBilling } from '../../utils/ghBilling';
import { StayAddonsPicker, StayBillingBreakdown, GuestsCountHint } from '../../components/guesthouse/StayAddonsSection';
import client from '../../api/client';
import toast from 'react-hot-toast';
import AppLoader from '../../components/AppLoader';
import { usePermissions } from '../../hooks/usePermissions';
import CustomerSearchSelect from '../../components/CustomerSearchSelect';
import CnicScannerPanel from '../../components/guesthouse/CnicScannerPanel';
import ScannedGuestPanel from '../../components/guesthouse/ScannedGuestPanel';
import { formatRs } from '../../utils/currency';
import { customerDisplayName } from '../../utils/customer';
import {
  resolveGuestFromIdScan,
  isPhoneCompleteForAutoSave,
  saveGuestFromDraft,
} from '../../utils/idCardCustomer';

const METHOD_OPTIONS = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'BANK_TRANSFER', label: 'Bank', icon: Building2 },
  { value: 'ONLINE', label: 'Online', icon: Globe },
];

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

export default function BookFutureStayPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { canManage } = usePermissions();

  const prefillCheckIn = location.state?.check_in || searchParams.get('check_in') || '';
  const prefillCheckOut = location.state?.check_out || searchParams.get('check_out') || '';
  const prefillRoom = location.state?.room || searchParams.get('room') || '';
  const prefillCustomer = location.state?.prefillCustomer || searchParams.get('customer') || '';

  const [form, setForm] = useState({
    customer: prefillCustomer ? String(prefillCustomer) : '',
    room: prefillRoom ? String(prefillRoom) : '',
    check_in: prefillCheckIn,
    check_out: prefillCheckOut || (prefillCheckIn ? format(addDays(parseISO(prefillCheckIn), 1), 'yyyy-MM-dd') : ''),
    guests_count: 1,
    advance_paid: '',
    advance_payment_method: 'CASH',
    notes: '',
    status: 'CONFIRMED',
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
  const savingGuestRef = useRef(false);

  const toggleAddon = (id) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    if (!canManage) {
      toast.error('You do not have permission to book stays.');
      navigate('/gh/calendar');
    }
  }, [canManage, navigate]);

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
        setServices(svcList);
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
      if (form.room) setForm((f) => ({ ...f, room: '' }));
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

  const stayEstimate = useMemo(() => {
    if (!form.check_in || !form.check_out || !selectedRoom) return null;
    const nights = differenceInCalendarDays(parseISO(form.check_out), parseISO(form.check_in));
    if (nights <= 0) return { error: 'Check-out must be after check-in.' };
    const billing = computeStayBilling({
      room: selectedRoom,
      guestsCount: form.guests_count,
      nights,
      services,
      selectedServiceIds: selectedAddonIds,
    });
    const advance = Number(form.advance_paid) || 0;
    return {
      ...billing,
      nightly: billing.nightly,
      due: Math.max(0, billing.total - advance),
      error: null,
    };
  }, [form.check_in, form.check_out, form.guests_count, form.advance_paid, selectedRoom, services, selectedAddonIds]);

  const formattedDates = useMemo(() => {
    if (!form.check_in || !form.check_out) return null;
    try {
      return {
        checkIn: format(parseISO(form.check_in), 'EEE, MMM d, yyyy'),
        checkOut: format(parseISO(form.check_out), 'EEE, MMM d, yyyy'),
      };
    } catch {
      return null;
    }
  }, [form.check_in, form.check_out]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (stayEstimate?.error) {
      setFormError(stayEstimate.error);
      return;
    }
    if (!form.customer || !form.room) {
      setFormError('Please select a guest and room.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createStay({
        customer: Number(form.customer),
        room: Number(form.room),
        check_in: form.check_in,
        check_out: form.check_out,
        guests_count: Number(form.guests_count) || 1,
        advance_paid: parseFloat(form.advance_paid) || 0,
        advance_payment_method: form.advance_payment_method,
        addon_service_ids: selectedAddonIds,
        status: form.status,
        notes: form.notes,
      });
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

      {/* Hero header */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--surface) 60%)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          padding: '28px 32px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={10} /> Future booking
              </span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.03em', margin: 0, color: 'var(--secondary)' }}>
              Book a Stay
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '6px 0 0 0' }}>
              Reserve a room, collect advance, and secure the dates.
            </p>
        </div>
        {formattedDates && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <Calendar size={18} color="var(--primary)" />
            <div style={{ fontSize: '13px' }}>
              <span style={{ fontWeight: '700' }}>{formattedDates.checkIn}</span>
              <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>→</span>
              <span style={{ fontWeight: '700' }}>{formattedDates.checkOut}</span>
              {stayEstimate?.nights && (
                <span style={{ marginLeft: '10px', color: 'var(--primary)', fontWeight: '700', fontSize: '12px' }}>
                  {stayEstimate.nights} night{stayEstimate.nights !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

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
            marginBottom: '28px',
          }}
        >
          {formError || stayEstimate?.error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="booking-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Guest */}
            <div className="premium-card" style={{ padding: '28px' }}>
              <SectionHeader icon={User} title="Guest details" subtitle="Scan ID card or search guest for this reservation" />
              <CnicScannerPanel onScan={handleIdScan} disabled={loading || submitting || creatingGuest} />
              <ScannedGuestPanel
                draft={scannedGuest}
                loading={creatingGuest && !scannedGuest}
                saving={creatingGuest}
                onChange={handleScannedGuestChange}
                onPhoneChange={handleScannedPhoneChange}
                onSave={handleCreateGuestFromScan}
                onCancel={() => setScannedGuest(null)}
              />

              <div className="input-group" style={{ marginTop: '16px' }}>
                <label>Guest / Customer</label>
                <CustomerSearchSelect
                  customers={customers}
                  value={form.customer}
                  onChange={(customerId) => {
                    setForm({ ...form, customer: customerId });
                    if (customerId) setScannedGuest(null);
                  }}
                  placeholder="Search guest by name, phone, or CNIC…"
                  disabled={loading}
                />
                {form.customer && (
                  <Link
                    to={`/gh/customers/${form.customer}`}
                    style={{ marginTop: '10px', fontSize: '13px', fontWeight: '600', color: 'var(--primary)', display: 'inline-block' }}
                  >
                    View guest profile →
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/gh/customers', { state: { openCreate: true } })}
                  style={{ marginTop: '10px', fontSize: '13px', fontWeight: '600', color: 'var(--primary)', background: 'transparent', textAlign: 'left', display: 'block' }}
                >
                  + Add new customer manually
                </button>
              </div>
            </div>

            {/* Dates */}
            <div className="premium-card" style={{ padding: '28px' }}>
              <SectionHeader icon={Calendar} title="Stay period" subtitle="Check-in and check-out dates" />
              <div className="form-grid-2 form-grid-2--gap-24">
                <div className="input-group">
                  <label>Check-in date</label>
                  <input
                    required
                    type="date"
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
                    style={{ padding: '12px 14px', borderRadius: '10px' }}
                  />
                </div>
                <div className="input-group">
                  <label>Check-out date</label>
                  <input
                    required
                    type="date"
                    value={form.check_out}
                    min={form.check_in ? format(addDays(parseISO(form.check_in), 1), 'yyyy-MM-dd') : undefined}
                    onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                    style={{ padding: '12px 14px', borderRadius: '10px' }}
                  />
                </div>
                <div className="input-group">
                  <label>Number of guests</label>
                  <div style={{ position: 'relative' }}>
                    <Users size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="number"
                      min={1}
                      required
                      value={form.guests_count}
                      onChange={(e) => setForm({ ...form, guests_count: e.target.value })}
                      style={{ padding: '12px 14px 12px 36px', borderRadius: '10px', width: '100%' }}
                    />
                  </div>
                  <GuestsCountHint room={selectedRoom} guestsCount={form.guests_count} />
                </div>
                <div className="input-group">
                  <label>Booking status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px' }}
                  >
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Room selection cards */}
            <div className="premium-card" style={{ padding: '28px' }}>
              <SectionHeader icon={BedDouble} title="Select room" subtitle="All rooms are shown - booked rooms cannot be selected" />
              {availabilityLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Checking availability…</p>
              ) : !form.check_in || !form.check_out ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Select check-in and check-out dates first.</p>
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
                    return (
                      <button
                        key={r.id}
                        type="button"
                        disabled={isBooked}
                        onClick={() => !isBooked && setForm({ ...form, room: String(r.id) })}
                        style={{
                          textAlign: 'left',
                          padding: '18px',
                          borderRadius: '14px',
                          border: isBooked ? '1px solid #fecaca' : selected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: isBooked ? '#fef2f2' : selected ? 'var(--primary-light)' : 'var(--surface)',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          opacity: isBooked ? 0.75 : 1,
                          transition: 'all 0.15s ease',
                          boxShadow: selected && !isBooked ? '0 4px 16px rgba(91, 213, 30, 0.15)' : 'none',
                        }}
                      >
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
                          <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}> / night</span>
                        </p>
                      </button>
                    );
                  })}
                </div>
                </>
              )}
            </div>

            <StayAddonsPicker
              services={services}
              selectedIds={selectedAddonIds}
              onToggle={toggleAddon}
              nights={stayEstimate?.nights || 0}
              guestsCount={form.guests_count}
            />

            {/* Advance payment */}
            <div
              className="premium-card"
              style={{
                padding: '28px',
                background: 'linear-gradient(180deg, var(--surface) 0%, var(--primary-light) 100%)',
                border: '1px solid rgba(91, 213, 30, 0.25)',
              }}
            >
              <SectionHeader icon={Wallet} title="Advance payment" subtitle="Collect deposit to secure the booking (optional)" />
              <div className="form-grid-2 form-grid-2--gap-24">
                <div className="input-group">
                  <label>Advance amount (Rs)</label>
                  <input
                    type="number"
                    min={0}
                    step="100"
                    placeholder="0"
                    value={form.advance_paid}
                    onChange={(e) => setForm({ ...form, advance_paid: e.target.value })}
                    style={{ padding: '14px 16px', borderRadius: '10px', fontSize: '18px', fontWeight: '700' }}
                  />
                  {stayEstimate && !stayEstimate.error && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {[0, 25, 50, 100].map((pct) => {
                        const amt = pct === 0 ? 0 : Math.round(stayEstimate.total * pct / 100);
                        const label = pct === 0 ? 'None' : `${pct}%`;
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setForm({ ...form, advance_paid: amt ? String(amt) : '' })}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              border: '1px solid var(--border)',
                              background: Number(form.advance_paid) === amt ? 'var(--primary)' : 'var(--surface)',
                              color: Number(form.advance_paid) === amt ? '#fff' : 'var(--text-main)',
                              cursor: 'pointer',
                            }}
                          >
                            {label}{amt > 0 ? ` (${formatRs(amt)})` : ''}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="input-group">
                  <label>Payment method</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {METHOD_OPTIONS.map(({ value, label, icon: Icon }) => {
                      const active = form.advance_payment_method === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setForm({ ...form, advance_payment_method: value })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: active ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: active ? 'var(--primary-light)' : 'var(--surface)',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            color: active ? 'var(--primary)' : 'var(--text-main)',
                          }}
                        >
                          <Icon size={16} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
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
          <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="premium-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '18px', border: '1px solid var(--border)' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, #3da015 100%)',
                  padding: '22px 24px',
                  color: '#fff',
                }}
              >
                <p style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 0', opacity: 0.85 }}>
                  Booking summary
                </p>
                <p style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>
                  {stayEstimate && !stayEstimate.error ? formatRs(stayEstimate.total) : '-'}
                </p>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedRoom ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BedDouble size={18} color="var(--primary)" />
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '800', margin: 0 }}>Room {selectedRoom.room_number}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        {formatRs(selectedRoom.price_per_night)} / night
                      </p>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                    Select a room to see pricing
                  </p>
                )}

                {stayEstimate && !stayEstimate.error ? (
                  <>
                    <StayBillingBreakdown
                      billing={stayEstimate}
                      advance={Number(form.advance_paid) || 0}
                      compact
                    />
                  </>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Enter dates and select a room.
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
                  {submitting ? 'Booking…' : 'Confirm & Book Stay'}
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
      </form>
    </div>
  );
}
