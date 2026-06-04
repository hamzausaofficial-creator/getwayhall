import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAppType } from '../hooks/useAppType';

const Loading = () => (
  <div className="flex h-screen items-center justify-center">Loading...</div>
);

/** Only ADMIN */
export function AdminRoute({ children }) {
  const { loading, isAdmin, isStaff } = usePermissions();
  const { isGuestHouse } = useAppType();
  const staffHome = isGuestHouse ? '/gh/stays' : '/bookings';
  const managerHome = isGuestHouse ? '/gh/dashboard' : '/dashboard';

  if (loading) return <Loading />;
  if (!isAdmin) {
    return <Navigate to={isStaff ? staffHome : managerHome} replace />;
  }
  return children;
}

/** ADMIN + MANAGER (blocks STAFF) */
export function ManagerRoute({ children }) {
  const { loading, canManage } = usePermissions();
  const { isGuestHouse } = useAppType();
  const fallback = isGuestHouse ? '/gh/stays' : '/bookings';

  if (loading) return <Loading />;
  if (!canManage) return <Navigate to={fallback} replace />;
  return children;
}

/** Blocks STAFF from dashboard / accountant */
export function StaffBlockedRoute({ children }) {
  const { loading, canAccessDashboard } = usePermissions();
  const { isGuestHouse } = useAppType();
  const fallback = isGuestHouse ? '/gh/stays' : '/bookings';

  if (loading) return <Loading />;
  if (!canAccessDashboard) return <Navigate to={fallback} replace />;
  return children;
}
