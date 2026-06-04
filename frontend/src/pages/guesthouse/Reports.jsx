import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  Download,
  Wallet,
  TrendingUp,
  Filter,
  RefreshCw,
  Printer,
  BedDouble,
  Briefcase,
  CalendarCheck,
  Percent,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import { getGuestHouseReports } from '../../api/guesthouse';
import toast from 'react-hot-toast';
import { formatRs } from '../../utils/currency';
import StatCard from '../../components/ui/StatCard';
import ChartCard from '../../components/ui/ChartCard';
import EmptyState from '../../components/ui/EmptyState';
import '../../styles/dashboard.css';

const CHART_COLORS = ['#5BD51E', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

const STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked in',
  CHECKED_OUT: 'Checked out',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  CONFIRMED: '#22c55e',
  CHECKED_IN: '#3b82f6',
  CHECKED_OUT: '#94a3b8',
  CANCELLED: '#ef4444',
};

const EXPENSE_LABELS = {
  SALARY: 'Salary',
  UTILITIES: 'Utilities',
  MAINTENANCE: 'Maintenance',
  SUPPLIES: 'Supplies',
  LAUNDRY: 'Laundry',
  MARKETING: 'Marketing',
  OTHER: 'Other',
};

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid var(--border)',
  background: 'var(--chart-tooltip-bg)',
  boxShadow: 'var(--shadow-md)',
  fontSize: '12px',
  fontWeight: 600,
};

function formatDateISO(d) {
  return d.toISOString().split('T')[0];
}

export default function GuestHouseReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('financial');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return formatDateISO(d);
  });
  const [endDate, setEndDate] = useState(() => formatDateISO(new Date()));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getGuestHouseReports({ start_date: startDate, end_date: endDate }));
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const applyPreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(formatDateISO(start));
    setEndDate(formatDateISO(end));
  };

  const roomChart = useMemo(
    () => (data?.bookings_by_room || []).map((r) => ({
      name: `Room ${r.room}`,
      stays: r.count,
      revenue: Number(r.revenue),
    })),
    [data],
  );

  const statusChart = useMemo(
    () => (data?.bookings_by_status || []).map((s) => ({
      name: STATUS_LABELS[s.status] || s.status,
      value: s.count,
      status: s.status,
    })),
    [data],
  );

  const expenseChart = useMemo(
    () => (data?.expenses_by_category || [])
      .map((e) => ({
        name: EXPENSE_LABELS[e.category] || e.category,
        value: Number(e.total),
      }))
      .sort((a, b) => b.value - a.value),
    [data],
  );

  const monthlyTrends = data?.monthly_trends || [];

  const collectionRate = useMemo(() => {
    if (!data?.total_revenue) return 0;
    return Math.min(100, Math.round((data.total_collected / data.total_revenue) * 100));
  }, [data]);

  const handleExportCsv = () => {
    if (!data) return;
    const rows = [
      ['Guest House Report', `${data.start_date} to ${data.end_date}`],
      [],
      ['Metric', 'Value (Rs)'],
      ['Total billed (stays)', data.total_revenue],
      ['Collected', data.total_collected],
      ['Expenses', data.total_expenses],
      ['Net profit', data.net_profit],
      ['Stay count', data.stay_count],
      [],
      ['Room', 'Stays', 'Revenue'],
      ...(data.bookings_by_room || []).map((r) => [r.room, r.count, r.revenue]),
      [],
      ['Expense category', 'Amount'],
      ...(data.expenses_by_category || []).map((e) => [EXPENSE_LABELS[e.category] || e.category, e.total]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guesthouse-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const tabBtn = (id, label, Icon) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1,
        padding: '10px 16px',
        fontSize: '13px',
        fontWeight: '700',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: activeTab === id ? 'var(--surface)' : 'transparent',
        color: activeTab === id ? 'var(--primary)' : 'var(--text-muted)',
        boxShadow: activeTab === id ? 'var(--shadow-sm)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
      }}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="animate-fade-in print-hide">
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--secondary)', letterSpacing: '-0.02em', margin: 0 }}>
            Reports & Analytics
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '6px' }}>
            Guest house revenue, collections, room performance, and expense analysis.
          </p>
        </div>
        <div className="page-header__actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={load}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCsv}
            disabled={!data}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Filter size={18} color="var(--primary)" />
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary)' }}>Date range</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontWeight: '600' }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontWeight: '600' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: '7 days', days: 7 },
              { label: '30 days', days: 30 },
              { label: '90 days', days: 90 },
              { label: '1 year', days: 365 },
            ].map((p) => (
              <button
                key={p.days}
                type="button"
                className="btn-secondary"
                onClick={() => applyPreset(p.days)}
                style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '600' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {data && (
          <p style={{ margin: '16px 0 0', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
            Showing data from <strong>{data.start_date}</strong> to <strong>{data.end_date}</strong>
            {' · '}
            <strong>{data.stay_count}</strong> stays in period
          </p>
        )}
      </div>

      <div className="reports-tabs">
        {tabBtn('financial', 'Financial', Wallet)}
        {tabBtn('rooms', 'Rooms & Stays', BedDouble)}
        {tabBtn('expenses', 'Expenses', Briefcase)}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.5 }} />
          Compiling reports…
        </div>
      ) : !data ? (
        <EmptyState icon={BarChart3} title="No report data" description="Adjust the date range and refresh." />
      ) : (
        <>
          {activeTab === 'financial' && (
            <div className="animate-fade-in">
              <section className="dash-kpi-grid" style={{ marginBottom: '32px' }}>
                <StatCard label="Billed (stays)" value={data.total_revenue} icon={CalendarCheck} variant="primary" isCurrency />
                <StatCard label="Collected" value={data.total_collected} icon={Wallet} variant="success" isCurrency />
                <StatCard label="Expenses" value={data.total_expenses} icon={Briefcase} variant="warning" isCurrency />
                <StatCard
                  label="Net profit"
                  value={data.net_profit}
                  icon={TrendingUp}
                  variant={data.net_profit >= 0 ? 'success' : 'danger'}
                  isCurrency
                />
              </section>

              <div className="grid-3 grid-3--mb" style={{ marginBottom: '32px' }}>
                <div className="premium-card" style={{ padding: '24px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Collection rate</p>
                  <p style={{ fontSize: '32px', fontWeight: '900', color: 'var(--primary)', margin: 0 }}>{collectionRate}%</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Collected vs billed amount</p>
                </div>
                <div className="premium-card" style={{ padding: '24px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Outstanding (billed − collected)</p>
                  <p style={{ fontSize: '32px', fontWeight: '900', color: data.collection_gap > 0 ? 'var(--error)' : 'var(--primary)', margin: 0 }}>
                    {formatRs(data.collection_gap || 0)}
                  </p>
                </div>
                <div className="premium-card" style={{ padding: '24px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Avg stay value</p>
                  <p style={{ fontSize: '32px', fontWeight: '900', color: 'var(--secondary)', margin: 0 }}>{formatRs(data.avg_stay_value || 0)}</p>
                </div>
              </div>

              <ChartCard
                title="Collections vs expenses"
                subtitle="Monthly trend in selected period"
                empty={monthlyTrends.length === 0 ? { icon: BarChart3, title: 'No trend data', description: 'Record payments and expenses in this period.' } : null}
              >
                {monthlyTrends.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrends} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => `Rs ${Number(v).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="income" name="Collected" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                      <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div className="animate-fade-in">
              <section className="dash-kpi-grid" style={{ marginBottom: '32px' }}>
                <StatCard label="Total stays" value={data.stay_count} icon={CalendarCheck} variant="primary" />
                <StatCard label="Rooms with activity" value={roomChart.length} icon={BedDouble} variant="info" />
                <StatCard
                  label="Top room revenue"
                  value={roomChart[0]?.revenue || 0}
                  icon={Percent}
                  variant="success"
                  isCurrency
                  hint={roomChart[0] ? `Room ${roomChart[0].name.replace('Room ', '')}` : undefined}
                />
              </section>

              <div className="dash-charts-row" style={{ marginBottom: '32px' }}>
                <ChartCard
                  title="Stays per room"
                  subtitle="Booking count by room"
                  empty={roomChart.length === 0 ? { icon: BedDouble, title: 'No stays', description: 'No room activity in this period.' } : null}
                >
                  {roomChart.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roomChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="stays" name="Stays" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                <ChartCard
                  title="Stay status mix"
                  subtitle="Distribution in period"
                  empty={statusChart.length === 0 ? { icon: CalendarCheck, title: 'No status data', description: 'Stays will appear when booked.' } : null}
                >
                  {statusChart.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={52} outerRadius={78} paddingAngle={3}>
                          {statusChart.map((entry) => (
                            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || CHART_COLORS[0]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>

              <div className="premium-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Room performance</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Revenue and stay count per room</p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--surface-elevated)', borderBottom: '1px solid var(--border)' }}>
                        {['Room', 'Stays', 'Billed revenue', 'Avg / stay'].map((h) => (
                          <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roomChart.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No room data</td>
                        </tr>
                      ) : roomChart.map((row) => (
                        <tr key={row.name} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '14px 20px', fontWeight: '700' }}>{row.name}</td>
                          <td style={{ padding: '14px 20px' }}>{row.stays}</td>
                          <td style={{ padding: '14px 20px', fontWeight: '700', color: 'var(--primary)' }}>{formatRs(row.revenue)}</td>
                          <td style={{ padding: '14px 20px' }}>{formatRs(row.stays ? row.revenue / row.stays : 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {roomChart.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                  <ChartCard title="Revenue by room" subtitle="Billed amount per room">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={roomChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `Rs ${Number(v).toLocaleString()}`} />
                        <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                        <Line type="monotone" dataKey="stays" name="Stays" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              )}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="animate-fade-in">
              <section className="dash-kpi-grid" style={{ marginBottom: '32px' }}>
                <StatCard label="Total expenses" value={data.total_expenses} icon={Briefcase} variant="warning" isCurrency />
                <StatCard label="Categories" value={expenseChart.length} icon={BarChart3} variant="info" />
                <StatCard
                  label="Largest category"
                  value={expenseChart[0]?.value || 0}
                  icon={Wallet}
                  variant="primary"
                  isCurrency
                  hint={expenseChart[0]?.name}
                />
                <StatCard label="Net after expenses" value={data.net_profit} icon={TrendingUp} variant={data.net_profit >= 0 ? 'success' : 'danger'} isCurrency />
              </section>

              <div className="dash-charts-row">
                <ChartCard
                  title="Expenses by category"
                  subtitle="Share of spending in period"
                  empty={expenseChart.length === 0 ? { icon: Briefcase, title: 'No expenses', description: 'Add expenses to see breakdown.' } : null}
                >
                  {expenseChart.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expenseChart} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {expenseChart.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatRs(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                <div className="premium-card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'stretch' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Category breakdown</h3>
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    {expenseChart.length === 0 ? (
                      <p style={{ padding: '24px', color: 'var(--text-muted)', textAlign: 'center' }}>No expenses recorded</p>
                    ) : expenseChart.map((row, i) => {
                      const pct = data.total_expenses > 0 ? Math.round((row.value / data.total_expenses) * 100) : 0;
                      return (
                        <div
                          key={row.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 24px',
                            borderBottom: i < expenseChart.length - 1 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span style={{ fontWeight: '600' }}>{row.name}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: '800', margin: 0 }}>{formatRs(row.value)}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{pct}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
