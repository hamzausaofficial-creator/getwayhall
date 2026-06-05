import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getGhPageVisibility } from '../api/guesthouse';
import { GH_PAGE_ORDER, GH_PAGE_PATHS } from '../constants/ghPages';

// null = not loaded yet, {} = loaded (use explicit true/false per key)
const GhPageVisibilityContext = createContext({
  loading: true,
  visibility: null,
  isPageVisible: () => true,
  firstVisiblePath: '/gh/stays',
  reload: () => {},
});

export function GhPageVisibilityProvider({ enabled = true, children }) {
  const [loading, setLoading] = useState(enabled);
  const [visibility, setVisibility] = useState(null);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setVisibility(null);
      return undefined;
    }

    let active = true;
    setLoading(true);
    getGhPageVisibility()
      .then((data) => {
        if (!active) return;
        const map = {};
        (data?.pages || []).forEach((page) => {
          // explicit boolean — never leave key missing
          map[page.key] = page.is_visible === true;
        });
        setVisibility(map);
      })
      .catch(() => {
        if (!active) return;
        // on error treat all pages as visible so app still works
        setVisibility(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [enabled, tick]);

  const value = useMemo(() => {
    // null visibility = not loaded / error → show everything (safe fallback)
    const isPageVisible = (pageKey) => {
      if (visibility === null) return true;
      // if key somehow missing, default visible
      return visibility[pageKey] !== false;
    };

    const firstVisiblePath = GH_PAGE_ORDER
      .map((key) => (isPageVisible(key) ? GH_PAGE_PATHS[key] : null))
      .find(Boolean) || '/gh/profile';

    return {
      loading,
      visibility,
      isPageVisible,
      firstVisiblePath,
      reload,
    };
  }, [loading, visibility, reload]);

  return (
    <GhPageVisibilityContext.Provider value={value}>
      {children}
    </GhPageVisibilityContext.Provider>
  );
}

export function useGhPageVisibility() {
  return useContext(GhPageVisibilityContext);
}
