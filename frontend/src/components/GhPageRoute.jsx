import { useGhPageVisibility } from '../context/GhPageVisibilityContext';
import { GH_PAGE_LABELS } from '../constants/ghPages';
import AppLoader from './AppLoader';
import MaintenancePage from './MaintenancePage';

/** Blocks access when a Guest House page is in maintenance mode (Django admin). */
export function GhPageRoute({ pageKey, children }) {
  const { loading, isPageVisible, firstVisiblePath } = useGhPageVisibility();

  if (loading) return <AppLoader fullScreen />;

  if (!isPageVisible(pageKey)) {
    return (
      <MaintenancePage
        pageName={GH_PAGE_LABELS[pageKey]}
        homePath={firstVisiblePath}
      />
    );
  }

  return children;
}
