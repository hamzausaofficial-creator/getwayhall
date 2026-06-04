import { Calendar, Wallet, Bell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../ui/EmptyState';

export default function GhNotificationsPanel({ alerts }) {
  const navigate = useNavigate();
  const items = [
    ...(alerts?.upcoming_checkins || []).map((e) => ({
      id: `in-${e.id}`,
      type: 'event',
      title: e.title,
      desc: e.desc,
      onClick: () => navigate(`/gh/stays/${e.id}`),
    })),
    ...(alerts?.payment_due || []).map((p) => ({
      id: `due-${p.id}`,
      type: 'payment',
      title: p.title,
      desc: p.desc,
      onClick: () =>
        navigate(`/gh/payments/new?stay=${p.id}`),
    })),
  ].slice(0, 8);

  const iconMap = {
    event: { class: 'dash-notif-item__icon--event', Icon: Calendar },
    payment: { class: 'dash-notif-item__icon--payment', Icon: Wallet },
  };

  return (
    <section className="dash-panel dash-bottom-grid__notifications">
      <header className="dash-panel__head">
        <h3 className="dash-panel__title">Alerts</h3>
        <button type="button" className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => navigate('/gh/notifications')}>
          View all <ChevronRight size={14} />
        </button>
      </header>
      {items.length === 0 ? (
        <EmptyState icon={Bell} title="All caught up" description="No upcoming check-ins or balance due right now." />
      ) : (
        <div className="dash-notif-list custom-scrollbar">
          {items.map((item) => {
            const { class: iconClass, Icon } = iconMap[item.type] || iconMap.event;
            return (
              <button key={item.id} type="button" className="dash-notif-item" onClick={item.onClick}>
                <span className={`dash-notif-item__icon ${iconClass}`}>
                  <Icon size={18} />
                </span>
                <span>
                  <p className="dash-notif-item__title">{item.title}</p>
                  <p className="dash-notif-item__desc">{item.desc}</p>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
