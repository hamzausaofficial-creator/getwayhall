import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Construction, ArrowLeft, Clock3, Timer } from 'lucide-react';
import {
  formatMaintenanceEnd,
  formatMaintenanceRemaining,
  isMaintenanceExpired,
} from '../utils/maintenanceTime';
import './maintenance-page.css';

export default function MaintenancePage({
  pageName,
  homePath = '/',
  maintenanceUntil = null,
  onMaintenanceEnded,
}) {
  const navigate = useNavigate();
  const endedRef = useRef(false);
  const [remaining, setRemaining] = useState(() => formatMaintenanceRemaining(maintenanceUntil));
  const endLabel = formatMaintenanceEnd(maintenanceUntil);

  useEffect(() => {
    endedRef.current = false;
  }, [maintenanceUntil]);

  useEffect(() => {
    if (!maintenanceUntil) {
      setRemaining(null);
      return undefined;
    }

    const tick = () => {
      if (isMaintenanceExpired(maintenanceUntil)) {
        setRemaining(null);
        if (!endedRef.current) {
          endedRef.current = true;
          onMaintenanceEnded?.();
        }
        return;
      }
      setRemaining(formatMaintenanceRemaining(maintenanceUntil));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [maintenanceUntil, onMaintenanceEnded]);

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

        {endLabel ? (
          <div className="maintenance-page__schedule">
            <p className="maintenance-page__schedule-label">
              <Timer size={15} aria-hidden />
              Expected back online
            </p>
            <p className="maintenance-page__schedule-time">{endLabel}</p>
            {remaining ? (
              <p className="maintenance-page__countdown">
                Opens in <strong>{remaining}</strong>
              </p>
            ) : null}
          </div>
        ) : null}

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
