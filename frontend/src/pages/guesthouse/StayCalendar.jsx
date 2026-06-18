import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  ChevronRight as ChevronRightIcon, BedDouble,
} from 'lucide-react';
import {
  format, addMonths, subMonths, addDays, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isBefore, startOfDay,
} from 'date-fns';
import { getGuestHouseCalendar } from '../../api/guesthouse';
import toast from 'react-hot-toast';
import AppLoader from '../../components/AppLoader';
import { formatCollectDue, hasCollectDue } from '../../utils/currency';
import { usePermissions } from '../../hooks/usePermissions';
import StatusBadge from '../../components/ui/StatusBadge';
import CancelStayModal from '../../components/guesthouse/CancelStayModal';
import StayQuickViewModal from '../../components/guesthouse/StayQuickViewModal';

const STATUS_COLORS = {
  PENDING: '#fbbf24',
  CONFIRMED: '#22c55e',
  CHECKED_IN: '#3b82f6',
  CHECKED_OUT: '#94a3b8',
  CANCELLED: '#ef4444',
};

export default function StayCalendar() {
  const navigate = useNavigate();
  const { canOperate, canAccessPayments, canCancelStay } = usePermissions();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStay, setSelectedStay] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const fetchCal = async () => {
    setLoading(true);
    try {
      const calData = await getGuestHouseCalendar({
        start: format(calStart, 'yyyy-MM-dd'),
        end: format(calEnd, 'yyyy-MM-dd'),
      });
      setStays(
        (calData.stays || []).map((s) => ({
          ...s,
          checkInObj: parseISO(s.check_in),
          checkOutObj: parseISO(s.check_out),
        })),
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

  const goToBook = (date = null) => {
    if (!canOperate) {
      toast.error('You do not have permission to create stays.');
      return;
    }
    const checkIn = date ? format(date, 'yyyy-MM-dd') : format(selectedDate, 'yyyy-MM-dd');
    const checkOut = format(addDays(date || selectedDate, 1), 'yyyy-MM-dd');
    navigate(`/gh/book?check_in=${checkIn}&check_out=${checkOut}`);
  };

  const isFutureDay = (day) => !isBefore(startOfDay(day), startOfDay(new Date()));

  const stayDue = (s) => Math.max(0, Number(s.total_amount) - Number(s.advance_paid));

  return (
    <div className="animate-fade-in">
      <div className="calendar-layout">
        <div className="premium-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <button type="button" className="btn-secondary" onClick={() => setCurrentDate(subMonths(currentDate, 1))} aria-label="Previous month"><ChevronLeft /></button>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{format(currentDate, 'MMMM yyyy')}</h3>
            <button type="button" className="btn-secondary" onClick={() => setCurrentDate(addMonths(currentDate, 1))} aria-label="Next month"><ChevronRight /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>

          {loading ? (
            <AppLoader inline message="Loading calendar…" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {days.map((day) => {
                const dayStays = staysOnDay(day);
                const selected = isSameDay(day, selectedDate);
                const future = isFutureDay(day);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    onDoubleClick={() => future && canOperate && goToBook(day)}
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
                    <span style={{ fontSize: '13px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                      {format(day, 'd')}
                      {future && isSameMonth(day, currentDate) && canOperate && (
                        <Plus size={12} color="var(--primary)" />
                      )}
                    </span>
                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {dayStays.slice(0, 3).map((s) => (
                        <span
                          key={s.id}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); setSelectedStay(s); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              e.preventDefault();
                              setSelectedStay(s);
                            }
                          }}
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
                            cursor: 'pointer',
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

        <div className="premium-card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <CalendarIcon size={18} /> {format(selectedDate, 'EEEE, MMM d, yyyy')}
            {isFutureDay(selectedDate) && (
              <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                Future
              </span>
            )}
          </h4>
          {staysOnDay(selectedDate).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <p>No stays on this date.</p>
              {canOperate && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => goToBook(selectedDate)}
                  style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}
                >
                  <Plus size={16} /> Book stay for this date
                </button>
              )}
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {staysOnDay(selectedDate).map((s) => {
                const due = stayDue(s);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedStay(s)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '14px',
                        borderRadius: '12px',
                        border: selectedStay?.id === s.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: 'var(--surface)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: '800', fontSize: '14px', margin: '0 0 4px 0' }}>{s.customer_name}</p>
                        <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--primary)', margin: '0 0 6px 0' }}>{s.booking_ref}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
                          Room {s.room_number}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <StatusBadge status={s.status} />
                          {hasCollectDue(due) && (
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#b91c1c' }}>
                              Due {formatCollectDue(due)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRightIcon size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <StayQuickViewModal
        stay={selectedStay}
        onClose={() => setSelectedStay(null)}
        onCancel={(stay) => {
          setCancelTarget(stay);
          setSelectedStay(null);
        }}
        canAccessPayments={canAccessPayments}
        canCancelStay={canCancelStay}
      />

      <CancelStayModal
        stay={cancelTarget}
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelled={() => {
          setCancelTarget(null);
          fetchCal();
        }}
      />
    </div>
  );
}
