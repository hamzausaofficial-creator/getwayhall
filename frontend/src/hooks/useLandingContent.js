import { useEffect, useState } from 'react';
import { getLandingContent } from '../api/landing';
import { getLandingDefaults } from '../utils/landingDefaults';

const EMPTY = getLandingDefaults();

function pickList(apiList, defaultList, minCount) {
  if (!apiList?.length) return defaultList;
  if (apiList.length >= minCount) return apiList;
  return defaultList;
}

export function useLandingContent() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getLandingContent()
      .then((payload) => {
        setData({
          ...EMPTY,
          ...payload,
          testimonials: pickList(payload.testimonials, EMPTY.testimonials, 3),
          faqs: pickList(payload.faqs, EMPTY.faqs, 6),
          statistics: { ...EMPTY.statistics, ...payload.statistics },
        });
      })
      .catch((err) => {
        setData(getLandingDefaults());
        setError(err?.message || 'Failed to load landing content');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return { data, loading, error, reload: load };
}
