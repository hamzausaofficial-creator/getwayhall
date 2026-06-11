import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

export default function SuccessStatsSection({ stats = [] }) {
  if (!stats.length) return null;

  return (
    <section className="landing-section relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand to-brand-hover" />
      <div className="absolute inset-0 opacity-30 landing-dots" />
      <div className="landing-container relative text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold">Success By The Numbers</h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.id ?? i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 py-8 px-4"
            >
              <p className="text-4xl sm:text-5xl font-black text-white mb-2">
                <AnimatedCounter
                  value={stat.value_number}
                  suffix={stat.suffix}
                  display={stat.value_display}
                />
              </p>
              <p className="text-white/90 font-semibold text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
