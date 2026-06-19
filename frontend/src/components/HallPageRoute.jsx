import { Navigate } from 'react-router-dom';
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
    reload,
  } = useHallPageVisibility();

  if (loading) return <AppLoader fullScreen />;

  if (!isPageVisible(pageKey)) {
    return <Navigate to={firstVisiblePath} replace />;
  }

  if (isPageInMaintenance(pageKey)) {
    return (
      <MaintenancePage
        pageName={HALL_PAGE_LABELS[pageKey]}
        homePath={firstVisiblePath}
        maintenanceUntil={getPageMaintenanceUntil(pageKey)}
        onMaintenanceEnded={reload}
      />
    );
  }

  return children;
}
