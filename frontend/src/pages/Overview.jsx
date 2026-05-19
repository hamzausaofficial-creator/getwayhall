import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { getDashboardStats } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';

const Overview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_bookings: 0,
    total_expenses: 0,
    pending_payments: 0,
    revenue_growth: [],
    bookings_by_hall: [],
    recent_bookings: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const params = { period };
        if (period === 'custom' && customDates.start && customDates.end) {
          params.start_date = customDates.start;
          params.end_date = customDates.end;
        }
        
        // Don't fetch custom if dates are incomplete
        if (period === 'custom' && (!customDates.start || !customDates.end)) {
          setIsLoading(false);
          return;
        }
        
        const data = await getDashboardStats(params);
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [period, customDates]);

  const COLORS = ['#5BD51E', '#0f172a', '#64748b', '#94a3b8', '#cbd5e1'];

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, isCurrency }) => (
    <div className="premium-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--primary-light)', borderRadius: '12px', color: 'var(--primary)' }}>
          <Icon size={24} />
        </div>
      </div>
      <div style={{ marginTop: '20px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>{title}</p>
        <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px' }}>
          {isCurrency ? <><span style={{ fontSize: '55%', fontWeight: '600', opacity: 0.6 }}>Rs</span> {parseFloat(value || 0).toLocaleString()}</> : (value || 0)}
        </h3>
      </div>
    </div>
  );

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Welcome back, {user?.first_name || 'Admin'}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Here's what's happening at Gateway Marriage Hall today.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {period === 'custom' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="date" 
                value={customDates.start}
                onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input 
                type="date" 
                value={customDates.end}
                onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
              />
            </div>
          )}
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontWeight: '600', backgroundColor: '#fff' }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="last7days">Last 7 Days</option>
            <option value="thismonth">This Month</option>
            <option value="thisyear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Revenue" value={stats.total_revenue} icon={DollarSign} isCurrency />
        <StatCard title="Total Bookings" value={stats.total_bookings} icon={Calendar} />
        <StatCard title="Total Expenses" value={stats.total_expenses} icon={TrendingUp} isCurrency />
        <StatCard title="Pending Payments" value={stats.pending_payments} icon={Users} isCurrency />
      </div>

      <div className="charts-grid">
        <div className="card" style={{ minHeight: '400px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '32px' }}>Revenue Growth (Real-time)</h3>
          <div style={{ height: '300px', width: '100%' }}>
            {stats.revenue_growth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenue_growth}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5BD51E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#5BD51E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `Rs ${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#5BD51E" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No revenue data for the last 6 months
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ minHeight: '400px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '32px' }}>Bookings by Hall</h3>
          <div style={{ height: '250px', width: '100%' }}>
            {stats.bookings_by_hall.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.bookings_by_hall}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.bookings_by_hall.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No venue data available
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Recent Activity</h3>
          <button className="btn-secondary" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {stats.recent_bookings.map((booking, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: i === stats.recent_bookings.length - 1 ? 'none' : '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  color: 'var(--primary)'
                }}>
                  {booking.customer[0]}
                </div>
                <div>
                  <p style={{ fontSize: '14px' }}>
                    <span style={{ fontWeight: '700' }}>{booking.customer}</span> booked <span style={{ fontWeight: '600' }}>{booking.event}</span>
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status: {booking.status}</p>
                </div>
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: booking.status === 'CONFIRMED' ? '#dcfce7' : '#fef3c7',
                color: booking.status === 'CONFIRMED' ? '#166534' : '#92400e'
              }}>
                {booking.status}
              </span>
            </div>
          ))}
          {stats.recent_bookings.length === 0 && <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No recent bookings found.</p>}
        </div>
      </div>
    </div>
  );
};

export default Overview;
