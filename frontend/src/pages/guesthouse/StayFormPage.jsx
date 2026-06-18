import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  ChevronLeft, Sparkles, BedDouble, FileText, CheckCircle, X, HelpCircle,
} from 'lucide-react';
import { createStay, updateStay, getStay, listRooms, getAvailableRooms, listGhServices } from '../../api/guesthouse';
import { computeStayBilling } from '../../utils/ghBilling';
import { StayAddonsPicker, StayBillingBreakdown, GuestsCountHint } from '../../components/guesthouse/StayAddonsSection';
import CustomerSearchSelect from '../../components/CustomerSearchSelect';
import CnicScannerPanel from '../../components/guesthouse/CnicScannerPanel';
import ScannedGuestPanel from '../../components/guesthouse/ScannedGuestPanel';
import client from '../../api/client';
import toast from 'react-hot-toast';
import AppLoader from '../../components/AppLoader';
import { usePermissions } from '../../hooks/usePermissions';
import { useGhPageVisibility } from '../../context/GhPageVisibilityContext';
import { GH_MODULE_KEYS } from '../../constants/ghPages';
import { customerDisplayName } from '../../utils/customer';
import {
  resolveGuestFromIdScan,
  isPhoneCompleteForAutoSave,
  saveGuestFromDraft,
} from '../../utils/idCardCustomer';
import { formatRs } from '../../utils/currency';

const METHOD_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'ONLINE', label: 'Online' },
];

const emptyForm = {
  customer: '',
  room: '',
  check_in: '',
  check_out: '',
  guests_count: 1,
  advance_paid: 0,
  advance_payment_method: 'CASH',
  notes: '',
  status: 'CONFIRMED',
};

const sectionTitle = (label) => (
  <h3
    style={{
      fontSize: '13px',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
      color: 'var(--primary)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      margin: 0,
    }}
  >
    <span style={{ width: '4px', height: '16px', backgroundColor: 'var(--primary)', borderRadius: '2px' }} />
    {label}
  </h3>
);

export default function StayFormPage() {
  const { stayId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { canOperate } = usePermissions();
  const { isModuleVisible } = useGhPageVisibility();
  const showIdScanner = isModuleVisible(GH_MODULE_KEYS.ID_SCANNER);
  const isEdit = Boolean(stayId);

  const prefillCheckIn = location.state?.check_in || searchParams.get('check_in') || '';
  const prefillCheckOut = location.state?.check_out || searchParams.get('check_out') || '';
  const prefillRoom = location.state?.room || searchParams.get('room') || '';

  const [form, setForm] = useState(emptyForm);
  const [rooms, setRooms] = useState([]);
  const [bookedRoomIds, setBookedRoomIds] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookingRef, setBookingRef] = useState('');
  const [services, setServices] = useState([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [scanProcessing, setScanProcessing] = useState(false);
  const [scannedGuest, setScannedGuest] = useState(null);
  const [savingGuest, setSavingGuest] = useState(false);
  const savingGuestRef = useRef(false);

  const toggleAddon = (id) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

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
    setSavingGuest(true);
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
        toast.success(`New guest saved: ${customerDisplayName(match)}`, { id: 'id-scan' });
      }
      return true;
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.cnic?.[0] || data?.phone?.[0] || data?.detail || 'Failed to save guest';
      toast.error(msg);
      return false;
    } finally {
      savingGuestRef.current = false;
      setSavingGuest(false);
    }
  };

  const handleIdScan = async (parsed) => {
    if (scanProcessing || isEdit) return;
    setScannedGuest(null);
    setForm((f) => ({ ...f, customer: '' }));
    setScanProcessing(true);
    try {
      const result = await resolveGuestFromIdScan(parsed, { customers });
      if (result.status === 'invalid') {
        toast.error('Could not read ID card. Scan again or upload a clearer photo.');
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
        selectGuest(created);
        toast.success(`New guest saved: ${customerDisplayName(created)}`, { id: 'id-scan' });
        return;
      }
      setScannedGuest(result.draft);
      setForm((f) => ({ ...f, customer: '' }));
      toast('ID card read — check fields and add phone', { id: 'id-scan', icon: 'ℹ️' });
    } catch {
      toast.error('Failed to process ID card scan');
    } finally {
      setScanProcessing(false);
    }
  };

  const handleScannedGuestChange = (field, value) => {
    setScannedGuest((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleScannedPhoneChange = async (value) => {
    if (!scannedGuest) return;
    const next = { ...scannedGuest, phone: value };
    setScannedGuest(next);
    if (isPhoneCompleteForAutoSave(value)) {
      await saveGuestFromScan(next);
    }
  };

  useEffect(() => {
    if (!canOperate) {
      toast.error('You do not have permission to manage stays.');
      navigate('/gh/stays');
    }
  }, [canOperate, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [roomData, custRes, svcList] = await Promise.all([
          listRooms({ status: 'ACTIVE' }),
          client.get('/customers/'),
          listGhServices(),
        ]);
        setRooms(roomData);
        setServices(svcList);
        const custData = custRes.data?.results || custRes.data || [];
        setCustomers(Array.isArray(custData) ? custData : []);

        if (isEdit && stayId) {
          const s = await getStay(stayId);
          setBookingRef(s.booking_ref || '');
          const addonIds = (s.charges || [])
            .filter((c) => c.service)
            .map((c) => c.service);
          setSelectedAddonIds(addonIds);
          setForm({
            customer: String(s.customer),
            room: String(s.room),
            check_in: s.check_in,
            check_out: s.check_out,
            guests_count: s.guests_count,
            advance_paid: s.advance_paid,
            advance_payment_method: 'CASH',
            notes: s.notes || '',
            status: s.status,
          });
        } else if (prefillCheckIn || prefillRoom) {
          setForm((f) => ({
            ...f,
            check_in: prefillCheckIn || f.check_in,
            check_out: prefillCheckOut || f.check_out,
            room: prefillRoom ? String(prefillRoom) : f.room,
          }));
        }
      } catch {
        toast.error('Failed to load form data');
        navigate('/gh/stays');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEdit, stayId, navigate, prefillCheckIn, prefillCheckOut, prefillRoom]);

  useEffect(() => {
    if (!form.check_in || !form.check_out) {
      setBookedRoomIds([]);
      return undefined;
    }
    let cancelled = false;
    const loadAvailability = async () => {
      try {
        const params = { check_in: form.check_in, check_out: form.check_out };
        if (isEdit && stayId) params.exclude_stay = stayId;
        const data = await getAvailableRooms(params);
        if (cancelled) return;
        const booked = new Set((data.booked_room_ids || []).map(String));
        setBookedRoomIds([...booked]);
        if (form.room && booked.has(String(form.room))) {
          setForm((f) => ({ ...f, room: '' }));
        }
      } catch {
        if (!cancelled) setBookedRoomIds([]);
      }
    };
    loadAvailability();
    return () => { cancelled = true; };
  }, [form.check_in, form.check_out, isEdit, stayId]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => String(r.id) === String(form.room)),
    [rooms, form.room],
  );

  const stayEstimate = useMemo(() => {
    if (!form.check_in || !form.check_out || !selectedRoom) return null;
    const nights = Math.round(
      (new Date(form.check_out) - new Date(form.check_in)) / (1000 * 60 * 60 * 24),
    );
    if (nights <= 0) return { error: 'Check-out must be after check-in.' };
    const billing = computeStayBilling({
      room: selectedRoom,
      guestsCount: form.guests_count,
      nights,
      services,
      selectedServiceIds: selectedAddonIds,
    });
    const advance = Number(form.advance_paid) || 0;
    return { ...billing, due: Math.max(0, billing.total - advance) };
  }, [form.check_in, form.check_out, form.guests_count, form.advance_paid, selectedRoom, services, selectedAddonIds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.customer) {
      setFormError('Please select a guest');
      return;
    }
    if (!form.room) {
      setFormError('Please select a room');
      return;
    }
    if (stayEstimate?.error) {
      setFormError(stayEstimate.error);
      return;
    }
    setSubmitting(true);
    const payload = {
      customer: Number(form.customer),
      room: Number(form.room),
      check_in: form.check_in,
      check_out: form.check_out,
      guests_count: Number(form.guests_count),
      addon_service_ids: selectedAddonIds,
      notes: form.notes,
      status: form.status,
    };
    if (!isEdit) {
      payload.advance_paid = Number(form.advance_paid) || 0;
      payload.advance_payment_method = form.advance_payment_method;
    }

    try {
      if (isEdit) {
        await updateStay(stayId, payload);
        toast.success('Stay updated');
        navigate(`/gh/stays/${stayId}`);
      } else {
        const created = await createStay(payload);
        toast.success('Stay booked');
        if (Number(form.advance_paid) > 0) {
          navigate(`/gh/print/stay/${created.id}?doc=advance`);
        } else {
          navigate(`/gh/stays/${created.id}`);
        }
      }
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Could not save stay';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <AppLoader message="Loading…" />;
  }

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '24px',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={() => navigate(isEdit ? `/gh/stays/${stayId}` : '/gh/stays')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
              }}
              aria-label="Back"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                {isEdit ? `Updating ${bookingRef}` : 'Reserve a room and record guest stay details.'}
              </p>
            </div>
          </div>
          {!isEdit && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={12} /> Draft
            </span>
          )}
        </div>

        {(formError || stayEstimate?.error) && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '16px 20px',
              color: '#b91c1c',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '32px',
            }}
          >
            {formError || stayEstimate?.error}
          </div>
        )}

        <div className="booking-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {!isEdit && showIdScanner && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {sectionTitle('ID card scan')}
                <div className="premium-card" style={{ padding: '20px' }}>
                  <CnicScannerPanel onScan={handleIdScan} disabled={submitting || scanProcessing || savingGuest} />
                  <ScannedGuestPanel
                    draft={scannedGuest}
                    loading={scanProcessing}
                    saving={savingGuest}
                    onChange={handleScannedGuestChange}
                    onPhoneChange={handleScannedPhoneChange}
                    onSave={() => saveGuestFromScan(scannedGuest)}
                    onCancel={() => setScannedGuest(null)}
                  />
                </div>
              </section>
            )}

            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sectionTitle('Guest & room')}
              <div className="premium-card form-grid-2 form-grid-2--gap-24" style={{ padding: '28px' }}>
                <div className="input-group">
                  <label>Guest / Customer</label>
                  <CustomerSearchSelect
                    customers={customers}
                    value={form.customer}
                    onChange={(id) => setForm({ ...form, customer: id })}
                    disabled={submitting}
                  />
                  {form.customer && (
                    <Link
                      to={`/gh/customers/${form.customer}`}
                      style={{ marginTop: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--primary)', display: 'inline-block' }}
                    >
                      View guest profile →
                    </Link>
                  )}
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={() => navigate('/gh/customers', { state: { openCreate: true } })}
                      style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--primary)',
                        background: 'transparent',
                        textAlign: 'left',
                        display: 'block',
                      }}
                    >
                      + Add new customer
                    </button>
                  )}
                </div>
                <div className="input-group">
                  <label>Room</label>
                  <select
                    required
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Room</option>
                    {rooms.map((r) => {
                      const isBooked = bookedRoomIds.includes(String(r.id));
                      return (
                        <option key={r.id} value={r.id} disabled={isBooked}>
                          Room {r.room_number} - Rs {parseFloat(r.price_per_night).toLocaleString()}/night{isBooked ? ' (Booked)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {form.check_in && form.check_out && bookedRoomIds.length > 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Rooms marked &quot;Booked&quot; are unavailable for the selected dates.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sectionTitle('Stay dates')}
              <div className="premium-card form-grid-2 form-grid-2--gap-24" style={{ padding: '28px' }}>
                <div className="input-group">
                  <label>Check-in</label>
                  <input
                    required
                    type="date"
                    value={form.check_in}
                    onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Check-out</label>
                  <input
                    required
                    type="date"
                    value={form.check_out}
                    min={form.check_in || undefined}
                    onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Number of guests</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.guests_count}
                    onChange={(e) => setForm({ ...form, guests_count: e.target.value })}
                  />
                  <GuestsCountHint room={selectedRoom} guestsCount={form.guests_count} />
                </div>
                {isEdit ? (
                  <div className="input-group">
                    <label>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="CHECKED_IN">Checked in</option>
                      <option value="CHECKED_OUT">Checked out</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                ) : (
                  <div className="input-group">
                    <label>Initial status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                )}
              </div>
            </section>

            <StayAddonsPicker
              services={services}
              selectedIds={selectedAddonIds}
              onToggle={toggleAddon}
              nights={stayEstimate?.nights || 0}
              guestsCount={form.guests_count}
            />

            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sectionTitle('Notes')}
              <div className="premium-card" style={{ padding: '28px' }}>
                <div className="input-group">
                  <label>Special requests <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Arrival time, ID details, dietary needs…"
                    style={{ width: '100%', resize: 'vertical', minHeight: '96px' }}
                  />
                </div>
              </div>
            </section>
          </div>

          <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="premium-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div
                style={{
                  backgroundColor: 'var(--primary-light)',
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <FileText size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', margin: 0 }}>
                  Stay summary
                </h3>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedRoom ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <BedDouble size={20} color="var(--primary)" />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', margin: 0 }}>Room {selectedRoom.room_number}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        {formatRs(selectedRoom.price_per_night)} / night
                      </p>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Select a room to see pricing.</p>
                )}

                {stayEstimate && !stayEstimate.error ? (
                  <>
                    <StayBillingBreakdown
                      billing={stayEstimate}
                      advance={isEdit ? undefined : Number(form.advance_paid) || 0}
                      compact
                    />
                    {!isEdit && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Advance paid</span>
                          <input
                            type="number"
                            min={0}
                            value={form.advance_paid}
                            onChange={(e) => setForm({ ...form, advance_paid: e.target.value })}
                            style={{ width: '110px', padding: '6px 10px', fontSize: '13px', textAlign: 'right', fontWeight: '700' }}
                          />
                        </div>
                        <div className="input-group" style={{ marginTop: '4px' }}>
                          <label style={{ fontSize: '11px' }}>Advance method</label>
                          <select
                            value={form.advance_payment_method}
                            onChange={(e) => setForm({ ...form, advance_payment_method: e.target.value })}
                            style={{ width: '100%', fontSize: '13px' }}
                          >
                            {METHOD_OPTIONS.map((m) => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                        </div>
                        <div
                          style={{
                            backgroundColor: 'var(--background)',
                            padding: '16px',
                            borderRadius: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                          }}
                        >
                          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            Balance due
                          </span>
                          <span style={{ fontSize: '20px', fontWeight: '900', color: stayEstimate.due > 0 ? 'var(--error)' : 'var(--primary)' }}>
                            {formatRs(stayEstimate.due)}
                          </span>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    Enter check-in and check-out dates to calculate the bill.
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '14px',
                    marginTop: '8px',
                  }}
                >
                  <CheckCircle size={18} />
                  {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Confirm & Book Stay'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate(isEdit ? `/gh/stays/${stayId}` : '/gh/stays')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                  }}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--primary-light)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              <h4
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '0 0 10px 0',
                }}
              >
                <HelpCircle size={14} /> Note
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                Total is calculated as room rate × nights. Record additional payments anytime from the Payments page.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
