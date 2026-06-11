import { Navigate } from 'react-router-dom';
import { useAppType } from '../hooks/useAppType';
import { APP_GUEST_HOUSE, APP_MARRIAGE_HALL } from '../utils/appType';
import AppLoader from './AppLoader';

/** Only Marriage Hall users */
export function MarriageHallRoute({ children }) {
  const { loading, appType, homePath } = useAppType();
  if (loading) return <AppLoader fullScreen />;
  if (appType === APP_GUEST_HOUSE) {
    return <Navigate to={homePath} replace />;
  }
  return children;
}

/** Only Guest House users */
export function GuestHouseRoute({ children }) {
  const { loading, appType, homePath } = useAppType();
  if (loading) return <AppLoader fullScreen />;
  if (appType === APP_MARRIAGE_HALL) {
    return <Navigate to={homePath} replace />;
  }
  return children;
}
