import { useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';
import './maintenance-page.css';

export default function MaintenancePage({ pageName, homePath = '/' }) {
  const navigate = useNavigate();

  return (
    <div className="maintenance-page">
      <div className="maintenance-page__card premium-card">
        <div className="maintenance-page__icon-wrap" aria-hidden>
          <Construction size={36} />
        </div>
        <h1 className="maintenance-page__title">Under maintenance</h1>
        <p className="maintenance-page__text">
          {pageName ? (
            <>
              <strong>{pageName}</strong> is temporarily unavailable while we make updates.
            </>
          ) : (
            <>This section is temporarily unavailable while we make updates.</>
          )}
        </p>
        <p className="maintenance-page__hint">
          Please check back later or continue with another section of the app.
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
