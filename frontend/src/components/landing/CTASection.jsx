import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Sparkles } from 'lucide-react';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="landing-section landing-section--cta">
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="landing-cta-panel"
        >
          <div className="landing-cta-panel__glow landing-cta-panel__glow--left" aria-hidden />
          <div className="landing-cta-panel__glow landing-cta-panel__glow--right" aria-hidden />
          <div className="landing-cta-panel__grid" aria-hidden />
          <div className="landing-cta-panel__ring" aria-hidden />

          <div className="landing-cta-panel__inner">
            <div className="landing-cta-badge">
              <Sparkles size={15} aria-hidden />
              Start Free Today
            </div>
            <h2 className="landing-cta-title">
              Ready To Simplify Your{' '}
              <span className="landing-cta-title__accent">Venue Management?</span>
            </h2>
            <p className="landing-cta-desc">
              Join premier marriage halls and guest houses that trust Gateway to power every booking and event.
            </p>
            <div className="landing-cta-actions">
              <button type="button" onClick={() => navigate('/login')} className="landing-cta-btn-primary">
                Start Now
                <ArrowRight size={18} aria-hidden />
              </button>
              <a href="mailto:support@gatewaymarriagehall.com" className="landing-cta-btn-outline">
                <Mail size={18} aria-hidden />
                Contact Us
              </a>
            </div>
            <p className="landing-cta-footnote">No credit card required · Setup in minutes</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
