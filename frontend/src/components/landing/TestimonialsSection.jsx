import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Testimonials } from '../ui/testimonials';
import { resolveMediaUrl } from '../../utils/media';

const STOCK_AVATARS = [
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&q=80',
];

function mapTestimonial(t, index) {
  const photo = t.customer_photo_url ? resolveMediaUrl(t.customer_photo_url) : STOCK_AVATARS[index % STOCK_AVATARS.length];
  return {
    id: t.id ?? index,
    image: photo,
    name: t.customer_name,
    username: t.designation,
    text: t.review,
    rating: t.rating ?? 5,
  };
}

export default function TestimonialsSection({ testimonials = [] }) {
  const items = useMemo(
    () => (testimonials.length ? testimonials.map(mapTestimonial) : []),
    [testimonials],
  );

  if (!items.length) return null;

  return (
    <section className="landing-section landing-section-soft">
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Testimonials
            testimonials={items}
            title="What Venue Owners Say"
            description="Real feedback from marriage hall and guest house teams using Gateway every day."
            maxDisplayed={6}
          />
        </motion.div>
      </div>
    </section>
  );
}
