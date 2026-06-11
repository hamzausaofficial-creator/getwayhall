import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

export default function FAQSection({ faqs = [] }) {
  const [open, setOpen] = useState(0);
  if (!faqs.length) return null;

  const useTwoCols = faqs.length >= 6;
  const midpoint = useTwoCols ? Math.ceil(faqs.length / 2) : faqs.length;
  const left = faqs.slice(0, midpoint);
  const right = useTwoCols ? faqs.slice(midpoint) : [];

  const renderItem = (faq, globalIndex) => {
    const isOpen = open === globalIndex;
    return (
      <motion.div
        key={faq.id ?? globalIndex}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: globalIndex * 0.04 }}
        className="landing-faq-item"
        data-open={isOpen}
      >
        <button
          type="button"
          onClick={() => setOpen(isOpen ? -1 : globalIndex)}
          className="landing-faq-item__btn"
        >
          <span className="landing-faq-item__question">{faq.question}</span>
          <span className="landing-faq-item__toggle">
            {isOpen ? <Minus size={16} /> : <Plus size={16} />}
          </span>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <p className="landing-faq-item__answer">{faq.answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <section id="faq" className="landing-section landing-section-white">
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="landing-section-header"
        >
          <p className="landing-kicker">FAQ</p>
          <h2 className="landing-heading">Frequently Asked Questions</h2>
          <p className="landing-sub">Everything you need to know before getting started.</p>
        </motion.div>

        {useTwoCols ? (
          <div className="landing-faq-grid landing-faq-grid--two-col">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {left.map((faq, i) => renderItem(faq, i))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {right.map((faq, i) => renderItem(faq, i + midpoint))}
            </div>
          </div>
        ) : (
          <div className="landing-faq-grid">
            {faqs.map((faq, i) => renderItem(faq, i))}
          </div>
        )}
      </div>
    </section>
  );
}
