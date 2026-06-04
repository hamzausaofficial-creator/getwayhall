import { useMemo } from 'react';
import {
  AreaChart,
  Area,
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
} from 'recharts';
import { BarChart3, LineChart, PieChart as PieIcon } from 'lucide-react';
import ChartCard from '../ui/ChartCard';
import { getChartColors, buildOccupancyData } from '../../utils/dashboard';

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

export function RevenueChart({ data }) {
  const colors = useMemo(() => getChartColors(), []);
  const hasData = data?.length > 0;

  return (
    <ChartCard
      title="Revenue overview"
      subtitle="Completed payments — last 6 months"
      empty={
        !hasData
          ? {
              icon: LineChart,
              title: 'No revenue data',
              description: 'Revenue will appear as payments are recorded.',
            }
          : null
      }
    >
      {hasData && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dashRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.35} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              width={42}
            />
            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={label}
                  formatter={(v) => `Rs ${Number(v).toLocaleString()}`}
                />
              )}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={colors[0]}
              strokeWidth={2.5}
              fill="url(#dashRevenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function BookingTrendChart({ data }) {
  const colors = useMemo(() => getChartColors(), []);
  const hasData = data?.length > 0;

  return (
    <ChartCard
      title="Booking trend"
      subtitle="Events by hall"
      empty={
        !hasData
          ? {
              icon: BarChart3,
              title: 'No bookings yet',
              description: 'Create bookings to see distribution by hall.',
            }
          : null
      }
    >
      {hasData && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={56}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              allowDecimals={false}
              width={32}
            />
            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={label}
                  formatter={(v) => `${v} booking${v !== 1 ? 's' : ''}`}
                />
              )}
            />
            <Bar dataKey="value" fill={colors[0]} radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function OccupancyChart({ bookingsByHall, venues }) {
  const colors = useMemo(() => getChartColors(), []);
  const data = useMemo(
    () => buildOccupancyData(bookingsByHall, venues),
    [bookingsByHall, venues]
  );
  const hasData = data.length > 0;

  return (
    <ChartCard
      title="Hall occupancy"
      subtitle="Relative utilization by venue"
      empty={
        !hasData
          ? {
              icon: PieIcon,
              title: 'No occupancy data',
              description: 'Add halls and bookings to see utilization.',
            }
          : null
      }
    >
      {hasData && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={4}
              dataKey="occupancy"
              nameKey="name"
            >
              {data.map((_, i) => (
                <Cell key={`occ-${i}`} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload;
                return (
                  <div style={tooltipStyle}>
                    <p style={{ color: 'var(--text-main)', fontWeight: 700 }}>{p.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {p.bookings} bookings · ~{p.occupancy}% utilization
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
