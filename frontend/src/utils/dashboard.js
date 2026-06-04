/** Time-based greeting for dashboard header */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** % change between last two points in revenue_growth series */
export function revenueTrendPercent(revenueGrowth = []) {
  if (!revenueGrowth.length) return null;
  if (revenueGrowth.length === 1) return null;
  const last = revenueGrowth[revenueGrowth.length - 1]?.revenue ?? 0;
  const prev = revenueGrowth[revenueGrowth.length - 2]?.revenue ?? 0;
  if (prev === 0) return last > 0 ? 100 : null;
  return ((last - prev) / prev) * 100;
}

/** Normalize paginated API list */
export function unwrapList(data) {
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}

/** Chart colors from CSS variables (read at runtime) */
export function getChartColors() {
  if (typeof document === 'undefined') {
    return ['#5BD51E', '#0f172a', '#64748b', '#94a3b8', '#cbd5e1'];
  }
  const root = getComputedStyle(document.documentElement);
  return [
    root.getPropertyValue('--chart-1').trim() || '#5BD51E',
    root.getPropertyValue('--chart-2').trim() || '#0f172a',
    root.getPropertyValue('--chart-3').trim() || '#64748b',
    root.getPropertyValue('--chart-4').trim() || '#94a3b8',
    root.getPropertyValue('--chart-5').trim() || '#cbd5e1',
  ];
}

/** Occupancy % from bookings per hall vs a simple capacity proxy */
export function buildOccupancyData(bookingsByHall = [], venues = []) {
  if (!bookingsByHall.length) return [];
  const capacityByName = Object.fromEntries(
    venues.map((v) => [v.name, v.capacity || 1])
  );
  return bookingsByHall.map((row) => {
    const cap = capacityByName[row.name] || 100;
    const pct = Math.min(100, Math.round((row.value / Math.max(cap / 50, 1)) * 100));
    return { name: row.name, bookings: row.value, occupancy: pct };
  });
}
