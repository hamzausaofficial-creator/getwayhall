import { useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft, Clock3 } from 'lucide-react';
import './maintenance-page.css';

export default function MaintenancePage({ pageName, homePath = '/' }) {
  const navigate = useNavigate();

  return (
    <div className="maintenance-page">
      <div className="maintenance-page__card" role="status" aria-live="polite">
        <div className="maintenance-page__icon-stack" aria-hidden>
          <span className="maintenance-page__icon-ring maintenance-page__icon-ring--outer" />
          <span className="maintenance-page__icon-ring maintenance-page__icon-ring--inner" />
          <div className="maintenance-page__icon-wrap">
            <Construction size={32} strokeWidth={2} />
          </div>
        </div>

        <span className="maintenance-page__badge">
          <Clock3 size={14} aria-hidden />
          Temporarily unavailable
        </span>

        <h1 className="maintenance-page__title">Under maintenance</h1>

        {pageName ? (
          <p className="maintenance-page__page-name">{pageName}</p>
        ) : null}

        <p className="maintenance-page__text">
          {pageName
            ? 'This section is being updated and will be back online shortly.'
            : 'This section is temporarily unavailable while we make updates.'}
        </p>

        <p className="maintenance-page__hint">
          You can continue using other parts of the app in the meantime.
        </p>

        <button
          type="button"
          className="btn-primary maintenance-page__btn"
          onClick={() => navigate(homePath)}
        >
          <ArrowLeft size={18} aria-hidden />
          Go to available section
        </button>
      </div>
    </div>
  );
}
