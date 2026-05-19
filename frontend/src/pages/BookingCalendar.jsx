import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User as UserIcon,
  X
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, eachDayOfInterval, parseISO } from 'date-fns';
import client from '../api/client';
import toast from 'react-hot-toast';

const BookingCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [halls, setHalls] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    customer: '',
    venue: '',
    event_name: '',
    start_date: '',
    end_date: '',
    guest_count: '',
    total_price: '',
    advance_paid: '',
    booking_status: 'CONFIRMED'
  });
  const [bookingError, setBookingError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookRes, hallsRes, custRes] = await Promise.all([
        client.get('/bookings/'),
        client.get('/venues/'),
        client.get('/customers/')
      ]);
      
      const list = bookRes.data.results || bookRes.data || [];
      setBookings(list.map(b => ({ ...b, dateObj: parseISO(b.start_date) })));
      setHalls(hallsRes.data.results || hallsRes.data || []);
      setCustomers(custRes.data.results || custRes.data || []);
    } catch (err) {
      toast.error('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (date = null) => {
    setBookingError('');
    setFormData({
      ...formData,
      start_date: date ? format(date, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm")
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    // Frontend capacity check
    const selectedHall = halls.find(h => String(h.id) === String(formData.venue));
    if (selectedHall && parseInt(formData.guest_count) > selectedHall.capacity) {
      setBookingError(
        `Guest count (${formData.guest_count}) exceeds '${selectedHall.name}' capacity of ${selectedHall.capacity} seats. Please reduce guests or pick a bigger hall.`
      );
      return;
    }

    try {
      const payload = {
        ...formData,
        guest_count: parseInt(formData.guest_count),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date || formData.start_date).toISOString()
      };
      await client.post('/bookings/', payload);
      toast.success('Booking created');
      setShowModal(false);
      setBookingError('');
      fetchData();
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.non_field_errors?.[0]
        || (typeof Object.values(errData || {})?.[0] === 'object' ? Object.values(errData)?.[0]?.[0] : Object.values(errData)?.[0])
        || 'Booking conflict!';
      setBookingError(msg);
      toast.error('Booking failed — see details below');
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getBookingsForDay = (day) => {
    return bookings.filter(booking => isSameDay(booking.dateObj, day));
  };

  return (
    <>
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Booking Calendar</h2>
          <p style={{ color: 'var(--text-muted)' }}>Visualize your venue schedule and upcoming events.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> New Booking
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', height: 'calc(100vh - 250px)' }}>
        <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{format(currentDate, 'MMMM yyyy')}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="btn-secondary" style={{ padding: '8px' }}><ChevronLeft size={20} /></button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="btn-secondary" style={{ padding: '8px' }}><ChevronRight size={20} /></button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{day}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, overflow: 'auto' }}>
            {calendarDays.map((day, idx) => {
              const dayBookings = getBookingsForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);

              return (
                <div key={idx} onClick={() => setSelectedDate(day)} style={{ padding: '12px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', backgroundColor: isSelected ? 'var(--primary-light)' : 'white', opacity: isCurrentMonth ? 1 : 0.4, cursor: 'pointer', minHeight: '120px', transition: 'all 0.2s ease' }}>
                  <div style={{ fontSize: '14px', fontWeight: isSelected ? '700' : '500', color: isSelected ? 'var(--primary)' : 'var(--text-main)', marginBottom: '8px' }}>{format(day, 'd')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {dayBookings.map(b => (
                      <div key={b.id} style={{ fontSize: '10px', padding: '4px 6px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.event_name}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="premium-card">
            <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarIcon size={20} color="var(--primary)" /> {format(selectedDate, 'PPP')}
            </h3>
            {getBookingsForDay(selectedDate).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {getBookingsForDay(selectedDate).map(booking => (
                  <div key={booking.id} style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '16px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '700' }}>{booking.event_name}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{booking.customer_name} • {booking.venue_name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <p>No bookings for this day.</p>
                <button onClick={() => handleOpenModal(selectedDate)} style={{ color: 'var(--primary)', fontWeight: '600', marginTop: '12px', backgroundColor: 'transparent' }}>+ Create One</button>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>New Reservation</h3>
              <button onClick={() => setShowModal(false)} style={{ backgroundColor: 'transparent', color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group"><label>Event Name</label><input required value={formData.event_name} onChange={(e) => setFormData({...formData, event_name: e.target.value})} placeholder="e.g. Jenkins Wedding" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group"><label>Customer</label><select required value={formData.customer} onChange={(e) => setFormData({...formData, customer: e.target.value})}><option value="">Select Customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select></div>
                <div className="input-group"><label>Venue</label><select required value={formData.venue} onChange={(e) => { const v = halls.find(h => h.id === e.target.value); setFormData({...formData, venue: e.target.value, total_price: v ? v.price_per_day : ''}); }}><option value="">Select Venue</option>{halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group"><label>Start Date</label><input type="datetime-local" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} /></div>
                <div className="input-group">
                  <label>Guests {(() => {
                    const sel = halls.find(h => String(h.id) === String(formData.venue));
                    return sel ? <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>(Max: {sel.capacity})</span> : null;
                  })()}</label>
                  <input type="number" required value={formData.guest_count} onChange={(e) => setFormData({...formData, guest_count: e.target.value})} />
                  {(() => {
                    const sel = halls.find(h => String(h.id) === String(formData.venue));
                    if (sel && formData.guest_count && parseInt(formData.guest_count) > sel.capacity) {
                      return <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>⚠️ Exceeds {sel.name} capacity ({sel.capacity} seats)</p>;
                    }
                    return null;
                  })()}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group"><label>Total Price (PKR)</label><input type="number" required value={formData.total_price} onChange={(e) => setFormData({...formData, total_price: e.target.value})} /></div>
                <div className="input-group"><label>Advance Paid (PKR)</label><input type="number" required value={formData.advance_paid} onChange={(e) => setFormData({...formData, advance_paid: e.target.value})} /></div>
              </div>
              {bookingError && (
                <div style={{
                  backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
                  padding: '14px 16px', color: '#b91c1c', fontSize: '13px', fontWeight: '600',
                  lineHeight: '1.5'
                }}>
                  ⚠️ {bookingError}
                </div>
              )}
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px' }}>Confirm Booking</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingCalendar;
