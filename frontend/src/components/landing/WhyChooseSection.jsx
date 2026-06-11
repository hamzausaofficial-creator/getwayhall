import { motion } from 'framer-motion';
import { Zap, Shield, Smartphone, Headphones, Gauge, MousePointerClick } from 'lucide-react';

const ITEMS = [
  { icon: MousePointerClick, title: 'Easy To Use', desc: 'Intuitive interface designed for venue staff - no training headaches.' },
  { icon: Gauge, title: 'Fast Performance', desc: 'Lightning-fast dashboards built for busy wedding seasons.' },
  { icon: Shield, title: 'Secure Data', desc: 'Role-based access and encrypted storage for peace of mind.' },
  { icon: Smartphone, title: 'Mobile Responsive', desc: 'Manage bookings and guests from any device, anywhere.' },
  { icon: Zap, title: 'Real-Time Management', desc: 'Live updates on availability, payments, and guest status.' },
  { icon: Headphones, title: 'Professional Support', desc: 'Dedicated help when you need it most.' },
];

const DEFAULT_BADGES = [
  { id: 'years', text: '1+ Years' },
  { id: 'venues', text: '0+ Venues' },
  { id: 'rating', text: '0.0 Rating' },
  { id: 'support', text: '24/7 Support' },
];

export default function WhyChooseSection({ badges = DEFAULT_BADGES }) {
  return (
    <section className="landing-section landing-why-section">
      <div className="landing-container">
        <div className="landing-why-header">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="landing-kicker">Why Gateway</p>
            <h2 className="landing-why-title">
              Built For Venue Owners Who Demand Excellence
            </h2>
            <p className="landing-why-desc">
              From wedding halls to guest houses - every feature is crafted for the realities of Pakistani venue management.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="landing-why-badges">
            {badges.map((badge) => (
              <div key={badge.id} className="landing-why-badge">
                <p className="landing-why-badge__text">{badge.text}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="landing-why-cards">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="landing-why-card"
            >
              <div className="landing-feature-card__icon landing-feature-card__icon--featured" style={{ marginBottom: '1.25rem' }}>
                <item.icon size={26} />
              </div>
              <h3 className="landing-why-card__title">{item.title}</h3>
              <p className="landing-why-card__desc">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
