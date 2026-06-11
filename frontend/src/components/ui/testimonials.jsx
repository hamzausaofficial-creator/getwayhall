import { useState } from 'react';
import { Quote, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from './card';

const STOCK_AVATARS = [
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&q=80',
];

function RatingStars({ rating = 5 }) {
  return (
    <div className="landing-testimonials-ui__stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? 'landing-testimonials-ui__star--filled' : 'landing-testimonials-ui__star'}
        />
      ))}
    </div>
  );
}

export function Testimonials({
  testimonials = [],
  className,
  title = 'What Venue Owners Say',
  description = 'Real stories from marriage halls and guest houses across Pakistan.',
  maxDisplayed = 6,
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = testimonials.slice(0, showAll ? undefined : maxDisplayed);
  const canLoadMore = testimonials.length > maxDisplayed && !showAll;

  return (
    <div className={cn('landing-testimonials-ui', className)}>
      <div className="landing-testimonials-ui__header">
        <p className="landing-testimonials-ui__kicker">Testimonials</p>
        <h2 className="landing-testimonials-ui__title">{title}</h2>
        <p className="landing-testimonials-ui__description">
          {description.split('<br />').map((line, i, arr) => (
            <span key={i}>
              {line}
              {i !== arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      </div>

      <div className="landing-testimonials-ui__wrap">
        <div
          className={cn(
            'landing-testimonials-ui__grid',
            canLoadMore && 'landing-testimonials-ui__grid--clamped',
          )}
        >
          {visible.map((testimonial, index) => (
            <Card key={testimonial.id ?? `${testimonial.name}-${index}`} className="landing-testimonials-ui__card">
              <div className="landing-testimonials-ui__quote" aria-hidden>
                <Quote size={18} />
              </div>

              <div className="landing-testimonials-ui__author">
                <img
                  src={testimonial.image || STOCK_AVATARS[index % STOCK_AVATARS.length]}
                  alt={testimonial.name}
                  className="landing-testimonials-ui__avatar"
                  loading="lazy"
                />
                <div className="landing-testimonials-ui__author-meta">
                  <span className="landing-testimonials-ui__name">{testimonial.name}</span>
                  {testimonial.username && (
                    <span className="landing-testimonials-ui__username">{testimonial.username}</span>
                  )}
                </div>
              </div>

              {typeof testimonial.rating === 'number' && (
                <RatingStars rating={testimonial.rating} />
              )}

              <p className="landing-testimonials-ui__text">&ldquo;{testimonial.text}&rdquo;</p>
            </Card>
          ))}
        </div>

        {canLoadMore && (
          <>
            <div className="landing-testimonials-ui__fade" aria-hidden />
            <div className="landing-testimonials-ui__load-more">
              <button type="button" className="landing-testimonials-ui__load-btn" onClick={() => setShowAll(true)}>
                Load More
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
