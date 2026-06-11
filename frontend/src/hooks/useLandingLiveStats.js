import { useEffect, useState } from 'react';
import { getLandingLiveStats } from '../api/landing';

const POLL_MS = 10_000;

const DEFAULT_WHY_BADGES = [
  { id: 'years', text: '1+ Years' },
  { id: 'venues', text: '0+ Venues' },
  { id: 'rating', text: '0.0 Rating' },
  { id: 'support', text: '24/7 Support' },
];

export function useLandingLiveStats({
  hero: initialHero = [],
  trust: initialTrust = [],
  whyBadges: initialWhyBadges = DEFAULT_WHY_BADGES,
} = {}) {
  const [hero, setHero] = useState(initialHero);
  const [trust, setTrust] = useState(initialTrust);
  const [whyBadges, setWhyBadges] = useState(initialWhyBadges);

  useEffect(() => {
    setHero(initialHero);
  }, [initialHero]);

  useEffect(() => {
    setTrust(initialTrust);
  }, [initialTrust]);

  useEffect(() => {
    if (initialWhyBadges?.length) {
      setWhyBadges(initialWhyBadges);
    }
  }, [initialWhyBadges]);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      getLandingLiveStats()
        .then((data) => {
          if (cancelled) return;
          if (Array.isArray(data?.hero) && data.hero.length) {
            setHero(data.hero);
          }
          if (Array.isArray(data?.trust) && data.trust.length) {
            setTrust(data.trust);
          }
          if (Array.isArray(data?.why_badges) && data.why_badges.length) {
            setWhyBadges(data.why_badges);
          }
        })
        .catch(() => {
          /* keep last known stats */
        });
    };

    refresh();
    const timer = setInterval(refresh, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return { hero, trust, whyBadges };
}

/** @deprecated Use useLandingLiveStats */
export function useLandingHeroStats(initialStats = []) {
  const { hero } = useLandingLiveStats({ hero: initialStats });
  return hero;
}
