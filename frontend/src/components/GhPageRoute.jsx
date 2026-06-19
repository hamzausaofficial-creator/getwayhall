import { Navigate } from 'react-router-dom';
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
    reload,
  } = useGhPageVisibility();

  if (loading) return <AppLoader fullScreen />;

  if (!isPageVisible(pageKey)) {
    return <Navigate to={firstVisiblePath} replace />;
  }

  if (isPageInMaintenance(pageKey)) {
    return (
      <MaintenancePage
        pageName={GH_PAGE_LABELS[pageKey]}
        homePath={firstVisiblePath}
        maintenanceUntil={getPageMaintenanceUntil(pageKey)}
        onMaintenanceEnded={reload}
      />
    );
  }

  return children;
}
