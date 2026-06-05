import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import {
  Plus, Eye, Pencil, Printer, CalendarCheck,
  BedDouble, Wallet, CreditCard, CalendarDays, User, Phone,
} from 'lucide-react';
import SearchInput from '../../components/SearchInput';
import { listStays } from '../../api/guesthouse';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { formatRs, formatCollectDuePKR, hasCollectDue } from '../../utils/currency';
import '../../styles/dashboard.css';
import './stays-list.css';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pending', label: 'Pending' },
  { id: 'balance_due', label: 'Due' },
];

const formatStayDate = (d) => {
  if (!d) return '—';
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

function StayCard({ stay, today, canManage, onOpen, onPay, onPrint, onEdit }) {
  const due = Math.max(0, Number(stay.total_amount) - Number(stay.advance_paid));
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
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              {formatStayDate(stay.check_in)} → {formatStayDate(stay.check_out)}
            </p>
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
      </div>

      <div className="stay-card__foot" onClick={(e) => e.stopPropagation()}>
        {hasCollectDue(due) && canManage && (
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
        {canManage && (
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
  const { canManage } = usePermissions();
  const [stays, setStays] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

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

  const getDue = (s) => Math.max(0, Number(s.total_amount) - Number(s.advance_paid));

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

  const metrics = useMemo(() => {
    const active = stays.filter((s) => s.status !== 'CANCELLED');
    const upcoming = active.filter((s) => s.check_in >= today && !['CHECKED_OUT'].includes(s.status));
    const checkedIn = active.filter((s) => s.status === 'CHECKED_IN');
    const totalDue = active.reduce((sum, s) => sum + getDue(s), 0);
    return {
      total: active.length,
      upcoming: upcoming.length,
      checkedIn: checkedIn.length,
      totalDue,
    };
  }, [stays, today]);

  const tabCounts = useMemo(() => {
    const counts = {};
    FILTER_TABS.forEach((tab) => {
      counts[tab.id] = stays.filter((s) => matchesFilter(s, tab.id)).length;
    });
    return counts;
  }, [stays, today]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stays.filter((s) => {
      const matchesSearch = !q || (
        (s.booking_ref || '').toLowerCase().includes(q)
        || (s.customer_name || '').toLowerCase().includes(q)
        || (s.room_number || '').toLowerCase().includes(q)
        || (s.customer_phone || '').toLowerCase().includes(q)
      );
      return matchesSearch && matchesFilter(s, activeFilter);
    });
  }, [stays, searchQuery, activeFilter, today]);

  const openCreate = () => {
    if (!canManage) {
      toast.error('You do not have permission to create stays.');
      return;
    }
    navigate('/gh/book');
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="page-header">
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: '800', margin: 0 }}>Stay Reservations</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            Guest bookings, advance payments, and room occupancy.
          </p>
        </div>
        <div className="page-header__actions">
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
        <StatCard label="Total stays" value={metrics.total} icon={BedDouble} variant="primary" />
        <StatCard label="Upcoming" value={metrics.upcoming} icon={CalendarCheck} variant="info" to="/gh/calendar" />
        <StatCard label="Checked in" value={metrics.checkedIn} icon={User} variant="success" />
        <StatCard
          label="Outstanding due"
          value={metrics.totalDue}
          icon={Wallet}
          variant={metrics.totalDue > 0 ? 'danger' : 'info'}
          isCurrency
          to="/gh/payments"
        />
      </section>

      <div className="search-filter-bar" style={{ marginBottom: '20px' }}>
        <div className="search-filter-bar__search">
          <SearchInput
            variant="inset"
            placeholder="Search ref, guest, room, phone…"
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
        {(searchQuery || activeFilter !== 'all') && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
            style={{ padding: '10px 16px', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}
          >
            Reset
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
          Loading reservations…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title={searchQuery || activeFilter !== 'all' ? 'No stays match your filters' : 'No stay bookings yet'}
          description={
            searchQuery || activeFilter !== 'all'
              ? 'Try adjusting search or filters.'
              : 'Book a future stay with advance payment to get started.'
          }
          action={
            canManage && !searchQuery && activeFilter === 'all' ? (
              <button type="button" className="btn-primary" onClick={openCreate} style={{ marginTop: '16px' }}>
                <Plus size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Book first stay
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', fontWeight: '600' }}>
            {filtered.length} reservation{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="stays-grid">
            {filtered.map((s) => (
              <StayCard
                key={s.id}
                stay={s}
                today={today}
                canManage={canManage}
                onOpen={() => navigate(`/gh/stays/${s.id}`)}
                onPay={() => navigate(`/gh/payments/new?stay=${s.id}`)}
                onPrint={() => navigate(`/gh/print/stay/${s.id}?doc=advance`)}
                onEdit={() => navigate(`/gh/stays/${s.id}/edit`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GuestHouseStays;
