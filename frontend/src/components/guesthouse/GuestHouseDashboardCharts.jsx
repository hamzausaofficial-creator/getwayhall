import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BarChart3, LineChart, PieChart as PieIcon, TrendingUp, BedDouble } from 'lucide-react';
import ChartCard from '../ui/ChartCard';
import { getChartColors } from '../../utils/dashboard';
import { formatRs } from '../../utils/currency';

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid var(--border)',
  background: 'var(--chart-tooltip-bg)',
  boxShadow: 'var(--shadow-md)',
  fontSize: '12px',
  fontWeight: 600,
};

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--text-main)' }}>
        {formatter ? formatter(payload[0].value) : payload[0].value}
      </p>
    </div>
  );
}

export function GhRevenueChart({ data }) {
  const colors = useMemo(() => getChartColors(), []);
  const hasData = data?.length > 0;

  return (
    <ChartCard
      title="Collections overview"
      subtitle="Completed payments — last 6 months"
      empty={!hasData ? { icon: LineChart, title: 'No payment data', description: 'Record payments to see trends.' } : null}
    >
      {hasData && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ghRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.35} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={42} />
            <Tooltip content={({ active, payload, label }) => (
              <ChartTooltip active={active} payload={payload} label={label} formatter={(v) => `Rs ${Number(v).toLocaleString()}`} />
            )} />
            <Area type="monotone" dataKey="revenue" stroke={colors[0]} strokeWidth={2.5} fill="url(#ghRevenueGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function StaysByRoomChart({ data }) {
  const colors = useMemo(() => getChartColors(), []);
  const hasData = data?.length > 0;

  return (
    <ChartCard
      title="Stays by room"
      subtitle="Bookings per room (selected period)"
      empty={!hasData ? { icon: BarChart3, title: 'No stays yet', description: 'Create stays to see room distribution.' } : null}
    >
      {hasData && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval={0} angle={-20} textAnchor="end" height={56} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} width={32} />
            <Tooltip content={({ active, payload, label }) => (
              <ChartTooltip active={active} payload={payload} label={label} formatter={(v) => `${v} stay${v !== 1 ? 's' : ''}`} />
            )} />
            <Bar dataKey="value" fill={colors[0]} radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  CONFIRMED: '#22c55e',
  CHECKED_IN: '#3b82f6',
  CHECKED_OUT: '#94a3b8',
  CANCELLED: '#ef4444',
};

export function StayStatusChart({ data }) {
  const colors = useMemo(() => getChartColors(), []);
  const chartData = useMemo(
    () => (data || []).map((d) => ({ name: d.name?.replace(/_/g, ' ') || d.name, value: d.value })),
    [data],
  );
  const hasData = chartData.length > 0;

  return (
    <ChartCard
      title="Stay status"
      subtitle="Distribution in selected period"
      empty={!hasData ? { icon: PieIcon, title: 'No status data', description: 'Stays will appear here.' } : null}
    >
      {hasData && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="45%" innerRadius={52} outerRadius={78} paddingAngle={4} dataKey="value" nameKey="name">
              {chartData.map((entry, i) => (
                <Cell key={entry.name} fill={STATUS_COLORS[(data || [])[i]?.name] || colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div style={tooltipStyle}>
                  <p style={{ fontWeight: 700 }}>{payload[0].name}</p>
                  <p style={{ color: 'var(--text-muted)' }}>{payload[0].value} stays</p>
                </div>
              );
            }} />
            <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function GhOccupancyHero({ rate, occupied, total }) {
  return (
    <section className="dash-chart-card gh-occupancy-hero">
      <header className="dash-chart-card__head">
        <div>
          <h3 className="dash-chart-card__title">Today&apos;s occupancy</h3>
          <p className="dash-chart-card__subtitle">Rooms in use right now</p>
        </div>
        <BedDouble size={22} color="var(--primary)" />
      </header>
      <div className="gh-occupancy-hero__body dash-chart-card__body">
        <div
          className="gh-occupancy-ring"
          style={{
            background: `conic-gradient(var(--primary) ${Math.min(100, Math.max(0, rate))}%, var(--gh-ring-track, var(--border)) 0)`,
          }}
          role="img"
          aria-label={`${rate}% occupancy`}
        >
          <span className="gh-occupancy-ring__value">{rate}%</span>
        </div>
        <div className="gh-occupancy-hero__meta">
          <p><strong>{occupied}</strong> of <strong>{total}</strong> active rooms occupied</p>
          <p className="gh-occupancy-hero__hint">Updates with live dashboard refresh</p>
        </div>
      </div>
    </section>
  );
}

export function GhFinancialSnapshot({ revenue, expenses }) {
  const profit = (parseFloat(revenue) || 0) - (parseFloat(expenses) || 0);
  const margin = revenue > 0 ? ((profit / parseFloat(revenue)) * 100).toFixed(1) : '0';

  return (
    <section className="dash-chart-card">
      <header className="dash-chart-card__head">
        <div>
          <h3 className="dash-chart-card__title">Financial snapshot</h3>
          <p className="dash-chart-card__subtitle">Collections vs expenses (period)</p>
        </div>
        <span className="dash-stat-card__trend dash-stat-card__trend--neutral" style={{ marginTop: 0 }}>
          <TrendingUp size={12} />
          {margin}% margin
        </span>
      </header>
      <div className="dash-chart-card__body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="gh-fin-box">
            <span className="gh-fin-box__label">Revenue</span>
            <span className="gh-fin-box__value gh-fin-box__value--primary">{formatRs(revenue)}</span>
          </div>
          <div className="gh-fin-box">
            <span className="gh-fin-box__label">Expenses</span>
            <span className="gh-fin-box__value">{formatRs(expenses)}</span>
          </div>
        </div>
        <div className="gh-fin-profit" style={{ borderColor: profit >= 0 ? 'var(--primary)' : 'var(--error)' }}>
          <span>Net profit</span>
          <strong style={{ color: profit >= 0 ? 'var(--primary)' : 'var(--error)' }}>{formatRs(profit)}</strong>
        </div>
      </div>
    </section>
  );
}
