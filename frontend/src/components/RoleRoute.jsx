import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

const Loading = () => (
  <div className="flex h-screen items-center justify-center">Loading...</div>
);

/** Only ADMIN */
export function AdminRoute({ children }) {
  const { loading, isAdmin, isStaff } = usePermissions();

  if (loading) return <Loading />;
  if (!isAdmin) {
    return <Navigate to={isStaff ? '/bookings' : '/dashboard'} replace />;
  }
  return children;
}

/** ADMIN + MANAGER (blocks STAFF) */
export function ManagerRoute({ children }) {
  const { loading, canManage } = usePermissions();

  if (loading) return <Loading />;
  if (!canManage) return <Navigate to="/bookings" replace />;
  return children;
}

/** Blocks STAFF from dashboard / accountant */
export function StaffBlockedRoute({ children }) {
  const { loading, canAccessDashboard } = usePermissions();

  if (loading) return <Loading />;
  if (!canAccessDashboard) return <Navigate to="/bookings" replace />;
  return children;
}
