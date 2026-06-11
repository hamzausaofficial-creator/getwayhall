import { motion } from 'framer-motion';
import { Shield, Headphones, Building2, Star } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { Sparkles } from '../ui/sparkles';
import { InfiniteSlider } from '../ui/infinite-slider';
import { ProgressiveBlur } from '../ui/progressive-blur';

const ICONS = [Building2, Star, Shield, Headphones];

function TrustStatCard({ stat, index }) {
  const Icon = ICONS[index % ICONS.length];
  return (
    <div className="landing-trust-card">
      <div className="landing-trust-card__icon">
        <Icon size={22} />
      </div>
      <div>
        <p className="landing-trust-card__value">
          <AnimatedCounter
            key={`${stat.id}-${stat.value_number}-${stat.value_display}`}
            value={stat.value_number}
            suffix={stat.suffix}
            display={stat.value_display}
          />
        </p>
        <p className="landing-trust-card__label">{stat.label}</p>
      </div>
    </div>
  );
}

export default function TrustSection({ stats = [] }) {
  if (!stats.length) return null;

  return (
    <section
      className="landing-section--compact landing-section-soft overflow-hidden landing-trust-sparkles"
      style={{
        borderTop: '1px solid rgba(226,232,240,0.5)',
        borderBottom: '1px solid rgba(226,232,240,0.5)',
      }}
    >
      <div className="landing-container relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="landing-section-header landing-trust-sparkles__header text-center"
          style={{ marginBottom: '1rem' }}
        >
          <p className="landing-kicker">Trusted Worldwide</p>
          <h2 className="landing-heading" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
            Venues That Trust Gateway
          </h2>
        </motion.div>

        <div className="relative landing-trust-sparkles__slider w-full">
          <InfiniteSlider
            className="flex h-full w-full items-center"
            duration={30}
            gap={20}
          >
            {stats.map((stat, i) => (
              <TrustStatCard key={stat.id ?? i} stat={stat} index={i} />
            ))}
          </InfiniteSlider>
          <ProgressiveBlur
            className="pointer-events-none absolute top-0 left-0 h-full w-[120px] sm:w-[200px]"
            direction="left"
            blurIntensity={1}
            maskColor="247, 249, 251"
          />
          <ProgressiveBlur
            className="pointer-events-none absolute top-0 right-0 h-full w-[120px] sm:w-[200px]"
            direction="right"
            blurIntensity={1}
            maskColor="247, 249, 251"
          />
        </div>
      </div>

      <div className="landing-trust-sparkles__glow">
        <div className="landing-trust-sparkles__glow-radial absolute inset-0" />
        <Sparkles
          density={800}
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
          color="#5bd51e"
        />
      </div>
    </section>
  );
}
