import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, BedDouble, X,
} from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO,
} from 'date-fns';
import { getGuestHouseCalendar } from '../../api/guesthouse';
import toast from 'react-hot-toast';

export default function StayCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailStay, setDetailStay] = useState(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const fetchCal = async () => {
    setLoading(true);
    try {
      const data = await getGuestHouseCalendar({
        start: format(calStart, 'yyyy-MM-dd'),
        end: format(calEnd, 'yyyy-MM-dd'),
      });
      setStays(
        (data.stays || []).map((s) => ({
          ...s,
          checkInObj: parseISO(s.check_in),
          checkOutObj: parseISO(s.check_out),
        }))
      );
    } catch {
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCal(); }, [currentDate]);

  const staysOnDay = (day) => stays.filter((s) => {
    const d = format(day, 'yyyy-MM-dd');
    return s.check_in <= d && s.check_out > d;
  });

  const STATUS_COLORS = {
    PENDING: '#fbbf24',
    CONFIRMED: '#22c55e',
    CHECKED_IN: '#3b82f6',
    CHECKED_OUT: '#94a3b8',
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Stay Calendar</h2>
          <p style={{ color: 'var(--text-muted)' }}>Room occupancy by date.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => navigate('/gh/stays/new')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> New Stay
        </button>
      </div>

      <div className="premium-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button type="button" className="btn-secondary" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft /></button>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{format(currentDate, 'MMMM yyyy')}</h3>
          <button type="button" className="btn-secondary" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>{d}</div>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '32px' }}>Loading calendar…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {days.map((day) => {
              const dayStays = staysOnDay(day);
              const selected = isSameDay(day, selectedDate);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  style={{
                    minHeight: '90px',
                    padding: '8px',
                    borderRadius: '12px',
                    border: selected ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: isSameMonth(day, currentDate) ? 'var(--surface)' : 'var(--background)',
                    opacity: isSameMonth(day, currentDate) ? 1 : 0.5,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{format(day, 'd')}</span>
                  <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {dayStays.slice(0, 3).map((s) => (
                      <span
                        key={s.id}
                        onClick={(e) => { e.stopPropagation(); setDetailStay(s); }}
                        style={{
                          fontSize: '9px',
                          fontWeight: '600',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          background: STATUS_COLORS[s.status] || '#94a3b8',
                          color: 'white',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.room_number}
                      </span>
                    ))}
                    {dayStays.length > 3 && <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>+{dayStays.length - 3}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '24px', padding: '20px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={18} /> {format(selectedDate, 'EEEE, MMM d, yyyy')}
        </h4>
        {staysOnDay(selectedDate).length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No stays on this date.</p>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {staysOnDay(selectedDate).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/gh/stays/${s.id}`)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    cursor: 'pointer',
                  }}
                >
                  <strong>{s.booking_ref}</strong> — {s.customer_name} — Room {s.room_number} ({s.status})
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {detailStay && (
        <div className="modal-overlay" onClick={() => setDetailStay(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: '700' }}>{detailStay.booking_ref}</h3>
              <button type="button" onClick={() => setDetailStay(null)}><X size={22} /></button>
            </div>
            <p><BedDouble size={14} style={{ display: 'inline' }} /> Room {detailStay.room_number}</p>
            <p style={{ marginTop: '8px' }}>{detailStay.customer_name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{detailStay.check_in} → {detailStay.check_out}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <button type="button" className="btn-primary" style={{ width: '100%' }} onClick={() => navigate(`/gh/stays/${detailStay.id}`)}>
                View details
              </button>
              <button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={() => navigate(`/gh/print/stay/${detailStay.id}`)}>
                Print invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
