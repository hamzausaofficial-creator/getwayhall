import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getHallPageVisibility } from '../api/bookings';
import { HALL_PAGE_ORDER, HALL_PAGE_PATHS } from '../constants/hallPages';

const HallPageVisibilityContext = createContext({
  loading: true,
  visibility: null,
  maintenance: null,
  isPageVisible: () => true,
  isPageInMaintenance: () => false,
  firstVisiblePath: '/bookings',
  reload: () => {},
});

export function HallPageVisibilityProvider({ enabled = true, children }) {
  const [loading, setLoading] = useState(enabled);
  const [visibility, setVisibility] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setVisibility(null);
      setMaintenance(null);
      return undefined;
    }

    let active = true;
    setLoading(true);
    getHallPageVisibility()
      .then((data) => {
        if (!active) return;
        const map = {};
        const maintMap = {};
        (data?.pages || []).forEach((page) => {
          map[page.key] = page.is_visible === true;
          maintMap[page.key] = page.in_maintenance === true;
        });
        setVisibility(map);
        setMaintenance(maintMap);
      })
      .catch(() => {
        if (!active) return;
        setVisibility(null);
        setMaintenance(null);
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

    const isPageInMaintenance = (pageKey) => {
      if (maintenance === null) return false;
      return maintenance[pageKey] === true;
    };

    const firstVisiblePath = HALL_PAGE_ORDER
      .map((key) => (isPageVisible(key) ? HALL_PAGE_PATHS[key] : null))
      .find(Boolean) || '/bookings';

    return {
      loading,
      visibility,
      maintenance,
      isPageVisible,
      isPageInMaintenance,
      firstVisiblePath,
      reload,
    };
  }, [loading, visibility, maintenance, reload]);

  return (
    <HallPageVisibilityContext.Provider value={value}>
      {children}
    </HallPageVisibilityContext.Provider>
  );
}

export function useHallPageVisibility() {
  return useContext(HallPageVisibilityContext);
}
