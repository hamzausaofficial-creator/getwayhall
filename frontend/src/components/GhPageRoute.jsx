import { Navigate } from 'react-router-dom';
import { useGhPageVisibility } from '../context/GhPageVisibilityContext';
import AppLoader from './AppLoader';

/** Blocks access when a Guest House page is hidden in Django admin. */
export function GhPageRoute({ pageKey, children }) {
  const { loading, isPageVisible, firstVisiblePath } = useGhPageVisibility();

  if (loading) return <AppLoader fullScreen />;
  if (!isPageVisible(pageKey)) {
    return <Navigate to={firstVisiblePath} replace />;
  }
  return children;
}
