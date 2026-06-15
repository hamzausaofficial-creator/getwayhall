import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Heart,
  Home,
  MapPin,
  Shield,
  Sparkles,
  Target,
  Users,
  Wallet,
} from 'lucide-react';
import LandingNav from '../components/landing/LandingNav';
import LandingFooter from '../components/landing/LandingFooter';
import CTASection from '../components/landing/CTASection';
import DisplayCards from '../components/ui/display-cards';
import { BRAND_FULL_NAME, BRAND_GUEST_HOUSE } from '../constants/brand';
import { GALLERY_PLACEHOLDERS } from '../utils/galleryPlaceholders';

const STATS = [
  { value: '2', label: 'Integrated modules' },
  { value: '24/7', label: 'Operational support' },
  { value: 'CNIC', label: 'Smart guest onboarding' },
  { value: '100%', label: 'Cloud-ready platform' },
];

const VALUES = [
  {
    icon: Heart,
    title: 'Hospitality First',
    desc: 'Every wedding and stay should feel personal. We build tools that help your team deliver warm, professional service.',
  },
  {
    icon: Shield,
    title: 'Trust & Transparency',
    desc: 'Clear bookings, payments, and records so owners and clients always know where things stand.',
  },
  {
    icon: Sparkles,
    title: 'Operational Excellence',
    desc: 'From hall capacity to guest check-ins, we streamline the details that make great events run smoothly.',
  },
  {
    icon: Users,
    title: 'Built For Teams',
    desc: 'Role-based access for managers, staff, and front desk — everyone works from one reliable system.',
  },
];

const OFFERINGS = [
  {
    icon: Building2,
    title: 'Marriage Hall Management',
    desc: 'Bookings, billing, decoration packages, inventory, payments, and printable receipts — tailored for Pakistani wedding venues.',
    featured: true,
  },
  {
    icon: Home,
    title: BRAND_GUEST_HOUSE,
    desc: 'Room stays, check-in/out, guest directory, CNIC scanning, and daily operations for attached guest houses.',
    featured: true,
  },
];

const MILESTONES = [
  { icon: Target, step: '01', title: 'Our Vision', desc: 'Bring professional venue software to every marriage hall and guest house in Pakistan.' },
  { icon: Building2, step: '02', title: 'Dual Platform', desc: 'One account for hall events and overnight guest stays — no duplicate systems.' },
  { icon: CalendarCheck, step: '03', title: 'Daily Operations', desc: 'Bookings, calendars, payments, and reports designed for real front-desk workflows.' },
  { icon: MapPin, step: '04', title: 'Local First', desc: 'CNIC capture, PKR billing, wedding slots, and venue practices built for local needs.' },
];

const DISPLAY_CARDS = [
  {
    icon: <Building2 size={16} />,
    title: 'Hall Events',
    description: 'Barat, walima, mehndi & corporate bookings',
    date: 'Core module',
  },
  {
    icon: <Home size={16} />,
    title: 'Guest House',
    description: 'Rooms, stays & check-in management',
    date: 'Guest ops',
  },
  {
    icon: <Wallet size={16} />,
    title: 'Finance',
    description: 'Advances, dues & printable receipts',
    date: 'Payments',
  },
];

const BADGES = [
  { id: 'local', text: 'Made for Pakistan' },
  { id: 'dual', text: 'Hall + Guest House' },
  { id: 'secure', text: 'Secure & Reliable' },
  { id: 'support', text: '24/7 Support' },
];

export default function AboutPage() {
  const navigate = useNavigate();

  const marqueeImages = useMemo(
    () => Object.values(GALLERY_PLACEHOLDERS).map((p) => p.stockImage),
    [],
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-page', 'landing');
    window.scrollTo(0, 0);
    return () => document.documentElement.removeAttribute('data-page');
  }, []);

  return (
    <div className="landing-root">
      <LandingNav transparent={false} />

      <div className="landing-hero landing-about-hero-page">
        <div className="landing-hero__marquee-wrap">
          <section className="landing-marquee-hero" aria-label="About Gateway">
            <div className="landing-marquee-hero__mesh" aria-hidden />
            <div className="landing-marquee-hero__grain" aria-hidden />

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="landing-marquee-hero__content"
            >
              <p className="landing-marquee-hero__tagline">
                <Sparkles size={15} aria-hidden />
                Our Story
              </p>
              <h1 className="landing-marquee-hero__title">
                About{' '}
                <span className="landing-marquee-hero__title-accent">
                  {BRAND_FULL_NAME}
                </span>
              </h1>
              <p className="landing-marquee-hero__description">
                We help marriage hall and guest house owners run their venues with confidence —
                from the first booking inquiry to the final payment receipt.
              </p>
              <div className="landing-marquee-hero__actions">
                <button
                  type="button"
                  className="landing-marquee-hero__btn"
                  onClick={() => navigate('/login')}
                >
                  Get Started
                  <ArrowRight size={18} aria-hidden />
                </button>
                <Link to="/" className="landing-marquee-hero__btn landing-marquee-hero__btn--outline">
                  Back to Home
                </Link>
              </div>
            </motion.div>

            <div className="landing-marquee-hero__marquee-wrap" aria-hidden>
              <div className="landing-marquee-hero__marquee-track">
                {[...marqueeImages, ...marqueeImages].map((src, i) => (
                  <div key={`${src}-${i}`} className="landing-marquee-hero__marquee-item">
                    <img src={src} alt="" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="landing-hero-stats">
          <div className="landing-container landing-hero-stats__inner">
            <div className="landing-hero-stats__grid">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="landing-hero-stats__item"
                >
                  <p className="landing-hero-stats__value">{stat.value}</p>
                  <p className="landing-hero-stats__label">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="landing-section landing-section-soft">
        <div className="landing-container">
          <div className="landing-features-hero">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="landing-features-hero__copy"
            >
              <p className="landing-kicker">Who We Are</p>
              <h2 className="landing-heading landing-features-hero__title">
                Venue management, reimagined for Pakistan
              </h2>
              <p className="landing-sub landing-features-hero__sub">
                {BRAND_FULL_NAME} was created for owners who juggle weddings, guest stays, staff,
                and finances every day. Instead of scattered registers and phone calls, you get one
                modern platform for halls and guest houses under the same roof.
              </p>
              <p className="landing-about-story-note">
                Whether you host barat ceremonies, walima receptions, corporate events, or overnight
                guests, Gateway keeps schedules, clients, and collections organized — so you can focus
                on hospitality.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="landing-features-hero__cards"
            >
              <DisplayCards cards={DISPLAY_CARDS} variant="light" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-white">
        <div className="landing-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="landing-section-header"
          >
            <p className="landing-kicker">What We Offer</p>
            <h2 className="landing-heading">One platform, two powerful modules</h2>
            <p className="landing-sub">
              Manage your marriage hall and guest house from a single account with dedicated workflows for each.
            </p>
          </motion.div>

          <div className="landing-about-offerings-grid">
            {OFFERINGS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`landing-card landing-feature-card landing-card--featured ${item.featured ? 'landing-about-offering-card' : ''}`}>
                  <div className="landing-feature-card__icon landing-feature-card__icon--featured">
                    <item.icon size={26} />
                  </div>
                  <h3 className="landing-feature-card__title landing-feature-card__title--featured">{item.title}</h3>
                  <p className="landing-feature-card__desc landing-feature-card__desc--featured">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-why-section">
        <div className="landing-container">
          <div className="landing-why-header">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="landing-kicker">Our Values</p>
              <h2 className="landing-why-title">What guides everything we build</h2>
              <p className="landing-why-desc">
                Gateway is shaped by the realities of Pakistani venue management — busy seasons,
                family events, and teams that need clarity under pressure.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="landing-why-badges">
              {BADGES.map((badge) => (
                <div key={badge.id} className="landing-why-badge">
                  <p className="landing-why-badge__text">{badge.text}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="landing-why-cards landing-about-values-grid">
            {VALUES.map((item, i) => (
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

      <section className="landing-section landing-how-section">
        <div className="landing-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="landing-section-header"
          >
            <p className="landing-kicker">Our Journey</p>
            <h2 className="landing-heading">Built around real venue workflows</h2>
            <p className="landing-sub">From vision to daily operations — designed for halls and guest houses together.</p>
          </motion.div>

          <div className="landing-steps-wrap">
            <div className="landing-timeline-line" aria-hidden="true" />
            <div className="landing-steps-grid">
              {MILESTONES.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="landing-step"
                >
                  <div className="landing-step-card">
                    <span className="landing-step-card__label">{step.step}</span>
                    <div className="landing-step-icon">
                      <step.icon size={26} />
                    </div>
                    <h3 className="landing-step-card__title">{step.title}</h3>
                    <p className="landing-step-card__desc">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTASection />
      <LandingFooter />
    </div>
  );
}
