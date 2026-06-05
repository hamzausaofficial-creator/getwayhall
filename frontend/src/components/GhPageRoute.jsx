import { Navigate } from 'react-router-dom';
import { useGhPageVisibility } from '../context/GhPageVisibilityContext';

const Loading = () => (
  <div className="flex h-screen items-center justify-center">Loading...</div>
);

/** Blocks access when a Guest House page is hidden in Django admin. */
export function GhPageRoute({ pageKey, children }) {
  const { loading, isPageVisible, firstVisiblePath } = useGhPageVisibility();

  if (loading) return <Loading />;
  if (!isPageVisible(pageKey)) {
    return <Navigate to={firstVisiblePath} replace />;
  }
  return children;
}
