import { Navigate } from 'react-router-dom';
import { useAppType } from '../hooks/useAppType';
import { APP_GUEST_HOUSE, APP_MARRIAGE_HALL } from '../utils/appType';

const Loading = () => (
  <div className="flex h-screen items-center justify-center">Loading...</div>
);

/** Only Marriage Hall users */
export function MarriageHallRoute({ children }) {
  const { loading, appType, homePath } = useAppType();
  if (loading) return <Loading />;
  if (appType === APP_GUEST_HOUSE) {
    return <Navigate to={homePath} replace />;
  }
  return children;
}

/** Only Guest House users */
export function GuestHouseRoute({ children }) {
  const { loading, appType, homePath } = useAppType();
  if (loading) return <Loading />;
  if (appType === APP_MARRIAGE_HALL) {
    return <Navigate to={homePath} replace />;
  }
  return children;
}
