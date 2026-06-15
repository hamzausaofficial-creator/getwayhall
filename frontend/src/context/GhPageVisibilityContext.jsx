import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getGhPageVisibility } from '../api/guesthouse';
import { GH_PAGE_ORDER, GH_PAGE_PATHS } from '../constants/ghPages';

// null = not loaded yet, {} = loaded (use explicit true/false per key)
const GhPageVisibilityContext = createContext({
  loading: true,
  visibility: null,
  moduleVisibility: null,
  isPageVisible: () => true,
  isModuleVisible: () => true,
  firstVisiblePath: '/gh/stays',
  reload: () => {},
});

export function GhPageVisibilityProvider({ enabled = true, children }) {
  const [loading, setLoading] = useState(enabled);
  const [visibility, setVisibility] = useState(null);
  const [moduleVisibility, setModuleVisibility] = useState(null);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setVisibility(null);
      setModuleVisibility(null);
      return undefined;
    }

    let active = true;
    setLoading(true);
    getGhPageVisibility()
      .then((data) => {
        if (!active) return;
        const map = {};
        const moduleMap = {};
        (data?.pages || []).forEach((page) => {
          map[page.key] = page.is_visible === true;
        });
        (data?.modules || []).forEach((mod) => {
          moduleMap[mod.key] = mod.is_visible === true;
        });
        setVisibility(map);
        setModuleVisibility(moduleMap);
      })
      .catch(() => {
        if (!active) return;
        setVisibility(null);
        setModuleVisibility(null);
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
      return visibility[pageKey] !== false;
    };

    const isModuleVisible = (moduleKey) => {
      if (moduleVisibility === null) return true;
      return moduleVisibility[moduleKey] !== false;
    };

    const firstVisiblePath = GH_PAGE_ORDER
      .map((key) => (isPageVisible(key) ? GH_PAGE_PATHS[key] : null))
      .find(Boolean) || '/gh/stays';

    return {
      loading,
      visibility,
      moduleVisibility,
      isPageVisible,
      isModuleVisible,
      firstVisiblePath,
      reload,
    };
  }, [loading, visibility, moduleVisibility, reload]);

  return (
    <GhPageVisibilityContext.Provider value={value}>
      {children}
    </GhPageVisibilityContext.Provider>
  );
}

export function useGhPageVisibility() {
  return useContext(GhPageVisibilityContext);
}
