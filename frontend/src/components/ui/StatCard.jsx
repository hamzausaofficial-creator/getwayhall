import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string|number} props.value
 * @param {React.ComponentType} props.icon
 * @param {number|null} [props.trend] - percentage change; null hides trend
 * @param {boolean} [props.isCurrency]
 * @param {boolean} [props.showZeroAs00]
 * @param {string} [props.hint]
 * @param {'primary'|'success'|'warning'|'danger'|'info'} [props.variant]
 * @param {string} [props.to] - route path; card becomes clickable
 * @param {object} [props.state] - optional react-router location state
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  trend = null,
  isCurrency = false,
  showZeroAs00 = false,
  hint,
  variant = 'primary',
  to,
  state,
}) {
  const navigate = useNavigate();
  const clickable = Boolean(to);
  const num = parseFloat(value || 0);
  const displayZero = showZeroAs00 && num <= 0;

  const variantStyles = {
    primary: {
      iconBg: 'var(--primary-light)',
      iconColor: 'var(--primary)',
    },
    success: {
      iconBg: 'var(--primary-light)',
      iconColor: 'var(--primary)',
    },
    warning: {
      iconBg: 'var(--color-warning-muted)',
      iconColor: 'var(--warning)',
    },
    danger: {
      iconBg: 'var(--color-danger-muted)',
      iconColor: 'var(--error)',
    },
    info: {
      iconBg: 'var(--color-info-muted)',
      iconColor: 'var(--secondary)',
    },
  };

  const vs = variantStyles[variant] || variantStyles.primary;

  const trendClass =
    trend == null
      ? ''
      : trend > 0
        ? 'dash-stat-card__trend--up'
        : trend < 0
          ? 'dash-stat-card__trend--down'
          : 'dash-stat-card__trend--neutral';

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  const handleClick = () => {
    if (to) navigate(to, state ? { state } : undefined);
  };

  const handleKeyDown = (e) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };

  const className = ['dash-stat-card', clickable ? 'dash-stat-card--clickable' : '']
    .filter(Boolean)
    .join(' ');

  const sharedProps = {
    className,
    style: {
      '--stat-icon-bg': vs.iconBg,
      '--stat-icon-color': vs.iconColor,
    },
  };

  const inner = (
    <>
      <div className="dash-stat-card__top">
        <div className="dash-stat-card__icon">
          {Icon && <Icon size={22} strokeWidth={2} />}
        </div>
        {trend != null && (
          <span className={`dash-stat-card__trend ${trendClass}`}>
            <TrendIcon size={12} />
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="dash-stat-card__label">{label}</p>
      <p className="dash-stat-card__value">
        {isCurrency ? (
          displayZero ? (
            '00'
          ) : (
            <>
              <span className="dash-stat-card__value-prefix">Rs</span>
              {num.toLocaleString()}
            </>
          )
        ) : (
          value ?? 0
        )}
      </p>
      {hint && <p className="dash-stat-card__hint">{hint}</p>}
      {clickable && <span className="dash-stat-card__link-hint">View details →</span>}
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        {...sharedProps}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`${label}: open details`}
      >
        {inner}
      </button>
    );
  }

  return <article {...sharedProps}>{inner}</article>;
}
