import { useHallPageVisibility } from '../context/HallPageVisibilityContext';
import { HALL_PAGE_LABELS } from '../constants/hallPages';
import AppLoader from './AppLoader';
import MaintenancePage from './MaintenancePage';

/** Blocks access when a Marriage Hall page is in maintenance mode (Django admin). */
export function HallPageRoute({ pageKey, children }) {
  const { loading, isPageVisible, firstVisiblePath } = useHallPageVisibility();

  if (loading) return <AppLoader fullScreen />;

  if (!isPageVisible(pageKey)) {
    return (
      <MaintenancePage
        pageName={HALL_PAGE_LABELS[pageKey]}
        homePath={firstVisiblePath}
      />
    );
  }

  return children;
}
