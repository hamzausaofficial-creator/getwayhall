import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedMarqueeHero } from '../ui/hero-3';
import { resolveMediaUrl } from '../../utils/media';
import { getGalleryStockImage, isGenericHeroImage, GALLERY_PLACEHOLDERS } from '../../utils/galleryPlaceholders';
import AnimatedCounter from './AnimatedCounter';

const DEFAULT_TAGLINE = 'Trusted by venue owners across Pakistan';

function resolveGallerySrc(img) {
  if (img?.image_url && !isGenericHeroImage(img.image_url)) {
    return resolveMediaUrl(img.image_url);
  }
  return getGalleryStockImage(img?.category || 'OTHER');
}

function buildMarqueeImages(galleryImages = []) {
  if (galleryImages.length >= 4) {
    return galleryImages.map(resolveGallerySrc);
  }
  return Object.values(GALLERY_PLACEHOLDERS).map((p) => p.stockImage);
}

export default function HeroSection({ slides = [], heroStats = [], galleryImages = [] }) {
  const navigate = useNavigate();
  const items = slides.length ? slides : [{
    title: 'Manage Marriage Halls & Guest Houses With Ease',
    subtitle: 'Complete venue management solution for bookings, guests, events, finances and operations.',
    button_text: 'Get Started',
    button_link: '/login',
  }];

  const [index, setIndex] = useState(0);
  const current = items[index];

  const next = useCallback(() => setIndex((i) => (i + 1) % items.length), [items.length]);

  useEffect(() => {
    if (items.length <= 1) return undefined;
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [items.length, next]);

  const marqueeImages = useMemo(() => buildMarqueeImages(galleryImages), [galleryImages]);

  const handlePrimary = () => {
    const link = current.button_link || '/login';
    if (link.startsWith('http')) window.location.href = link;
    else if (link.startsWith('#')) document.querySelector(link)?.scrollIntoView({ behavior: 'smooth' });
    else navigate(link);
  };

  const titleNode = useMemo(() => {
    const text = current.title || '';
    if (!text.includes(' & ')) return text;
    const [line1, line2] = text.split(' & ');
    return (
      <>
        {line1} &<br />
        <span className="landing-marquee-hero__title-accent">{line2}</span>
      </>
    );
  }, [current.title]);

  return (
    <div className="landing-hero">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="landing-hero__marquee-wrap"
        >
          <AnimatedMarqueeHero
            tagline={DEFAULT_TAGLINE}
            title={titleNode}
            description={current.subtitle}
            ctaText={current.button_text || 'Get Started'}
            secondaryCtaText="View Features"
            images={marqueeImages}
            onCtaClick={handlePrimary}
            onSecondaryCtaClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          />
        </motion.div>
      </AnimatePresence>

      {heroStats.length > 0 && (
        <div className="landing-hero-stats">
          <div className="landing-container landing-hero-stats__inner">
            <div className="landing-hero-stats__grid">
              {heroStats.map((stat, i) => (
                <motion.div
                  key={stat.id ?? i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="landing-hero-stats__item"
                >
                  <p className="landing-hero-stats__value">
                    <AnimatedCounter
                      key={`${stat.id}-${stat.value_number}-${stat.value_display}`}
                      value={stat.value_number}
                      suffix={stat.suffix}
                      display={stat.value_display}
                    />
                  </p>
                  <p className="landing-hero-stats__label">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
