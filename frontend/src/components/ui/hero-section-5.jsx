import { forwardRef, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';

const STATUS_CLASS = {
  complete: 'landing-roadmap__dot--complete',
  'in-progress': 'landing-roadmap__dot--active',
  pending: 'landing-roadmap__dot--pending',
};

function MilestoneMarker({ milestone }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: milestone.id * 0.2, ease: 'easeOut' }}
      viewport={{ once: true, amount: 0.6 }}
      className="landing-roadmap__marker"
      style={milestone.position}
    >
      <div className="landing-roadmap__marker-pin">
        <div className={cn('landing-roadmap__dot', STATUS_CLASS[milestone.status])} />
        <div className="landing-roadmap__dot-ring" />
      </div>
      <div className="landing-roadmap__marker-label">{milestone.name}</div>
    </motion.div>
  );
}

export const AnimatedRoadmap = forwardRef(function AnimatedRoadmap(
  { className, milestones = [], mapImageSrc, ...props },
  ref,
) {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  });

  const pathLength = useTransform(scrollYProgress, [0.12, 0.72], [0, 1]);

  return (
    <div
      ref={(node) => {
        targetRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn('landing-roadmap', className)}
      {...props}
    >
      {mapImageSrc && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.2 }}
          className="landing-roadmap__map-wrap"
        >
          <img src={mapImageSrc} alt="" className="landing-roadmap__map" loading="lazy" />
        </motion.div>
      )}

      <div className="landing-roadmap__canvas">
        <svg
          className="landing-roadmap__svg"
          viewBox="0 0 800 400"
          preserveAspectRatio="none"
          aria-hidden
        >
          <motion.path
            d="M 50 350 Q 200 50 400 200 T 750 100"
            fill="none"
            stroke="#5bd51e"
            strokeWidth="3"
            strokeDasharray="10 5"
            strokeLinecap="round"
            style={{ pathLength }}
          />
        </svg>

        {milestones.map((milestone) => (
          <MilestoneMarker key={milestone.id} milestone={milestone} />
        ))}
      </div>
    </div>
  );
});

AnimatedRoadmap.displayName = 'AnimatedRoadmap';
