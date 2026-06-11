import { cn } from '../../lib/utils';

function DisplayCard({
  className,
  icon,
  title = 'Featured',
  description = 'Discover amazing content',
  date = 'Just now',
  stackIndex = 0,
}) {
  return (
    <div
      className={cn(
        'landing-display-card',
        stackIndex === 0 && 'landing-display-card--back-a',
        stackIndex === 1 && 'landing-display-card--back-b',
        stackIndex === 2 && 'landing-display-card--front',
        className,
      )}
    >
      <div className="landing-display-card__top">
        <span className="landing-display-card__icon-wrap">{icon}</span>
        <p className="landing-display-card__title">{title}</p>
      </div>
      <p className="landing-display-card__description">{description}</p>
      <p className="landing-display-card__date">{date}</p>
    </div>
  );
}

export default function DisplayCards({ cards = [], variant = 'dark' }) {
  if (!cards.length) return null;

  return (
    <div className={cn('landing-display-cards', variant === 'light' && 'landing-display-cards--light')}>
      {cards.map((card, index) => (
        <DisplayCard key={card.title ?? index} {...card} stackIndex={index} />
      ))}
    </div>
  );
}

export { DisplayCard };
