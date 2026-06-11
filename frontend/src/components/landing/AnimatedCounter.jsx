import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

export default function AnimatedCounter({
  value = 0,
  suffix = '',
  display,
  duration = 1.8,
  className = '',
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    if (display) {
      setCount(value);
      return undefined;
    }
    let start = 0;
    const target = Number(value) || 0;
    const step = Math.max(1, Math.floor(target / (duration * 60)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, value, duration, display]);

  const formatted = display || `${count.toLocaleString()}${suffix}`;

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      {formatted}
    </motion.span>
  );
}
