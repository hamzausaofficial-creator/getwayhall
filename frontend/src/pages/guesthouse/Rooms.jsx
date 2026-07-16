import { useEffect, useState, useMemo } from 'react';
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
      toast.error('Failed to load units');
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
      || (r.unit_kind || '').toLowerCase().includes(q)
      || (r.parent_number || '').toLowerCase().includes(q)
      || (r.description || '').toLowerCase().includes(q)
    );
  });

  /** Parent-child groups: suites with children, then independent rooms. */
  const hierarchy = useMemo(() => {
    const suites = filtered
      .filter((u) => u.unit_kind === 'SUITE' || u.is_suite)
      .sort((a, b) => String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true }));
    const suiteIds = new Set(suites.map((s) => s.id));
    const childrenByParent = {};
    filtered.forEach((u) => {
      if (u.unit_kind === 'SUITE' || u.is_suite) return;
      if (u.parent && suiteIds.has(u.parent)) {
        if (!childrenByParent[u.parent]) childrenByParent[u.parent] = [];
        childrenByParent[u.parent].push(u);
      }
    });
    Object.values(childrenByParent).forEach((list) => {
      list.sort((a, b) => String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true }));
    });
    const independent = filtered
      .filter((u) => u.unit_kind !== 'SUITE' && !u.is_suite && !u.parent)
      .sort((a, b) => String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true }));
    const orphanChildren = filtered.filter((u) => {
      if (u.unit_kind === 'SUITE' || u.is_suite || !u.parent) return false;
      return !suiteIds.has(u.parent);
    });
    return { suites, childrenByParent, independent, orphanChildren };
  }, [filtered]);

  const openCreate = () => {
    if (!canManage) {
      toast.error('You do not have permission to modify units.');
      return;
    }
    navigate('/gh/rooms/new');
  };

  const remove = async (id) => {
    if (!canManage) return;
    if (!window.confirm('Delete this unit?')) return;
    try {
      await deleteRoom(id);
      toast.success('Unit deleted');
      await load();
    } catch {
      toast.error('Failed to delete unit');
    }
  };

  const openEdit = (id) => {
    if (!canManage) return;
    navigate(`/gh/rooms/${id}/edit`);
  };

  const statusClass = (status) => (status || 'inactive').toLowerCase();

  const unitLabel = (room) => {
    if (room.unit_kind === 'SUITE' || room.is_suite) return `Suite ${room.room_number}`;
    return `Room ${room.room_number}`;
  };

  const bedLabel = (room) => {
    const beds = Array.isArray(room.bed_configs) && room.bed_configs.length
      ? room.bed_configs.map((b) => `${b.bed_type_display || b.bed_type}×${b.quantity}`).join(', ')
      : `${room.beds} bed${room.beds !== 1 ? 's' : ''}`;
    return beds;
  };

  const relationLabel = (room) => {
    if (room.unit_kind === 'SUITE' || room.is_suite) return 'Suite';
    if (room.parent) return 'In suite';
    return 'Independent';
  };

  const renderEmbeddedCard = (room, { nested = false } = {}) => (
    <article key={room.id} className={`gh-rooms__card${nested ? ' gh-rooms__card--child' : ''}`}>
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
            <p className="gh-rooms__name">{unitLabel(room)}</p>
            <span className={`gh-rooms__status gh-rooms__status--${statusClass(room.status)}`}>
              {room.status}
            </span>
          </div>
          <p className="gh-rooms__meta">
            <Users size={12} aria-hidden />
            {bedLabel(room)} · {relationLabel(room)}
            {room.children_count ? ` · ${room.children_count} rooms` : ''}
          </p>
          {Array.isArray(room.amenities) && room.amenities.length > 0 && (
            <p className="gh-rooms__meta" style={{ marginTop: 4 }}>
              {room.amenities.slice(0, 4).map((a) => a.name).join(' · ')}
              {room.amenities.length > 4 ? '…' : ''}
            </p>
          )}
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
            aria-label={`Edit ${unitLabel(room)}`}
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            className="btn-secondary gh-rooms__action-btn gh-rooms__action-btn--danger"
            onClick={() => remove(room.id)}
            aria-label={`Delete ${unitLabel(room)}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </article>
  );

  const renderFullCard = (room, { nested = false } = {}) => (
    <div key={room.id} className={`premium-card gh-room-card${nested ? ' gh-room-card--child' : ''}`}>
      <div className="gh-room-card__image">
        {room.image ? (
          <img
            src={resolveMediaUrl(room.image)}
            alt={unitLabel(room)}
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
              title="Edit unit"
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => remove(room.id)}
              className="gh-room-card__action-btn gh-room-card__action-btn--danger"
              title="Delete unit"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="gh-room-card__body">
        <div className="gh-room-card__head">
          <h3 className="gh-room-card__title">{unitLabel(room)}</h3>
          <span className={`gh-room-card__status gh-room-card__status--${statusClass(room.status)}`}>
            {room.status}
          </span>
        </div>
        <div className="gh-room-card__meta">
          <Users size={13} aria-hidden />
          <span>{bedLabel(room)} · {relationLabel(room)}</span>
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

  const renderCard = (room, opts) => (embedded ? renderEmbeddedCard(room, opts) : renderFullCard(room, opts));

  const hasAny = filtered.length > 0;

  return (
    <div className={`animate-fade-in gh-rooms${embedded ? ' gh-rooms--embedded' : ''}`}>
      {!embedded ? (
        <div className="page-header">
          <div>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              Suites, suite rooms, and independent rooms — same inventory tree.
            </p>
          </div>
          {canManage && (
            <button type="button" className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Add unit
            </button>
          )}
        </div>
      ) : (
        <div className="gh-rooms__toolbar">
          <p className="gh-rooms__count">
            {rooms.length} unit{rooms.length !== 1 ? 's' : ''}
          </p>
          {canManage && (
            <button type="button" className="btn-primary gh-rooms__add-btn" onClick={openCreate}>
              <Plus size={16} aria-hidden />
              Add unit
            </button>
          )}
        </div>
      )}

      <div className="search-toolbar gh-rooms__search">
        <SearchInput
          variant="inset"
          placeholder="Search suites or rooms…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <AppLoader inline message="Loading units…" />
      ) : !hasAny ? (
        <div className="gh-rooms__empty">
          {embedded && !searchQuery ? (
            <>
              <BedDouble size={28} style={{ opacity: 0.35, marginBottom: 10 }} aria-hidden />
              <p className="gh-rooms__empty-title">No units yet</p>
              <p style={{ margin: '0 0 14px' }}>Add a suite or an independent room to start bookings.</p>
              {canManage && (
                <button type="button" className="btn-primary gh-rooms__add-btn" onClick={openCreate}>
                  <Plus size={16} aria-hidden />
                  Add first unit
                </button>
              )}
            </>
          ) : (
            searchQuery ? 'No units match your search.' : 'No units yet. Add your first suite or room.'
          )}
        </div>
      ) : (
        <div className="gh-rooms__hierarchy">
          {hierarchy.suites.map((suite) => (
            <section key={suite.id} className="gh-rooms__group">
              <h4 className="gh-rooms__group-title">Suite {suite.room_number}</h4>
              <div className="gh-rooms__grid">
                {renderCard(suite)}
                {(hierarchy.childrenByParent[suite.id] || []).map((child) => renderCard(child, { nested: true }))}
              </div>
            </section>
          ))}

          {(hierarchy.independent.length > 0 || hierarchy.orphanChildren.length > 0) && (
            <section className="gh-rooms__group">
              <h4 className="gh-rooms__group-title">Independent rooms</h4>
              <div className="gh-rooms__grid">
                {hierarchy.independent.map((room) => renderCard(room))}
                {hierarchy.orphanChildren.map((room) => renderCard(room))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default GuestHouseRooms;
