import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format, parseISO, differenceInCalendarDays, isSameDay, addDays,
} from 'date-fns';
import {
  Plus, Eye, Pencil, Printer, CalendarCheck,
  BedDouble, Wallet, CreditCard, CalendarDays, User, Phone, XCircle,
  ChevronLeft, ChevronRight, Archive,
} from 'lucide-react';
import CancelStayModal from '../../components/guesthouse/CancelStayModal';
import SearchInput from '../../components/SearchInput';
import { listStays } from '../../api/guesthouse';
import toast from 'react-hot-toast';
import AppLoader from '../../components/AppLoader';
import { usePermissions } from '../../hooks/usePermissions';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { formatRs, formatCollectDuePKR, hasCollectDue } from '../../utils/currency';
import { canCancelGhStay } from '../../utils/ghStay';
import { stayActiveOnDay, todayISO } from '../../utils/ghDate';
import '../../styles/dashboard.css';
import './stays-list.css';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pending', label: 'Pending' },
  { id: 'balance_due', label: 'Due' },
];

const formatStayDate = (d) => {
  if (!d) return '-';
  try {
    return format(parseISO(d), 'dd MMM yyyy');
  } catch {
    return d;
  }
};

const stayNights = (checkIn, checkOut) => {
  try {
    return Math.max(differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)), 1);
  } catch {
    return 0;
  }
};

const formatDayHeading = (dateStr, todayStr) => {
  if (!dateStr) return 'No date';
  try {
    const d = parseISO(dateStr);
    const today = parseISO(todayStr);
    const base = format(d, 'dd MMM yyyy');
    if (isSameDay(d, today)) return `Today · ${base}`;
    if (isSameDay(d, addDays(today, 1))) return `Tomorrow · ${base}`;
    if (isSameDay(d, addDays(today, -1))) return `Yesterday · ${base}`;
    return format(d, 'EEEE, dd MMM yyyy');
  } catch {
    return dateStr;
  }
};

function StayCard({ stay, today, canManage, canCancelStay, onOpen, onPay, onPrint, onEdit, onCancel, showDates }) {
  const due = stay.status === 'CANCELLED'
    ? 0
    : Math.max(0, Number(stay.total_amount) - Number(stay.advance_paid));
  const nights = stayNights(stay.check_in, stay.check_out);
  const isUpcoming = stay.check_in >= today && !['CANCELLED', 'CHECKED_OUT'].includes(stay.status);
  const paidPct = Number(stay.total_amount) > 0
    ? Math.min(100, Math.round((Number(stay.advance_paid) / Number(stay.total_amount)) * 100))
    : 0;

  return (
    <article className="stay-card" onClick={onOpen}>
      <div className="stay-card__top">
        <div className="stay-card__top-left">
          <p className="stay-card__ref">{stay.booking_ref}</p>
          <h3 className="stay-card__name">{stay.customer_name || 'Guest'}</h3>
          {stay.customer_phone && (
            <p className="stay-card__phone"><Phone size={11} /> {stay.customer_phone}</p>
          )}
          {showDates && (
            <p className="stay-card__search-dates">
              {formatStayDate(stay.check_in)} → {formatStayDate(stay.check_out)}
            </p>
          )}
        </div>
        <div className="stay-card__badges">
          <StatusBadge status={stay.status} />
          {isUpcoming && <span className="stay-card__future">Future</span>}
        </div>
      </div>

      <div className="stay-card__body">
        <div className="stay-card__info">
          <div className="stay-card__cell">
            <p className="stay-card__cell-label">Room</p>
            <p className="stay-card__cell-val stay-card__cell-val--room">{stay.room_number}</p>
          </div>
          <div className="stay-card__cell">
            <p className="stay-card__cell-label">Duration</p>
            <p className="stay-card__cell-val">{nights} night{nights !== 1 ? 's' : ''}</p>
            {!showDates && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                {formatStayDate(stay.check_in)} → {formatStayDate(stay.check_out)}
              </p>
            )}
          </div>
        </div>

        <div className="stay-card__pay">
          <div className="stay-card__pay-head">
            <span>Payment</span>
            <StatusBadge status={stay.payment_status} />
          </div>
          <div className="stay-card__bar">
            <div
              className="stay-card__bar-fill"
              style={{
                width: `${paidPct}%`,
                background: paidPct >= 100 ? '#22c55e' : 'var(--primary)',
              }}
            />
          </div>
          <div className="stay-card__amounts">
            <div>
              <p className="stay-card__amt-l">Total</p>
              <p className="stay-card__amt-v">{formatRs(stay.total_amount)}</p>
            </div>
            <div>
              <p className="stay-card__amt-l">Paid</p>
              <p className="stay-card__amt-v" style={{ color: '#166534' }}>{formatRs(stay.advance_paid)}</p>
            </div>
            <div>
              <p className="stay-card__amt-l">Due</p>
              <p className="stay-card__amt-v" style={{ color: hasCollectDue(due) ? '#b91c1c' : 'var(--text-muted)' }}>
                {formatCollectDuePKR(due)}
              </p>
            </div>
          </div>
        </div>

        {canCancelStay && onCancel && canCancelGhStay(stay) && (
          <button
            type="button"
            className="stay-card__cancel"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            <XCircle size={14} /> Cancel stay
          </button>
        )}
      </div>

      <div className="stay-card__foot" onClick={(e) => e.stopPropagation()}>
        {hasCollectDue(due) && onPay && (
          <button type="button" className="btn-primary" onClick={onPay}>
            <CreditCard size={14} /> Collect
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={onOpen} title="View">
          <Eye size={15} />
        </button>
        <button type="button" className="btn-secondary" onClick={onPrint} title="Receipt">
          <Printer size={15} />
        </button>
        {canManage && stay.status !== 'CANCELLED' && stay.status !== 'CHECKED_OUT' && (
          <button type="button" className="btn-secondary" onClick={onEdit} title="Edit">
            <Pencil size={15} />
          </button>
        )}
      </div>
    </article>
  );
}

const GuestHouseStays = () => {
  const navigate = useNavigate();
  const { canManage, canAccessPayments, canCancelStay } = usePermissions();
  const [stays, setStays] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(() => todayISO());
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const today = todayISO();

  const isSearching = searchQuery.trim().length > 0;

  const load = async () => {
    setLoading(true);
    try {
      setStays(await listStays());
    } catch {
      toast.error('Failed to load stays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getDue = (s) => (
    s.status === 'CANCELLED'
      ? 0
      : Math.max(0, Number(s.total_amount) - Number(s.advance_paid))
  );

  const matchesFilter = (s, filterId) => {
    const due = getDue(s);
    if (filterId === 'upcoming') {
      return s.check_in >= today && !['CANCELLED', 'CHECKED_OUT'].includes(s.status);
    }
    if (filterId === 'pending') return s.status === 'PENDING';
    if (filterId === 'balance_due') {
      return due > 0 && !['CANCELLED', 'CHECKED_OUT'].includes(s.status);
    }
    return true;
  };

  const scopeStays = useMemo(() => {
    if (isSearching) return stays;
    return stays.filter((s) => stayActiveOnDay(s, selectedDate));
  }, [stays, isSearching, selectedDate]);

  const metrics = useMemo(() => {
    const active = scopeStays.filter((s) => s.status !== 'CANCELLED');
    const upcoming = active.filter((s) => s.check_in >= today && !['CHECKED_OUT'].includes(s.status));
    const checkedIn = active.filter((s) => s.status === 'CHECKED_IN');
    const totalDue = active.reduce((sum, s) => sum + getDue(s), 0);
    return {
      total: active.length,
      upcoming: upcoming.length,
      checkedIn: checkedIn.length,
      totalDue,
    };
  }, [scopeStays, today]);

  const tabCounts = useMemo(() => {
    const counts = {};
    FILTER_TABS.forEach((tab) => {
      counts[tab.id] = scopeStays.filter((s) => matchesFilter(s, tab.id)).length;
    });
    return counts;
  }, [scopeStays, today]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopeStays
      .filter((s) => {
        const matchesSearch = !q || (
          (s.booking_ref || '').toLowerCase().includes(q)
          || (s.customer_name || '').toLowerCase().includes(q)
          || (s.room_number || '').toLowerCase().includes(q)
          || (s.customer_phone || '').toLowerCase().includes(q)
        );
        return matchesSearch && matchesFilter(s, activeFilter);
      })
      .sort((a, b) => {
        const roomCmp = String(a.room_number || '').localeCompare(String(b.room_number || ''), undefined, { numeric: true });
        if (roomCmp !== 0) return roomCmp;
        return String(a.booking_ref || '').localeCompare(String(b.booking_ref || ''));
      });
  }, [scopeStays, searchQuery, activeFilter, today]);

  const shiftDate = (days) => {
    try {
      setSelectedDate(format(addDays(parseISO(selectedDate), days), 'yyyy-MM-dd'));
    } catch {
      /* ignore */
    }
  };

  const resetView = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setSelectedDate(today);
  };

  const openCreate = () => {
    if (!canManage) {
      toast.error('You do not have permission to create stays.');
      return;
    }
    navigate('/gh/book');
  };

  const dayHeading = formatDayHeading(selectedDate, today);
  const isSelectedToday = selectedDate === today;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="page-header">
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: '800', margin: 0 }}>Stay Reservations</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            Daily view - today&apos;s in-house and check-in stays. Search or open All Records for other dates.
          </p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/gh/settings?tab=records')}>
            <Archive size={18} /> All Records
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/gh/calendar')}>
            <CalendarDays size={18} /> Calendar
          </button>
          {canManage && (
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus size={18} /> Book Stay
            </button>
          )}
        </div>
      </div>

      <section className="dash-kpi-grid" style={{ marginBottom: '24px' }}>
        <StatCard label={isSearching ? 'Matches' : 'On this day'} value={metrics.total} icon={BedDouble} variant="primary" />
        <StatCard label="Upcoming" value={metrics.upcoming} icon={CalendarCheck} variant="info" to="/gh/calendar" />
        <StatCard label="Checked in" value={metrics.checkedIn} icon={User} variant="success" />
        <StatCard
          label="Outstanding due"
          value={metrics.totalDue}
          icon={Wallet}
          variant={metrics.totalDue > 0 ? 'danger' : 'info'}
          isCurrency
          to={canAccessPayments ? '/gh/payments' : undefined}
        />
      </section>

      {!isSearching && (
        <div className="stays-date-bar">
          <button
            type="button"
            className="stays-date-bar__nav"
            onClick={() => shiftDate(-1)}
            aria-label="Previous day"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="stays-date-bar__center">
            <input
              type="date"
              className="stays-date-bar__input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Select day"
            />
            <p className="stays-date-bar__label">{dayHeading}</p>
          </div>
          <button
            type="button"
            className="stays-date-bar__nav"
            onClick={() => shiftDate(1)}
            aria-label="Next day"
          >
            <ChevronRight size={18} />
          </button>
          {!isSelectedToday && (
            <button type="button" className="btn-secondary stays-date-bar__today" onClick={() => setSelectedDate(today)}>
              Today
            </button>
          )}
        </div>
      )}

      <div className="search-filter-bar" style={{ marginBottom: '20px' }}>
        <div className="search-filter-bar__search">
          <SearchInput
            variant="inset"
            placeholder="Search all dates - ref, guest, room, phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="stays-filters">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`stays-filter-pill ${activeFilter === tab.id ? 'stays-filter-pill--active' : ''}`}
            >
              {tab.label}
              <span className="stays-filter-count">{tabCounts[tab.id] ?? 0}</span>
            </button>
          ))}
        </div>
        {(searchQuery || activeFilter !== 'all' || selectedDate !== today) && (
          <button
            type="button"
            className="btn-secondary"
            onClick={resetView}
            style={{ padding: '10px 16px', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}
          >
            Reset
          </button>
        )}
      </div>

      {isSearching && (
        <p className="stays-search-banner">
          Searching all dates - clear search to return to daily view ({dayHeading}).
        </p>
      )}

      {loading ? (
        <AppLoader inline message="Loading reservations…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title={
            isSearching
              ? 'No stays match your search'
              : `No stays for ${dayHeading}`
          }
          description={
            isSearching
              ? 'Try a different name, room, or booking ref.'
              : 'No guests are booked for this day. Pick another date, search, or open All Records for full history.'
          }
          action={
            !isSearching ? (
              <div className="stays-empty-actions">
                <button type="button" className="btn-secondary" onClick={() => navigate('/gh/settings?tab=records')}>
                  <Archive size={16} /> All Records
                </button>
                {canManage && (
                  <button type="button" className="btn-primary" onClick={openCreate}>
                    <Plus size={16} /> Book Stay
                  </button>
                )}
              </div>
            ) : null
          }
        />
      ) : (
        <>
          {!isSearching && (
            <header className={`stays-day-group__head${isSelectedToday ? ' stays-day-group__head--today' : ''}`} style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="stays-day-group__title">{dayHeading}</h3>
                <p className="stays-day-group__sub">
                  Daily stays · {filtered.length} reservation{filtered.length !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="stays-day-group__badge">{filtered.length}</span>
            </header>
          )}
          {isSearching && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', fontWeight: '600' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} across all dates
            </p>
          )}
          <div className="stays-grid">
            {filtered.map((s) => (
              <StayCard
                key={s.id}
                stay={s}
                today={today}
                canManage={canManage}
                canCancelStay={canCancelStay}
                showDates={isSearching}
                onOpen={() => navigate(`/gh/stays/${s.id}`)}
                onPay={canAccessPayments ? () => navigate(`/gh/payments/new?stay=${s.id}`) : undefined}
                onPrint={() => navigate(
                  s.status === 'CANCELLED'
                    ? `/gh/print/stay/${s.id}?doc=cancellation`
                    : `/gh/print/stay/${s.id}?doc=advance`,
                )}
                onEdit={() => navigate(`/gh/stays/${s.id}/edit`)}
                onCancel={() => setCancelTarget(s)}
              />
            ))}
          </div>
        </>
      )}

      <CancelStayModal
        stay={cancelTarget}
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelled={load}
      />
    </div>
  );
};

export default GuestHouseStays;
