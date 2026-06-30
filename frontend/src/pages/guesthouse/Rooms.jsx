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
import AppLoader from '../../components/AppLoader';
import { usePermissions } from '../../hooks/usePermissions';
import SearchInput from '../../components/SearchInput';
import { resolveMediaUrl } from '../../utils/media';
import { formatRs } from '../../utils/currency';
import './gh-rooms.css';

const GuestHouseRooms = ({ embedded = false }) => {
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

  const openEdit = (id) => {
    if (!canManage) return;
    navigate(`/gh/rooms/${id}/edit`);
  };

  const statusClass = (status) => (status || 'inactive').toLowerCase();

  const renderEmbeddedCard = (room) => (
    <article key={room.id} className="gh-rooms__card">
      <div className="gh-rooms__card-top">
        <div className="gh-rooms__thumb" aria-hidden>
          {room.image ? (
            <img src={resolveMediaUrl(room.image)} alt="" />
          ) : (
            <BedDouble size={18} />
          )}
        </div>
        <div className="gh-rooms__info">
          <div className="gh-rooms__name-row">
            <p className="gh-rooms__name">Room {room.room_number}</p>
            <span className={`gh-rooms__status gh-rooms__status--${statusClass(room.status)}`}>
              {room.status}
            </span>
          </div>
          <p className="gh-rooms__meta">
            <Users size={12} aria-hidden />
            {room.beds} bed{room.beds !== 1 ? 's' : ''} · {room.room_type}
          </p>
          <div className="gh-rooms__price-row">
            <p className="gh-rooms__price">{formatRs(room.price_per_night)}</p>
            <span className="gh-rooms__unit">per night</span>
          </div>
        </div>
      </div>
      {canManage && (
        <div className="gh-rooms__actions">
          <button
            type="button"
            className="btn-secondary gh-rooms__action-btn"
            onClick={() => openEdit(room.id)}
            aria-label={`Edit room ${room.room_number}`}
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            className="btn-secondary gh-rooms__action-btn gh-rooms__action-btn--danger"
            onClick={() => remove(room.id)}
            aria-label={`Delete room ${room.room_number}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </article>
  );

  const renderFullCard = (room) => (
    <div key={room.id} className="premium-card gh-room-card">
      <div className="gh-room-card__image">
        {room.image ? (
          <img
            src={resolveMediaUrl(room.image)}
            alt={`Room ${room.room_number}`}
            className="gh-room-card__photo"
          />
        ) : (
          <BedDouble size={48} aria-hidden />
        )}
        {canManage && (
          <div className="gh-room-card__actions">
            <button
              type="button"
              onClick={() => openEdit(room.id)}
              className="gh-room-card__action-btn"
              title="Edit room"
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => remove(room.id)}
              className="gh-room-card__action-btn gh-room-card__action-btn--danger"
              title="Delete room"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="gh-room-card__body">
        <div className="gh-room-card__head">
          <h3 className="gh-room-card__title">Room {room.room_number}</h3>
          <span className={`gh-room-card__status gh-room-card__status--${statusClass(room.status)}`}>
            {room.status}
          </span>
        </div>
        <div className="gh-room-card__meta">
          <Users size={13} aria-hidden />
          <span>{room.beds} bed{room.beds !== 1 ? 's' : ''} · {room.room_type}</span>
        </div>
        <div className="gh-room-card__price-row">
          <div className="gh-room-card__price">
            <span className="gh-room-card__currency">Rs</span>
            {parseFloat(room.price_per_night).toLocaleString()}
            <span className="gh-room-card__per-night">/night</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`animate-fade-in gh-rooms${embedded ? ' gh-rooms--embedded' : ''}`}>
      {!embedded ? (
        <div className="page-header">
          <div>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage rooms, nightly rates, and availability.</p>
          </div>
          {canManage && (
            <button type="button" className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Add New Room
            </button>
          )}
        </div>
      ) : (
        <div className="gh-rooms__toolbar">
          <p className="gh-rooms__count">
            {rooms.length} room{rooms.length !== 1 ? 's' : ''}
          </p>
          {canManage && (
            <button type="button" className="btn-primary gh-rooms__add-btn" onClick={openCreate}>
              <Plus size={16} aria-hidden />
              Add room
            </button>
          )}
        </div>
      )}

      <div className="search-toolbar gh-rooms__search">
        <SearchInput
          variant="inset"
          placeholder="Search rooms by number or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <AppLoader inline message="Loading rooms…" />
      ) : (
        <div className={embedded ? 'gh-rooms__grid' : 'gh-rooms__grid'}>
          {filtered.length === 0 ? (
            <div className="gh-rooms__empty">
              {embedded && !searchQuery ? (
                <>
                  <BedDouble size={28} style={{ opacity: 0.35, marginBottom: 10 }} aria-hidden />
                  <p className="gh-rooms__empty-title">No rooms yet</p>
                  <p style={{ margin: '0 0 14px' }}>Add your first room to start taking guest house bookings.</p>
                  {canManage && (
                    <button type="button" className="btn-primary gh-rooms__add-btn" onClick={openCreate}>
                      <Plus size={16} aria-hidden />
                      Add first room
                    </button>
                  )}
                </>
              ) : (
                searchQuery ? 'No rooms match your search.' : 'No rooms yet. Add your first room.'
              )}
            </div>
          ) : filtered.map((room) => (embedded ? renderEmbeddedCard(room) : renderFullCard(room)))}
        </div>
      )}
    </div>
  );
};

export default GuestHouseRooms;
