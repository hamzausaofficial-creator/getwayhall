import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { getGhPageVisibility } from '../api/guesthouse';
import { GH_PAGE_ORDER, GH_PAGE_PATHS } from '../constants/ghPages';
import { isMaintenanceExpired } from '../utils/maintenanceTime';

// null = not loaded yet, {} = loaded (use explicit true/false per key)
const GhPageVisibilityContext = createContext({
  loading: true,
  visibility: null,
  maintenance: null,
  maintenanceUntil: null,
  moduleVisibility: null,
  moduleMaintenance: null,
  moduleMaintenanceUntil: null,
  isPageVisible: () => true,
  isPageInMaintenance: () => false,
  getPageMaintenanceUntil: () => null,
  isModuleVisible: () => true,
  isModuleInMaintenance: () => false,
  firstVisiblePath: '/gh/stays',
  reload: () => {},
});

export function GhPageVisibilityProvider({ enabled = true, children }) {
  const [loading, setLoading] = useState(enabled);
  const [visibility, setVisibility] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [maintenanceUntil, setMaintenanceUntil] = useState(null);
  const [moduleVisibility, setModuleVisibility] = useState(null);
  const [moduleMaintenance, setModuleMaintenance] = useState(null);
  const [moduleMaintenanceUntil, setModuleMaintenanceUntil] = useState(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setVisibility(null);
      setMaintenance(null);
      setMaintenanceUntil(null);
      setModuleVisibility(null);
      setModuleMaintenance(null);
      setModuleMaintenanceUntil(null);
      return undefined;
    }

    let active = true;
    setLoading(true);
    getGhPageVisibility()
      .then((data) => {
        if (!active) return;
        const map = {};
        const maintMap = {};
        const untilMap = {};
        const moduleMap = {};
        const moduleMaintMap = {};
        const moduleUntilMap = {};
        (data?.pages || []).forEach((page) => {
          map[page.key] = page.is_visible === true;
          maintMap[page.key] = page.in_maintenance === true;
          untilMap[page.key] = page.maintenance_until || null;
        });
        (data?.modules || []).forEach((mod) => {
          moduleMap[mod.key] = mod.is_visible === true;
          moduleMaintMap[mod.key] = mod.in_maintenance === true;
          moduleUntilMap[mod.key] = mod.maintenance_until || null;
        });
        setVisibility(map);
        setMaintenance(maintMap);
        setMaintenanceUntil(untilMap);
        setModuleVisibility(moduleMap);
        setModuleMaintenance(moduleMaintMap);
        setModuleMaintenanceUntil(moduleUntilMap);
      })
      .catch(() => {
        if (!active) return;
        setVisibility(null);
        setMaintenance(null);
        setMaintenanceUntil(null);
        setModuleVisibility(null);
        setModuleMaintenance(null);
        setModuleMaintenanceUntil(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [enabled, tick]);

  const value = useMemo(() => {
    const isActiveMaintenance = (active, until) => {
      if (!active) return false;
      if (until && isMaintenanceExpired(until)) return false;
      return true;
    };

    const isPageVisible = (pageKey) => {
      if (visibility === null) return true;
      return visibility[pageKey] !== false;
    };

    const getPageMaintenanceUntil = (pageKey) => {
      if (maintenanceUntil === null) return null;
      return maintenanceUntil[pageKey] || null;
    };

    const isPageInMaintenance = (pageKey) => {
      if (maintenance === null) return false;
      return isActiveMaintenance(
        maintenance[pageKey] === true,
        getPageMaintenanceUntil(pageKey),
      );
    };

    const isModuleVisible = (moduleKey) => {
      if (moduleVisibility === null) return true;
      return moduleVisibility[moduleKey] !== false;
    };

    const isModuleInMaintenance = (moduleKey) => {
      if (moduleMaintenance === null) return false;
      const until = moduleMaintenanceUntil?.[moduleKey] || null;
      return isActiveMaintenance(moduleMaintenance[moduleKey] === true, until);
    };

    const firstVisiblePath = GH_PAGE_ORDER
      .map((key) => (isPageVisible(key) ? GH_PAGE_PATHS[key] : null))
      .find(Boolean) || '/gh/stays';

    return {
      loading,
      visibility,
      maintenance,
      maintenanceUntil,
      moduleVisibility,
      moduleMaintenance,
      moduleMaintenanceUntil,
      isPageVisible,
      isPageInMaintenance,
      getPageMaintenanceUntil,
      isModuleVisible,
      isModuleInMaintenance,
      firstVisiblePath,
      reload,
    };
  }, [
    loading,
    visibility,
    maintenance,
    maintenanceUntil,
    moduleVisibility,
    moduleMaintenance,
    moduleMaintenanceUntil,
    reload,
  ]);

  return (
    <GhPageVisibilityContext.Provider value={value}>
      {children}
    </GhPageVisibilityContext.Provider>
  );
}

export function useGhPageVisibility() {
  return useContext(GhPageVisibilityContext);
}
