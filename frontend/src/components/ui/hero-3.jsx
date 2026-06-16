import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { VaporHeroTagline } from './vapour-text-effect';

const FADE_IN = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
};

function ActionButton({ children, onClick, variant = 'primary' }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'landing-marquee-hero__btn',
        variant === 'outline' && 'landing-marquee-hero__btn--outline',
      )}
    >
      {children}
    </motion.button>
  );
}

function AnimatedTitle({ title }) {
  if (typeof title !== 'string') {
    return (
      <motion.h1
        className="landing-marquee-hero__title"
        initial="hidden"
        animate="show"
        variants={FADE_IN}
      >
        {title}
      </motion.h1>
    );
  }

  const words = title.split(' ');

  return (
    <motion.h1
      className="landing-marquee-hero__title"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={FADE_IN}
          className={cn(
            'landing-marquee-hero__title-word',
            i === words.length - 1 && 'landing-marquee-hero__title-accent',
          )}
        >
          {word}
          {i < words.length - 1 ? '\u00a0' : ''}
        </motion.span>
      ))}
    </motion.h1>
  );
}

export function AnimatedMarqueeHero({
  tagline = 'Premium Venue Management',
  taglineTexts,
  title,
  description,
  ctaText = 'Get Started',
  secondaryCtaText = 'View Features',
  images = [],
  className,
  onCtaClick,
  onSecondaryCtaClick,
}) {
  const marqueeImages = images.length >= 4 ? images : [
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=640&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=640&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=640&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=640&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=640&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=640&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&q=80&auto=format&fit=crop',
  ];

  const loop = [...marqueeImages, ...marqueeImages];
  const vaporTexts = taglineTexts ?? [tagline];

  return (
    <section className={cn('landing-marquee-hero', className)}>
      <div className="landing-marquee-hero__mesh" aria-hidden />
      <div className="landing-marquee-hero__grain" aria-hidden />

      <div className="landing-marquee-hero__content">
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN}
          className="landing-marquee-hero__tagline"
        >
          <Sparkles size={14} aria-hidden />
          <div className="landing-marquee-hero__tagline-vapor">
            <VaporHeroTagline texts={vaporTexts} />
          </div>
        </motion.div>

        <AnimatedTitle title={title} />

        {description && (
          <motion.p
            initial="hidden"
            animate="show"
            variants={FADE_IN}
            transition={{ delay: 0.45 }}
            className="landing-marquee-hero__description"
          >
            {description}
          </motion.p>
        )}

        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN}
          transition={{ delay: 0.55 }}
          className="landing-marquee-hero__actions"
        >
          <ActionButton onClick={onCtaClick}>
            {ctaText}
            <ArrowRight size={18} aria-hidden />
          </ActionButton>
          {secondaryCtaText && (
            <ActionButton variant="outline" onClick={onSecondaryCtaClick}>
              {secondaryCtaText}
            </ActionButton>
          )}
        </motion.div>
      </div>

      <div className="landing-marquee-hero__marquee-wrap" aria-hidden>
        <div className="landing-marquee-hero__marquee-track">
          {loop.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="landing-marquee-hero__marquee-item"
              style={{ rotate: `${index % 2 === 0 ? -3 : 4}deg` }}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
