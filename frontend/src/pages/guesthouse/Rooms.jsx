import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  BedDouble,
  Edit2,
  Trash2,
  Users,
} from 'lucide-react';
import { listRooms, deleteRoom } from '../../api/guesthouse';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import SearchInput from '../../components/SearchInput';

const GuestHouseRooms = () => {
  const navigate = useNavigate();
  const { canManage } = usePermissions();
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listRooms();
      setRooms(Array.isArray(data) ? data : data.results || []);
    } catch {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = rooms.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.room_number || '').toLowerCase().includes(q)
      || (r.room_type || '').toLowerCase().includes(q)
      || (r.description || '').toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    if (!canManage) {
      toast.error('You do not have permission to modify rooms.');
      return;
    }
    navigate('/gh/rooms/new');
  };

  const remove = async (id) => {
    if (!canManage) return;
    if (!window.confirm('Delete this room?')) return;
    try {
      await deleteRoom(id);
      toast.success('Room deleted');
      await load();
    } catch {
      toast.error('Failed to delete room');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Room Management</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage rooms, nightly rates, and availability.</p>
        </div>
        {canManage && (
          <button type="button" className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add New Room
          </button>
        )}
      </div>

      <div className="search-toolbar">
        <SearchInput
          variant="inset"
          placeholder="Search rooms by number or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading rooms...</div>
      ) : (
        <div className="halls-grid">
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {searchQuery ? 'No rooms match your search.' : 'No rooms yet. Add your first room.'}
            </div>
          ) : filtered.map((room) => (
            <div key={room.id} className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  height: '140px',
                  backgroundColor: 'var(--surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  position: 'relative',
                }}
              >
                <BedDouble size={48} />
                {canManage && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/gh/rooms/${room.id}/edit`)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        color: 'var(--secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      }}
                      title="Edit room"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(room.id)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      }}
                      title="Delete room"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Room {room.room_number}</h3>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '700',
                      backgroundColor: room.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                      color: room.status === 'ACTIVE' ? '#166534' : '#64748b',
                    }}
                  >
                    {room.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Users size={14} /> {room.beds} bed{room.beds !== 1 ? 's' : ''} · {room.room_type}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '20px' }}>
                    <span style={{ fontSize: '55%', fontWeight: '600', opacity: 0.6 }}>Rs</span>
                    {' '}
                    {parseFloat(room.price_per_night).toLocaleString()}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}> /night</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuestHouseRooms;
