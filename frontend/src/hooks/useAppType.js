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
  const { user, loading } = useAuth();
  const cached =
    typeof window !== 'undefined' ? localStorage.getItem('user_app_type') : '';
  const appType = normalizeAppType(user?.app_type || cached);

  return {
    user,
    loading,
    appType,
    isGuestHouse: isGuestHouseApp(appType),
    isMarriageHall: isMarriageHallApp(appType),
    homePath: getDefaultHomePath(user || { app_type: appType, role: user?.role }),
    APP_MARRIAGE_HALL,
    APP_GUEST_HOUSE,
  };
}
