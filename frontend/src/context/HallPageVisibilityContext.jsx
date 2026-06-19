import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getHallPageVisibility } from '../api/bookings';
import { HALL_PAGE_ORDER, HALL_PAGE_PATHS } from '../constants/hallPages';

const HallPageVisibilityContext = createContext({
  loading: true,
  visibility: null,
  isPageVisible: () => true,
  firstVisiblePath: '/bookings',
  reload: () => {},
});

export function HallPageVisibilityProvider({ enabled = true, children }) {
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
    getHallPageVisibility()
      .then((data) => {
        if (!active) return;
        const map = {};
        (data?.pages || []).forEach((page) => {
          map[page.key] = page.is_visible === true;
        });
        setVisibility(map);
      })
      .catch(() => {
        if (!active) return;
        setVisibility(null);
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

    const firstVisiblePath = HALL_PAGE_ORDER
      .map((key) => (isPageVisible(key) ? HALL_PAGE_PATHS[key] : null))
      .find(Boolean) || '/bookings';

    return {
      loading,
      visibility,
      isPageVisible,
      firstVisiblePath,
      reload,
    };
  }, [loading, visibility, reload]);

  return (
    <HallPageVisibilityContext.Provider value={value}>
      {children}
    </HallPageVisibilityContext.Provider>
  );
}

export function useHallPageVisibility() {
  return useContext(HallPageVisibilityContext);
}
