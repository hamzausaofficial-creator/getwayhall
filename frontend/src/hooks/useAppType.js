import { useAuth } from '../context/AuthContext';
import {
  normalizeAppType,
  isGuestHouseApp,
  isMarriageHallApp,
  getDefaultHomePath,
  APP_MARRIAGE_HALL,
  APP_GUEST_HOUSE,
} from '../utils/appType';

export function useAppType() {
  const { user, loading, isAuthenticated } = useAuth();
  const appType = normalizeAppType(isAuthenticated ? user?.app_type : null);

  return {
    user,
    loading,
    isAuthenticated,
    appType,
    isGuestHouse: isGuestHouseApp(appType),
    isMarriageHall: isMarriageHallApp(appType),
    homePath: getDefaultHomePath(user || { app_type: appType, role: user?.role }),
    APP_MARRIAGE_HALL,
    APP_GUEST_HOUSE,
  };
}
