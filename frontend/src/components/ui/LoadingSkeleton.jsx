export function SkeletonLine({ width = '100%', height = 14, className = '' }) {
  return (
    <div
      className={`dash-skeleton dash-skeleton--text ${className}`.trim()}
      style={{ width, height }}
      aria-hidden
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dash-page" aria-busy="true" aria-label="Loading dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="dash-skeleton dash-skeleton--text" style={{ width: 120, height: 12 }} />
        <div className="dash-skeleton dash-skeleton--title" />
        <div className="dash-skeleton dash-skeleton--text" style={{ width: '70%', marginTop: 8 }} />
      </div>
      <div className="dash-quick-actions">
        {[1, 2, 3].map((i) => (
          <div key={i} className="dash-skeleton" style={{ width: 130, height: 36, borderRadius: 12 }} />
        ))}
      </div>
      <div className="dash-kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="dash-skeleton dash-skeleton--stat" />
        ))}
      </div>
      <div className="dash-charts-row">
        <div className="dash-skeleton dash-skeleton--chart" />
        <div className="dash-skeleton dash-skeleton--chart" />
      </div>
      <div className="dash-bottom-grid">
        <div className="dash-skeleton dash-skeleton--chart" style={{ minHeight: 320 }} />
        <div className="dash-skeleton dash-skeleton--chart" style={{ minHeight: 320 }} />
        <div className="dash-skeleton dash-skeleton--chart" style={{ minHeight: 320 }} />
      </div>
    </div>
  );
}

export default DashboardSkeleton;
