import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useHallPageVisibility } from '../context/HallPageVisibilityContext';
import { HALL_PAGE_LABELS } from '../constants/hallPages';
import AppLoader from './AppLoader';
import MaintenancePage from './MaintenancePage';

/** Guards Marriage Hall routes: maintenance screen vs hidden redirect. */
export function HallPageRoute({ pageKey, children }) {
  const {
    loading,
    isPageVisible,
    isPageInMaintenance,
    getPageMaintenanceUntil,
    firstVisiblePath,
    syncVisibility,
  } = useHallPageVisibility();

  useEffect(() => {
    if (!loading && isPageInMaintenance(pageKey)) {
      syncVisibility();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pageKey]);

  if (loading) return <AppLoader fullScreen />;

  if (!isPageVisible(pageKey)) {
    return <Navigate to={firstVisiblePath} replace />;
  }

  if (isPageInMaintenance(pageKey)) {
    return (
      <MaintenancePage
        pageName={HALL_PAGE_LABELS[pageKey]}
        maintenanceUntil={getPageMaintenanceUntil(pageKey)}
        onMaintenanceEnded={syncVisibility}
      />
    );
  }

  return children;
}
