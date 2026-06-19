import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getGhPageVisibility } from '../api/guesthouse';
import { GH_PAGE_ORDER, GH_PAGE_PATHS } from '../constants/ghPages';

// null = not loaded yet, {} = loaded (use explicit true/false per key)
const GhPageVisibilityContext = createContext({
  loading: true,
  visibility: null,
  maintenance: null,
  moduleVisibility: null,
  moduleMaintenance: null,
  isPageVisible: () => true,
  isPageInMaintenance: () => false,
  isModuleVisible: () => true,
  isModuleInMaintenance: () => false,
  firstVisiblePath: '/gh/stays',
  reload: () => {},
});

export function GhPageVisibilityProvider({ enabled = true, children }) {
  const [loading, setLoading] = useState(enabled);
  const [visibility, setVisibility] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [moduleVisibility, setModuleVisibility] = useState(null);
  const [moduleMaintenance, setModuleMaintenance] = useState(null);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setVisibility(null);
      setMaintenance(null);
      setModuleVisibility(null);
      setModuleMaintenance(null);
      return undefined;
    }

    let active = true;
    setLoading(true);
    getGhPageVisibility()
      .then((data) => {
        if (!active) return;
        const map = {};
        const maintMap = {};
        const moduleMap = {};
        const moduleMaintMap = {};
        (data?.pages || []).forEach((page) => {
          map[page.key] = page.is_visible === true;
          maintMap[page.key] = page.in_maintenance === true;
        });
        (data?.modules || []).forEach((mod) => {
          moduleMap[mod.key] = mod.is_visible === true;
          moduleMaintMap[mod.key] = mod.in_maintenance === true;
        });
        setVisibility(map);
        setMaintenance(maintMap);
        setModuleVisibility(moduleMap);
        setModuleMaintenance(moduleMaintMap);
      })
      .catch(() => {
        if (!active) return;
        setVisibility(null);
        setMaintenance(null);
        setModuleVisibility(null);
        setModuleMaintenance(null);
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

    const isPageInMaintenance = (pageKey) => {
      if (maintenance === null) return false;
      return maintenance[pageKey] === true;
    };

    const isModuleVisible = (moduleKey) => {
      if (moduleVisibility === null) return true;
      return moduleVisibility[moduleKey] !== false;
    };

    const isModuleInMaintenance = (moduleKey) => {
      if (moduleMaintenance === null) return false;
      return moduleMaintenance[moduleKey] === true;
    };

    const firstVisiblePath = GH_PAGE_ORDER
      .map((key) => (isPageVisible(key) ? GH_PAGE_PATHS[key] : null))
      .find(Boolean) || '/gh/stays';

    return {
      loading,
      visibility,
      maintenance,
      moduleVisibility,
      moduleMaintenance,
      isPageVisible,
      isPageInMaintenance,
      isModuleVisible,
      isModuleInMaintenance,
      firstVisiblePath,
      reload,
    };
  }, [loading, visibility, maintenance, moduleVisibility, moduleMaintenance, reload]);

  return (
    <GhPageVisibilityContext.Provider value={value}>
      {children}
    </GhPageVisibilityContext.Provider>
  );
}

export function useGhPageVisibility() {
  return useContext(GhPageVisibilityContext);
}
