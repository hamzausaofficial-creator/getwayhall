import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';

const POLL_INTERVAL = 30000; // 30 seconds

const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const [bookRes, payRes] = await Promise.all([
        client.get('/bookings/?ordering=-created_at'),
        client.get('/finance/payments/?ordering=-payment_date'),
      ]);

      const bookings = (bookRes.data.results || bookRes.data || []).slice(0, 5);
      const payments = (payRes.data.results || payRes.data || []).slice(0, 5);

      const bookingNotifs = bookings.map((b) => ({
        id: `booking-${b.id}`,
        type: 'booking',
        title: 'New Booking',
        desc: `${b.event_name} — ${b.customer_name || 'Customer'}`,
        time: b.created_at,
        timeAgo: timeAgo(b.created_at),
        icon: '📅',
      }));

      const paymentNotifs = payments.map((p) => ({
        id: `payment-${p.id}`,
        type: 'payment',
        title: 'Payment Received',
        desc: `Rs ${parseFloat(p.amount).toLocaleString()} via ${p.payment_method}`,
        time: p.payment_date,
        timeAgo: timeAgo(p.payment_date),
        icon: '💳',
      }));

      // Merge and sort by time (newest first)
      const all = [...bookingNotifs, ...paymentNotifs].sort(
        (a, b) => new Date(b.time) - new Date(a.time)
      );

      // Count how many are new since last fetch
      if (lastFetchedAt) {
        const newCount = all.filter(
          (n) => new Date(n.time) > lastFetchedAt
        ).length;
        setUnreadCount((prev) => prev + newCount);
      } else {
        setUnreadCount(all.length > 0 ? Math.min(all.length, 5) : 0);
      }

      setNotifications(all.slice(0, 10));
      setLastFetchedAt(new Date());
    } catch (err) {
      // Silent fail — don't toast for background polling errors
    }
  }, [lastFetchedAt]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  const markAllRead = () => setUnreadCount(0);

  return { notifications, unreadCount, markAllRead, refresh: fetchNotifications };
};
