import EmptyState from './EmptyState';

export default function ChartCard({
  title,
  subtitle,
  action,
  children,
  empty,
  className = '',
}) {
  return (
    <section className={`dash-chart-card ${className}`.trim()}>
      <header className="dash-chart-card__head">
        <div>
          <h3 className="dash-chart-card__title">{title}</h3>
          {subtitle && <p className="dash-chart-card__subtitle">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="dash-chart-card__body">
        {empty ? (
          <EmptyState
            icon={empty.icon}
            title={empty.title}
            description={empty.description}
          />
        ) : (
          children
        )}
      </div>
    </section>
  );
}
