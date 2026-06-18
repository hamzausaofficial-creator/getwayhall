import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageTitle } from '../utils/pageTitle';

const PageTitleContext = createContext({
  title: '',
  setPageTitle: () => {},
});

export function PageTitleProvider({ children }) {
  const location = useLocation();
  const [override, setOverride] = useState(null);

  useEffect(() => {
    setOverride(null);
  }, [location.pathname, location.search]);

  const title = override ?? getPageTitle(location.pathname, location.search);

  const value = useMemo(
    () => ({ title, setPageTitle: setOverride }),
    [title],
  );

  return (
    <PageTitleContext.Provider value={value}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitleContext() {
  return useContext(PageTitleContext);
}

/** Override the shell header title while this page is mounted. */
export function usePageTitle(title) {
  const { setPageTitle } = usePageTitleContext();

  useEffect(() => {
    if (!title) return undefined;
    setPageTitle(title);
    return () => setPageTitle(null);
  }, [title, setPageTitle]);
}
