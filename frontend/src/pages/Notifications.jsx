import { useState, useEffect } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';
import { normalizeList } from '../utils/listData';

const statusColor = {
  SENT: '#166534',
  FAILED: '#b91c1c',
  SKIPPED: '#64748b',
  PENDING: '#92400e',
};

const Notifications = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await client.get('/core/notifications/');
      setLogs(normalizeList(res.data));
    } catch {
      toast.error('Failed to load notification log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => filter === 'ALL' || l.status === filter);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={26} /> SMS / WhatsApp Log
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Outbound messages to customers (skipped if no phone).</p>
        </div>
        <button type="button" className="btn-secondary" onClick={fetchLogs} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="card" style={{ marginBottom: '16px', padding: '12px 16px' }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px' }}>
          <option value="ALL">All statuses</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
          <option value="SKIPPED">Skipped</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      <div className="card table-scroll" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px' }}>When</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px' }}>To</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px' }}>Message</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{log.notification_type}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px' }}>{log.recipient}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: statusColor[log.status] || '#64748b' }}>
                    {log.status}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', maxWidth: '320px' }}>
                    {log.message}
                    {log.error_message && (
                      <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '4px' }}>{log.error_message}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Notifications;
