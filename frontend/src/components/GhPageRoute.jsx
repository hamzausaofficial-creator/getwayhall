import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useGhPageVisibility } from '../context/GhPageVisibilityContext';
import { GH_PAGE_LABELS } from '../constants/ghPages';
import AppLoader from './AppLoader';
import MaintenancePage from './MaintenancePage';

/** Guards Guest House routes: maintenance screen vs hidden redirect. */
export function GhPageRoute({ pageKey, children }) {
  const {
    loading,
    isPageVisible,
    isPageInMaintenance,
    getPageMaintenanceUntil,
    firstVisiblePath,
    syncVisibility,
  } = useGhPageVisibility();

  useEffect(() => {
    if (!loading && isPageInMaintenance(pageKey)) {
      syncVisibility();
    }
    // Refresh once when opening a page that is under maintenance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pageKey]);

  if (loading) return <AppLoader fullScreen />;

  if (!isPageVisible(pageKey)) {
    return <Navigate to={firstVisiblePath} replace />;
  }

  if (isPageInMaintenance(pageKey)) {
    return (
      <MaintenancePage
        pageName={GH_PAGE_LABELS[pageKey]}
        maintenanceUntil={getPageMaintenanceUntil(pageKey)}
        onMaintenanceEnded={syncVisibility}
      />
    );
  }

  return children;
}
