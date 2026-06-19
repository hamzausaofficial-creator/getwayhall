import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { getHallPageVisibility } from '../api/bookings';
import { HALL_PAGE_ORDER, HALL_PAGE_PATHS } from '../constants/hallPages';
import { isMaintenanceExpired } from '../utils/maintenanceTime';

const HallPageVisibilityContext = createContext({
  loading: true,
  visibility: null,
  maintenance: null,
  maintenanceUntil: null,
  isPageVisible: () => true,
  isPageInMaintenance: () => false,
  getPageMaintenanceUntil: () => null,
  firstVisiblePath: '/bookings',
  reload: () => {},
});

export function HallPageVisibilityProvider({ enabled = true, children }) {
  const [loading, setLoading] = useState(enabled);
  const [visibility, setVisibility] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [maintenanceUntil, setMaintenanceUntil] = useState(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setVisibility(null);
      setMaintenance(null);
      setMaintenanceUntil(null);
      return undefined;
    }

    let active = true;
    setLoading(true);
    getHallPageVisibility()
      .then((data) => {
        if (!active) return;
        const map = {};
        const maintMap = {};
        const untilMap = {};
        (data?.pages || []).forEach((page) => {
          map[page.key] = page.is_visible === true;
          maintMap[page.key] = page.in_maintenance === true;
          untilMap[page.key] = page.maintenance_until || null;
        });
        setVisibility(map);
        setMaintenance(maintMap);
        setMaintenanceUntil(untilMap);
      })
      .catch(() => {
        if (!active) return;
        setVisibility(null);
        setMaintenance(null);
        setMaintenanceUntil(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [enabled, tick]);

  const value = useMemo(() => {
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
      if (maintenance[pageKey] !== true) return false;
      const until = getPageMaintenanceUntil(pageKey);
      if (until && isMaintenanceExpired(until)) return false;
      return true;
    };

    const firstVisiblePath = HALL_PAGE_ORDER
      .map((key) => (isPageVisible(key) ? HALL_PAGE_PATHS[key] : null))
      .find(Boolean) || '/bookings';

    return {
      loading,
      visibility,
      maintenance,
      maintenanceUntil,
      isPageVisible,
      isPageInMaintenance,
      getPageMaintenanceUntil,
      firstVisiblePath,
      reload,
    };
  }, [loading, visibility, maintenance, maintenanceUntil, reload]);

  return (
    <HallPageVisibilityContext.Provider value={value}>
      {children}
    </HallPageVisibilityContext.Provider>
  );
}

export function useHallPageVisibility() {
  return useContext(HallPageVisibilityContext);
}
