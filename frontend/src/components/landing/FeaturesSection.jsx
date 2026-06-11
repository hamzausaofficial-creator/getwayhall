import { motion } from 'framer-motion';
import {
  Calendar, Home, Clock, Users, Receipt, UserCog, Wallet,
  BarChart3, Shield,
} from 'lucide-react';
import DisplayCards from '../ui/display-cards';

const FEATURES = [
  { icon: Calendar, title: 'Hall Booking Management', desc: 'Smart scheduling, availability, and conflict-free reservations.', featured: true },
  { icon: Home, title: 'Guest House Management', desc: 'Rooms, stays, check-in/out, and guest directory in one place.', featured: true },
  { icon: Wallet, title: 'Payment Tracking', desc: 'Advances, collections, balances, and receipts.', featured: true },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Revenue, occupancy, and performance insights.' },
  { icon: Users, title: 'Customer Records', desc: 'CNIC, contacts, history, and guest profiles unified.' },
  { icon: Clock, title: 'Event Scheduling', desc: 'Calendar views for halls and guest house occupancy.' },
  { icon: Receipt, title: 'Expense Tracking', desc: 'Vouchers, operating costs, and financial visibility.' },
  { icon: UserCog, title: 'Staff Management', desc: 'Roles, permissions, and team coordination.' },
  { icon: Shield, title: 'Multi User Access', desc: 'Admin, manager, and staff roles with secure access.' },
];

const HIGHLIGHT_LABELS = ['Core module', 'Guest ops', 'Finance'];

function buildDisplayCards() {
  return FEATURES.slice(0, 3).map((f, i) => ({
    icon: <f.icon size={16} />,
    title: f.title.split(' ').slice(0, 2).join(' '),
    description: f.desc.length > 36 ? `${f.desc.slice(0, 36)}…` : f.desc,
    date: HIGHLIGHT_LABELS[i],
  }));
}

export default function FeaturesSection() {
  return (
    <section id="features" className="landing-section landing-section-soft">
      <div className="landing-container">
        <div className="landing-features-hero">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="landing-features-hero__copy"
          >
            <p className="landing-kicker">Platform Features</p>
            <h2 className="landing-heading landing-features-hero__title">Everything You Need</h2>
            <p className="landing-sub landing-features-hero__sub">
              One elegant system for marriage halls and guest houses - bookings, guests, finance, and operations.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="landing-features-hero__cards"
          >
            <DisplayCards cards={buildDisplayCards()} variant="light" />
          </motion.div>
        </div>

        <div className="landing-features-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <div className={`landing-card landing-feature-card ${f.featured ? 'landing-card--featured' : ''}`}>
                <div className={`landing-feature-card__icon ${f.featured ? 'landing-feature-card__icon--featured' : ''}`}>
                  <f.icon size={24} />
                </div>
                <h3 className={`landing-feature-card__title ${f.featured ? 'landing-feature-card__title--featured' : ''}`}>
                  {f.title}
                </h3>
                <p className={`landing-feature-card__desc ${f.featured ? 'landing-feature-card__desc--featured' : ''}`}>
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
