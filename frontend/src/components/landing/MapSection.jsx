import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AnimatedRoadmap } from '../ui/hero-section-5';

const MAP_IMAGE = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80&auto=format&fit=crop';

const MILESTONES = [
  {
    id: 1,
    name: 'Punjab Halls',
    status: 'complete',
    position: { top: '68%', left: '8%' },
  },
  {
    id: 2,
    name: 'Sindh Venues',
    status: 'complete',
    position: { top: '72%', left: '28%' },
  },
  {
    id: 3,
    name: 'Islamabad & RWP',
    status: 'in-progress',
    position: { top: '38%', left: '52%' },
  },
  {
    id: 4,
    name: 'Nationwide Rollout',
    status: 'pending',
    position: { top: '12%', right: '8%' },
  },
];

export default function MapSection() {
  const navigate = useNavigate();

  return (
    <section id="coverage" className="landing-section landing-section-white landing-map-section">
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="landing-map-section__header"
        >
          <p className="landing-kicker">Coverage Map</p>
          <h2 className="landing-heading">
            Manage Venues With a{' '}
            <span className="landing-map-section__accent">Clear Roadmap</span>
          </h2>
          <p className="landing-sub">
            From Punjab marriage halls to guest houses nationwide - visualize operations,
            track milestones, and grow your venue network step by step.
          </p>
          <div className="landing-map-section__actions">
            <button type="button" className="landing-btn-primary" onClick={() => navigate('/login')}>
              Get Started - It&apos;s Free
            </button>
            <button
              type="button"
              className="landing-btn-outline landing-map-section__btn-outline"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See How It Works
            </button>
          </div>
        </motion.div>

        <AnimatedRoadmap
          milestones={MILESTONES}
          mapImageSrc={MAP_IMAGE}
          aria-label="Animated map showing venue coverage milestones across Pakistan"
        />
      </div>
    </section>
  );
}
