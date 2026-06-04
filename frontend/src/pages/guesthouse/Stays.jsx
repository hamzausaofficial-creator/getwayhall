import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Eye, Pencil, Printer } from 'lucide-react';
import SearchInput from '../../components/SearchInput';
import { listStays } from '../../api/guesthouse';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatRs } from '../../utils/currency';

const GuestHouseStays = () => {
  const navigate = useNavigate();
  const { canManage } = usePermissions();
  const [stays, setStays] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setStays(await listStays());
    } catch {
      toast.error('Failed to load stays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = stays.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.booking_ref || '').toLowerCase().includes(q)
      || (s.customer_name || '').toLowerCase().includes(q)
      || (s.room_number || '').toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    if (!canManage) {
      toast.error('You do not have permission to create stays.');
      return;
    }
    navigate('/gh/stays/new');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Stay Bookings</h2>
          <p style={{ color: 'var(--text-muted)' }}>Check-in, check-out, and guest reservations.</p>
        </div>
        {canManage && (
          <button type="button" className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> New Stay
          </button>
        )}
      </div>

      <div className="search-toolbar">
        <SearchInput
          variant="inset"
          placeholder="Search by ref, guest, or room..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading stays...</div>
      ) : (
        <div className="premium-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-elevated)', borderBottom: '1px solid var(--border)' }}>
                  {['Reference', 'Guest', 'Room', 'Check-in', 'Check-out', 'Total', 'Status', 'Payment', ''].map((h) => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', color: 'var(--text-muted)', fontSize: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {searchQuery ? 'No stays match your search.' : 'No stays yet. Create one with New Stay.'}
                    </td>
                  </tr>
                ) : filtered.map((s) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => navigate(`/gh/stays/${s.id}`)}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '700' }}>{s.booking_ref}</td>
                    <td style={{ padding: '14px 16px' }}>{s.customer_name}</td>
                    <td style={{ padding: '14px 16px' }}>{s.room_number}</td>
                    <td style={{ padding: '14px 16px' }}>{s.check_in}</td>
                    <td style={{ padding: '14px 16px' }}>{s.check_out}</td>
                    <td style={{ padding: '14px 16px' }}>{formatRs(s.total_amount)}</td>
                    <td style={{ padding: '14px 16px' }}><StatusBadge status={s.status} /></td>
                    <td style={{ padding: '14px 16px' }}><StatusBadge status={s.payment_status} /></td>
                    <td style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button type="button" className="btn-ghost" onClick={() => navigate(`/gh/stays/${s.id}`)} title="View">
                          <Eye size={16} />
                        </button>
                        <button type="button" className="btn-ghost" onClick={() => navigate(`/gh/print/stay/${s.id}`)} title="Print invoice">
                          <Printer size={16} />
                        </button>
                        {canManage && (
                          <button type="button" className="btn-ghost" onClick={() => navigate(`/gh/stays/${s.id}/edit`)} title="Edit">
                            <Pencil size={16} />
                          </button>
                        )}
                        <ChevronRight size={16} color="var(--text-muted)" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestHouseStays;
