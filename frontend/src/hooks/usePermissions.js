import { useAuth } from '../context/AuthContext';

/**
 * Central role checks - use everywhere instead of inline user?.role.
 * Unknown/missing role is treated as STAFF (least privilege).
 */
export function usePermissions() {
  const { user, loading, isAuthenticated } = useAuth();
  const cachedRole =
    typeof window !== 'undefined' ? localStorage.getItem('user_role') : '';
  const role = String(user?.role || cachedRole || '').toUpperCase();

  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';
  const isStaff =
    role === 'STAFF' ||
    (isAuthenticated && !loading && user && !isAdmin && !isManager);

  const canManage = isAdmin || isManager;
  const canCancelStay = isAdmin || isManager || isStaff;

  return {
    user,
    loading,
    role: role || 'STAFF',
    isAdmin,
    isManager,
    isStaff,
    canManage,
    canCancelStay,
    canAccessExpenses: canManage,
    canAccessReports: canManage,
    canAccessNotifications: canManage,
    canAccessStaff: isAdmin,
    canAccessSettings: canManage,
    canAccessDashboard: canManage,
    canAccessPayments: canManage,
  };
}
