import AppLoader from '../AppLoader';

export function DashboardSkeleton() {
  return <AppLoader message="Loading dashboard…" />;
}

export function SkeletonLine({ width = '100%', height = 14, className = '' }) {
  return (
    <div
      className={`dash-skeleton dash-skeleton--text ${className}`.trim()}
      style={{ width, height }}
      aria-hidden
    />
  );
}

export { default as AppLoader } from '../AppLoader';
export default DashboardSkeleton;
