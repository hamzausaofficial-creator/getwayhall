import { motion } from 'framer-motion';
import { UserPlus, Building2, CalendarCheck, PartyPopper } from 'lucide-react';

const STEPS = [
  { icon: UserPlus, step: '01', title: 'Create Account', desc: 'Sign in and set up your venue profile in minutes.' },
  { icon: Building2, step: '02', title: 'Setup Venue', desc: 'Add halls, rooms, rates, staff, and services.' },
  { icon: CalendarCheck, step: '03', title: 'Manage Bookings', desc: 'Accept reservations, track guests, and collect payments.' },
  { icon: PartyPopper, step: '04', title: 'Run Successful Events', desc: 'Deliver flawless events with real-time operational control.' },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="landing-section landing-how-section">
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="landing-section-header"
        >
          <p className="landing-kicker">Simple Process</p>
          <h2 className="landing-heading">How It Works</h2>
          <p className="landing-sub">Four steps from signup to running your venue like a pro.</p>
        </motion.div>

        <div className="landing-steps-wrap">
          <div className="landing-timeline-line" aria-hidden="true" />
          <div className="landing-steps-grid">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="landing-step"
              >
                <div className="landing-step-card">
                  <span className="landing-step-card__label">{s.step}</span>
                  <div className="landing-step-icon">
                    <s.icon size={26} />
                  </div>
                  <h3 className="landing-step-card__title">{s.title}</h3>
                  <p className="landing-step-card__desc">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
