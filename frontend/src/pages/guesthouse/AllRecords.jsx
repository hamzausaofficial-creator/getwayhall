import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Archive, CalendarCheck, FileText, Wallet, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppLoader from '../../components/AppLoader';
import { getGuestHouseRecords } from '../../api/guesthouse';
import SearchInput from '../../components/SearchInput';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatRs } from '../../utils/currency';
import { todayISO } from '../../utils/ghDate';
import '../../styles/dashboard.css';
import './gh-records.css';

const TYPE_TABS = [
  { value: 'all', label: 'All records' },
  { value: 'stay', label: 'Reservations' },
  { value: 'payment', label: 'Payments' },
  { value: 'expense', label: 'Expenses' },
];

const TYPE_META = {
  stay: { label: 'Reservation', icon: CalendarCheck, className: 'gh-record-type--stay' },
  payment: { label: 'Payment', icon: Wallet, className: 'gh-record-type--payment' },
  expense: { label: 'Voucher', icon: FileText, className: 'gh-record-type--expense' },
};

function formatRecordDate(iso) {
  try {
    return format(parseISO(iso), 'dd MMM yyyy · hh:mm a');
  } catch {
    return iso || '-';
  }
}

function RecordDetails({ title, subtitle, ref, date, compact = false }) {
  const subLines = subtitle
    ? subtitle.split(' · ').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="gh-records-table__details">
      {ref ? <span className="gh-records-table__ref">{ref}</span> : null}
      <span className="gh-records-table__title">{title}</span>
      {subLines.map((line) => (
        <span key={line} className="gh-records-table__sub">{line}</span>
      ))}
      {compact && date ? (
        <span className="gh-records-table__date">{formatRecordDate(date)}</span>
      ) : null}
    </div>
  );
}

function RecordRow({ row, embedded, onOpen }) {
  const meta = TYPE_META[row.record_type] || TYPE_META.stay;
  const Icon = meta.icon;

  if (embedded) {
    return (
      <tr onClick={() => onOpen(row)}>
        <td className="gh-records-table__cell--type">
          <span className={`gh-record-type gh-record-type--compact ${meta.className}`} title={row.record_type_label || meta.label}>
            <Icon size={14} aria-hidden />
            <span>{meta.label}</span>
          </span>
        </td>
        <td className="gh-records-table__cell--details">
          <RecordDetails
            ref={row.ref}
            title={row.title}
            subtitle={row.subtitle}
            date={row.date}
            compact
          />
        </td>
        <td className="gh-records-table__cell--amount">{formatRs(row.amount)}</td>
        <td className="gh-records-table__cell--status">
          <StatusBadge status={row.status} />
        </td>
        <td className="gh-records-table__cell--action" aria-label="Open record">
          <ChevronRight size={16} color="var(--text-muted)" />
        </td>
      </tr>
    );
  }

  return (
    <tr onClick={() => onOpen(row)}>
      <td className="gh-records-table__cell--type">
        <span className={`gh-record-type ${meta.className}`}>
          <Icon size={14} aria-hidden />
          {meta.label}
        </span>
      </td>
      <td className="gh-records-table__cell--ref"><strong>{row.ref}</strong></td>
      <td className="gh-records-table__cell--details">
        <RecordDetails title={row.title} subtitle={row.subtitle} />
      </td>
      <td className="gh-records-table__cell--amount">{formatRs(row.amount)}</td>
      <td className="gh-records-table__cell--status">
        <StatusBadge status={row.status} />
      </td>
      <td className="gh-records-table__cell--date">
        {formatRecordDate(row.date)}
      </td>
      <td className="gh-records-table__cell--action" aria-label="Open record">
        <ChevronRight size={16} color="var(--text-muted)" />
      </td>
    </tr>
  );
}

export default function AllRecords({ embedded = false }) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [filterAllTime, setFilterAllTime] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({ stay: 0, payment: 0, expense: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = { type: typeFilter };
    if (!filterAllTime && selectedDate) params.date = selectedDate;

    getGuestHouseRecords(params)
      .then((data) => {
        if (!active) return;
        setRecords(data.records || []);
        setCounts(data.counts || { stay: 0, payment: 0, expense: 0, total: 0 });
      })
      .catch(() => {
        if (active) toast.error('Failed to load records');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [selectedDate, typeFilter, filterAllTime]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      (r.ref || '').toLowerCase().includes(q)
      || (r.title || '').toLowerCase().includes(q)
      || (r.subtitle || '').toLowerCase().includes(q)
      || (r.record_type_label || '').toLowerCase().includes(q),
    );
  }, [records, searchQuery]);

  const openRecord = (row) => {
    if (row.link_path) navigate(row.link_path);
  };

  const statItems = [
    { label: 'Total', value: counts.total, icon: Archive, tone: 'primary' },
    { label: 'Reservations', value: counts.stay, icon: CalendarCheck, tone: 'stay' },
    { label: 'Payments', value: counts.payment, icon: Wallet, tone: 'payment' },
    { label: 'Vouchers', value: counts.expense, icon: FileText, tone: 'expense' },
  ];

  return (
    <div className={`animate-fade-in gh-records-page${embedded ? ' gh-records-page--embedded' : ''}`}>
      {!embedded && (
        <div className="page-header">
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--secondary)', margin: 0 }}>
              All Records
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
              Every reservation, payment, and expense voucher in one place - with record type clearly marked.
            </p>
          </div>
        </div>
      )}

      {embedded ? (
        <div className="gh-records-embedded-stats">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`gh-records-stat gh-records-stat--${item.tone}`}>
                <Icon size={15} />
                <div>
                  <p className="gh-records-stat__val">{item.value}</p>
                  <p className="gh-records-stat__lbl">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <section className="dash-kpi-grid" style={{ marginBottom: '24px' }}>
          <StatCard label="Total records" value={counts.total} icon={Archive} variant="primary" />
          <StatCard label="Reservations" value={counts.stay} icon={CalendarCheck} variant="info" />
          <StatCard label="Payments" value={counts.payment} icon={Wallet} variant="success" />
          <StatCard label="Vouchers" value={counts.expense} icon={FileText} variant="warning" />
        </section>
      )}

      <div className={`gh-records-filters${embedded ? ' gh-records-filters--embedded' : ''}`}>
        <div className="gh-records-filters__top">
          <div className="gh-records-filters__search">
            <SearchInput
              variant="inset"
              placeholder="Search ref, guest, title…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="gh-records-filters__date">
            <label htmlFor="records-date">Date</label>
            <input
              id="records-date"
              type="date"
              className="gh-records-filters__date-input"
              value={selectedDate}
              disabled={filterAllTime}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="gh-records-filters__period">
            <button
              type="button"
              className={`gh-records-period-btn${filterAllTime ? '' : ' gh-records-period-btn--active'}`}
              onClick={() => setFilterAllTime(false)}
            >
              Daily
            </button>
            <button
              type="button"
              className={`gh-records-period-btn${filterAllTime ? ' gh-records-period-btn--active' : ''}`}
              onClick={() => setFilterAllTime(true)}
            >
              All time
            </button>
          </div>
        </div>
        <div className="gh-records-tabs">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`gh-records-tab${typeFilter === tab.value ? ' gh-records-tab--active' : ''}`}
              onClick={() => setTypeFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`gh-records-table-wrap${embedded ? '' : ' premium-card'}`}>
        {loading ? (
          <AppLoader inline message="Loading records…" />
        ) : filtered.length === 0 ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {filterAllTime ? 'No records found.' : `No records for ${selectedDate}.`}
          </p>
        ) : (
          <table className={`gh-records-table${embedded ? ' gh-records-table--embedded' : ''}`}>
            <thead>
              <tr>
                <th>Type</th>
                {embedded ? (
                  <>
                    <th>Record</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th aria-label="Open" />
                  </>
                ) : (
                  <>
                    <th>Reference</th>
                    <th>Details</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th aria-label="Open" />
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <RecordRow
                  key={`${row.record_type}-${row.id}`}
                  row={row}
                  embedded={embedded}
                  onOpen={openRecord}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
