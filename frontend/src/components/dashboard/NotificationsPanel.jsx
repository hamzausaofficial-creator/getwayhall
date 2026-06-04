import { Calendar, Wallet, Package, Bell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCollectDue } from '../../utils/currency';
import EmptyState from '../ui/EmptyState';

export default function NotificationsPanel({ alerts }) {
  const navigate = useNavigate();
  const items = [
    ...(alerts.upcoming_events || []).map((e) => ({
      id: `ev-${e.id}`,
      type: 'event',
      title: e.title,
      desc: `${e.desc} · ${e.date || 'TBD'}`,
      onClick: () => navigate('/bookings', { state: { editBookingId: e.id } }),
    })),
    ...(alerts.payment_due || []).map((p) => ({
      id: `pay-${p.id}`,
      type: 'payment',
      title: p.title,
      desc: p.amount != null ? `Due: ${formatCollectDue(p.amount)}` : p.desc,
      onClick: () =>
        navigate('/payments', {
          state: {
            preselectedBookingId: p.id,
            autoOpenRecord: true,
            bookingEventName: p.title,
          },
        }),
    })),
    ...(alerts.inventory_alerts || []).map((inv) => ({
      id: `inv-${inv.id}`,
      type: 'inventory',
      title: inv.title,
      desc: inv.desc,
      onClick: () => navigate('/inventory'),
    })),
  ].slice(0, 8);

  const iconMap = {
    event: { class: 'dash-notif-item__icon--event', Icon: Calendar },
    payment: { class: 'dash-notif-item__icon--payment', Icon: Wallet },
    inventory: { class: 'dash-notif-item__icon--inventory', Icon: Package },
  };

  return (
    <section className="dash-panel dash-bottom-grid__notifications">
      <header className="dash-panel__head">
        <h3 className="dash-panel__title">Notifications</h3>
        <button
          type="button"
          className="dash-btn dash-btn--ghost dash-btn--sm"
          onClick={() => navigate('/notifications')}
        >
          View all <ChevronRight size={14} />
        </button>
      </header>
      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="No upcoming events, payment reminders, or stock alerts right now."
        />
      ) : (
        <div className="dash-notif-list custom-scrollbar">
          {items.map((item) => {
            const { class: iconClass, Icon } = iconMap[item.type] || iconMap.event;
            return (
              <button
                key={item.id}
                type="button"
                className="dash-notif-item"
                onClick={item.onClick}
              >
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
