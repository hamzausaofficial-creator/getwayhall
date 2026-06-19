import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLogo from '../AppLogo';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
];

export default function LandingNav({ transparent = true }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = scrolled || !transparent;

  const scrollTo = (href) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`landing-nav ${solid ? 'landing-nav--solid' : 'landing-nav--transparent'}`}
    >
      <div className="landing-container landing-nav__inner">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`landing-nav__logo ${solid ? 'landing-nav__logo--dark' : 'landing-nav__logo--light'}`}
        >
          <AppLogo
            size="sm"
            tone={solid ? 'dark' : 'light'}
            showName
            nameAccent="Centre"
            className="app-logo--landing-nav"
            nameClassName={solid ? 'landing-nav__logo--dark' : 'landing-nav__logo--light'}
            accentClassName="app-logo__name-accent"
          />
        </button>

        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            className={`landing-nav__menu-btn ${solid ? 'landing-nav__menu-btn--dark' : 'landing-nav__menu-btn--light'}`}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <button
              key={l.href}
              type="button"
              onClick={() => scrollTo(l.href)}
              className={`landing-nav__link ${solid ? 'landing-nav__link--dark' : 'landing-nav__link--light'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="landing-nav__mobile-panel md:hidden"
          >
            <div className="landing-container py-4 flex flex-col gap-3">
              {LINKS.map((l) => (
                <button
                  key={l.href}
                  type="button"
                  onClick={() => scrollTo(l.href)}
                  className="landing-nav__link landing-nav__link--dark text-left py-2"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
