import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Sparkles, BedDouble, FileText, CheckCircle, X, HelpCircle, Users, ImagePlus,
} from 'lucide-react';
import {
  createRoom, updateRoom, getRoom, listRooms, listAmenities,
  uploadRoomMedia, updateRoomMedia, deleteRoomMedia, reorderRoomMedia,
} from '../../api/guesthouse';
import toast from 'react-hot-toast';
import AppLoader from '../../components/AppLoader';
import RoomFormAddonsSection from '../../components/guesthouse/RoomFormAddonsSection';
import { usePermissions } from '../../hooks/usePermissions';
import { formatRs } from '../../utils/currency';
import { resolveMediaUrl } from '../../utils/media';

const ROOM_TYPES = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'DOUBLE', label: 'Double' },
  { value: 'SUITE', label: 'Suite' },
  { value: 'FAMILY', label: 'Family' },
];

const UNIT_KINDS = [
  { value: 'ROOM', label: 'Room' },
  { value: 'SUITE', label: 'Suite' },
];

const BED_TYPES = [
  { value: 'KING', label: 'King' },
  { value: 'QUEEN', label: 'Queen' },
  { value: 'TWIN', label: 'Twin' },
  { value: 'SINGLE', label: 'Single' },
  { value: 'SOFA', label: 'Sofa bed' },
  { value: 'BUNK', label: 'Bunk' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active - available for stays' },
  { value: 'MAINTENANCE', label: 'Maintenance - temporarily unavailable' },
  { value: 'INACTIVE', label: 'Inactive - hidden from new bookings' },
];

const emptyForm = {
  unit_kind: 'ROOM',
  parent: '',
  room_number: '',
  room_type: 'DOUBLE',
  beds: 1,
  included_guests: 0,
  max_guests: 0,
  extra_bed_allowed: false,
  extra_bed_limit: 0,
  extra_guest_fee_per_night: '',
  price_per_night: '',
  status: 'ACTIVE',
  description: '',
};

const sectionTitle = (label) => (
  <h3
    style={{
      fontSize: '13px',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
      color: 'var(--primary)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      margin: 0,
    }}
  >
    <span style={{ width: '4px', height: '16px', backgroundColor: 'var(--primary)', borderRadius: '2px' }} />
    {label}
  </h3>
);

export default function RoomFormPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { canManage } = usePermissions();
  const isEdit = Boolean(roomId);

  const [form, setForm] = useState(emptyForm);
  const [bedConfigs, setBedConfigs] = useState([{ bed_type: 'QUEEN', quantity: 1 }]);
  const [suites, setSuites] = useState([]);
  const [amenitiesCatalog, setAmenitiesCatalog] = useState([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState([]);
  /** Saved media from API */
  const [mediaItems, setMediaItems] = useState([]);
  /** Local files waiting to upload after save: { key, file, preview, caption } */
  const [pendingFiles, setPendingFiles] = useState([]);
  const [coverMediaId, setCoverMediaId] = useState(null);
  const [coverPendingKey, setCoverPendingKey] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);

  useEffect(() => {
    if (!canManage) {
      toast.error('You do not have permission to manage rooms.');
      navigate('/gh/settings?tab=rooms');
    }
  }, [canManage, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [all, amenityList] = await Promise.all([
          listRooms(),
          listAmenities(),
        ]);
        const list = Array.isArray(all) ? all : all.results || [];
        setSuites(list.filter((u) => u.unit_kind === 'SUITE' || u.is_suite));
        setAmenitiesCatalog(Array.isArray(amenityList) ? amenityList : []);
        if (isEdit && roomId) {
          const room = await getRoom(roomId);
          setForm({
            unit_kind: room.unit_kind || (room.is_suite ? 'SUITE' : 'ROOM'),
            parent: room.parent || '',
            room_number: room.room_number || '',
            room_type: room.room_type || 'DOUBLE',
            beds: room.beds ?? 1,
            included_guests: room.included_guests ?? 0,
            max_guests: room.max_guests ?? 0,
            extra_bed_allowed: Boolean(room.extra_bed_allowed),
            extra_bed_limit: room.extra_bed_limit ?? 0,
            extra_guest_fee_per_night: room.extra_guest_fee_per_night ?? '',
            price_per_night: room.price_per_night ?? '',
            status: room.status || 'ACTIVE',
            description: room.description || '',
          });
          const beds = Array.isArray(room.bed_configs) && room.bed_configs.length
            ? room.bed_configs.map((b) => ({ bed_type: b.bed_type, quantity: b.quantity }))
            : [{ bed_type: 'QUEEN', quantity: room.beds || 1 }];
          setBedConfigs(beds);
          setSelectedAddonIds((room.addon_service_ids || []).map((id) => Number(id)));
          setSelectedAmenityIds((room.amenity_ids || []).map((id) => Number(id)));
          const media = Array.isArray(room.media) ? [...room.media].sort((a, b) => a.sort_order - b.sort_order) : [];
          setMediaItems(media);
          const cover = media.find((m) => m.is_cover) || media[0];
          setCoverMediaId(cover?.id || null);
        }
      } catch {
        toast.error('Room not found');
        navigate('/gh/settings?tab=rooms');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEdit, roomId, navigate]);

  useEffect(() => () => {
    pendingFiles.forEach((p) => {
      if (p.preview) URL.revokeObjectURL(p.preview);
    });
  }, [pendingFiles]);

  const coverPreview = (() => {
    if (coverPendingKey) {
      const pending = pendingFiles.find((p) => p.key === coverPendingKey);
      if (pending?.preview) return pending.preview;
    }
    if (coverMediaId) {
      const m = mediaItems.find((x) => x.id === coverMediaId);
      if (m) return resolveMediaUrl(m.url || m.file);
    }
    if (mediaItems[0]) return resolveMediaUrl(mediaItems[0].url || mediaItems[0].file);
    if (pendingFiles[0]?.preview) return pendingFiles[0].preview;
    return '';
  })();

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please choose image files only');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} must be under 5MB`);
        continue;
      }
      next.push({
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        preview: URL.createObjectURL(file),
        caption: '',
      });
    }
    if (next.length) {
      setPendingFiles((prev) => [...prev, ...next]);
      if (!coverMediaId && !coverPendingKey && !mediaItems.length && !pendingFiles.length) {
        setCoverPendingKey(next[0].key);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePending = (key) => {
    setPendingFiles((prev) => {
      const row = prev.find((p) => p.key === key);
      if (row?.preview) URL.revokeObjectURL(row.preview);
      return prev.filter((p) => p.key !== key);
    });
    if (coverPendingKey === key) setCoverPendingKey(null);
  };

  const removeSavedMedia = async (mediaId) => {
    if (!isEdit || !roomId) {
      setMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
      if (coverMediaId === mediaId) setCoverMediaId(null);
      return;
    }
    try {
      await deleteRoomMedia(roomId, mediaId);
      setMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
      if (coverMediaId === mediaId) setCoverMediaId(null);
      toast.success('Photo removed');
    } catch {
      toast.error('Could not remove photo');
    }
  };

  const moveMedia = (index, direction) => {
    setMediaItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const toggleAmenity = (id) => {
    setSelectedAmenityIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  const typeLabel = ROOM_TYPES.find((t) => t.value === form.room_type)?.label || form.room_type;
  const kindLabel = UNIT_KINDS.find((t) => t.value === form.unit_kind)?.label || form.unit_kind;
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === form.status)?.label || form.status;
  const nightly = parseFloat(form.price_per_night) || 0;
  const bedTotal = bedConfigs.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const isSuite = form.unit_kind === 'SUITE';
    const payload = {
      unit_kind: form.unit_kind,
      parent: isSuite ? null : (form.parent || null),
      room_number: form.room_number.trim(),
      room_type: isSuite ? 'SUITE' : form.room_type,
      beds: bedTotal || Number(form.beds) || 1,
      included_guests: Number(form.included_guests) || 0,
      max_guests: Number(form.max_guests) || 0,
      extra_bed_allowed: Boolean(form.extra_bed_allowed),
      extra_bed_limit: Number(form.extra_bed_limit) || 0,
      extra_guest_fee_per_night: Number(form.extra_guest_fee_per_night) || 0,
      price_per_night: Number(form.price_per_night),
      status: form.status,
      description: form.description,
      bed_configs: bedConfigs.filter((b) => Number(b.quantity) > 0),
      addon_service_ids: selectedAddonIds,
      amenity_ids: selectedAmenityIds,
    };
    try {
      let savedId = roomId;
      if (isEdit) {
        await updateRoom(roomId, payload);
      } else {
        const created = await createRoom(payload);
        savedId = created.id;
      }

      if (isEdit && mediaItems.length) {
        await reorderRoomMedia(savedId, mediaItems.map((m) => m.id));
        if (coverMediaId) {
          await updateRoomMedia(savedId, coverMediaId, { is_cover: true });
        }
      }

      for (const pending of pendingFiles) {
        const uploaded = await uploadRoomMedia(savedId, pending.file, {
          caption: pending.caption || '',
          is_cover: coverPendingKey === pending.key,
        });
        if (coverPendingKey === pending.key && uploaded?.id) {
          await updateRoomMedia(savedId, uploaded.id, { is_cover: true });
        }
      }

      toast.success(isEdit ? 'Unit updated' : 'Unit added');
      navigate('/gh/settings?tab=rooms');
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Could not save unit';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <AppLoader message="Loading…" />;
  }

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '24px',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={() => navigate('/gh/settings?tab=rooms')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
              }}
              aria-label="Back"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                {isEdit ? `Room ${form.room_number}` : 'Set up room details, capacity, and nightly rate.'}
              </p>
            </div>
          </div>
          {!isEdit && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={12} /> New room
            </span>
          )}
        </div>

        {formError && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '16px 20px',
              color: '#b91c1c',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '32px',
            }}
          >
            {formError}
          </div>
        )}

        <div className="booking-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sectionTitle('Unit details')}
              <div className="premium-card form-grid-2 form-grid-2--gap-24" style={{ padding: '28px' }}>
                <div className="input-group">
                  <label>Type</label>
                  <select
                    value={form.unit_kind}
                    onChange={(e) => {
                      const unit_kind = e.target.value;
                      setForm({
                        ...form,
                        unit_kind,
                        parent: unit_kind === 'SUITE' ? '' : form.parent,
                        room_type: unit_kind === 'SUITE' ? 'SUITE' : (form.room_type === 'SUITE' ? 'DOUBLE' : form.room_type),
                      });
                    }}
                    style={{ width: '100%' }}
                  >
                    {UNIT_KINDS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Suite can own child rooms. Room can be independent or belong to a suite.
                  </p>
                </div>
                <div className="input-group">
                  <label>Name</label>
                  <input
                    required
                    value={form.room_number}
                    onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                    placeholder={form.unit_kind === 'SUITE' ? 'e.g. Suite A' : 'e.g. 101, A-2'}
                  />
                </div>
                {form.unit_kind === 'ROOM' && (
                  <div className="input-group">
                    <label>Belongs to suite</label>
                    <select
                      value={form.parent || ''}
                      onChange={(e) => setForm({ ...form, parent: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="">None — independent room (top-level)</option>
                      {suites
                        .filter((s) => String(s.id) !== String(roomId))
                        .map((s) => (
                          <option key={s.id} value={s.id}>Suite {s.room_number}</option>
                        ))}
                    </select>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Leave empty for a standalone room. Or pick a suite so this room is a child of that suite.
                    </p>
                  </div>
                )}
                {form.unit_kind === 'ROOM' && (
                  <div className="input-group">
                    <label>Room type</label>
                    <select
                      value={form.room_type}
                      onChange={(e) => setForm({ ...form, room_type: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      {ROOM_TYPES.filter((t) => t.value !== 'SUITE').map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sectionTitle('Bed configuration')}
              <div className="premium-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bedConfigs.map((row, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 40px', gap: '10px', alignItems: 'end' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Bed type</label>
                      <select
                        value={row.bed_type}
                        onChange={(e) => {
                          const next = [...bedConfigs];
                          next[idx] = { ...next[idx], bed_type: e.target.value };
                          setBedConfigs(next);
                        }}
                        style={{ width: '100%' }}
                      >
                        {BED_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Qty</label>
                      <input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) => {
                          const next = [...bedConfigs];
                          next[idx] = { ...next[idx], quantity: e.target.value };
                          setBedConfigs(next);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ height: '42px', padding: 0 }}
                      onClick={() => setBedConfigs(bedConfigs.filter((_, i) => i !== idx))}
                      disabled={bedConfigs.length <= 1}
                      aria-label="Remove bed row"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => setBedConfigs([...bedConfigs, { bed_type: 'TWIN', quantity: 1 }])}
                >
                  Add bed type
                </button>
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sectionTitle('Capacity & pricing')}
              <div className="premium-card form-grid-2 form-grid-2--gap-24" style={{ padding: '28px' }}>
                <div className="input-group">
                  <label>Price per night (Rs)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.price_per_night}
                    onChange={(e) => setForm({ ...form, price_per_night: e.target.value })}
                    placeholder="e.g. 7000"
                  />
                </div>
                <div className="input-group">
                  <label>Included guests (base rate)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.included_guests}
                    onChange={(e) => setForm({ ...form, included_guests: e.target.value })}
                    placeholder="0 = same as beds"
                  />
                </div>
                <div className="input-group">
                  <label>Max guests</label>
                  <input
                    type="number"
                    min={0}
                    value={form.max_guests}
                    onChange={(e) => setForm({ ...form, max_guests: e.target.value })}
                    placeholder="0 = included + extra beds"
                  />
                </div>
                <div className="input-group">
                  <label>Extra bedding fee / night (Rs)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.extra_guest_fee_per_night}
                    onChange={(e) => setForm({ ...form, extra_guest_fee_per_night: e.target.value })}
                    placeholder="e.g. 1500 per mattress"
                  />
                </div>
                <div className="input-group">
                  <label>Extra beds allowed</label>
                  <select
                    value={form.extra_bed_allowed ? '1' : '0'}
                    onChange={(e) => setForm({ ...form, extra_bed_allowed: e.target.value === '1' })}
                    style={{ width: '100%' }}
                  >
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Extra bed limit</label>
                  <input
                    type="number"
                    min={0}
                    disabled={!form.extra_bed_allowed}
                    value={form.extra_bed_limit}
                    onChange={(e) => setForm({ ...form, extra_bed_limit: e.target.value })}
                  />
                </div>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sectionTitle('Amenities')}
              <div className="premium-card" style={{ padding: '20px 24px' }}>
                {amenitiesCatalog.length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>No amenities configured yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {amenitiesCatalog.map((a) => {
                      const on = selectedAmenityIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleAmenity(a.id)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 999,
                            border: on ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: on ? 'var(--primary-light)' : 'var(--surface)',
                            color: on ? 'var(--primary)' : 'var(--text)',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          {a.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sectionTitle('Extra services for this room')}
              <RoomFormAddonsSection
                selectedIds={selectedAddonIds}
                onSelectedIdsChange={setSelectedAddonIds}
              />
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sectionTitle('Photos')}
              <div className="premium-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagePick}
                  style={{ display: 'none' }}
                />
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                  Unlimited photos for rooms and suites. Mark one as cover. Use arrows to reorder.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                  {mediaItems.map((m, index) => (
                    <div
                      key={m.id}
                      style={{
                        borderRadius: 12,
                        border: coverMediaId === m.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                        overflow: 'hidden',
                        background: 'var(--background)',
                      }}
                    >
                      <img
                        src={resolveMediaUrl(m.url || m.file)}
                        alt={m.caption || 'Unit photo'}
                        style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          onClick={() => { setCoverMediaId(m.id); setCoverPendingKey(null); }}
                        >
                          {coverMediaId === m.id ? 'Cover' : 'Set cover'}
                        </button>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button type="button" className="btn-secondary" style={{ flex: 1, padding: 4, fontSize: 11 }} onClick={() => moveMedia(index, -1)}>↑</button>
                          <button type="button" className="btn-secondary" style={{ flex: 1, padding: 4, fontSize: 11 }} onClick={() => moveMedia(index, 1)}>↓</button>
                          <button type="button" className="btn-secondary" style={{ flex: 1, padding: 4, fontSize: 11, color: '#b91c1c' }} onClick={() => removeSavedMedia(m.id)}>✕</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingFiles.map((p) => (
                    <div
                      key={p.key}
                      style={{
                        borderRadius: 12,
                        border: coverPendingKey === p.key ? '2px solid var(--primary)' : '1px dashed var(--border)',
                        overflow: 'hidden',
                        background: 'var(--background)',
                      }}
                    >
                      <img src={p.preview} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          onClick={() => { setCoverPendingKey(p.key); setCoverMediaId(null); }}
                        >
                          {coverPendingKey === p.key ? 'Cover' : 'Set cover'}
                        </button>
                        <button type="button" className="btn-secondary" style={{ fontSize: 11, padding: '4px 8px', color: '#b91c1c' }} onClick={() => removePending(p.key)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <ImagePlus size={16} /> Add photos
                </button>
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sectionTitle('Description')}
              <div className="premium-card" style={{ padding: '28px' }}>
                <div className="input-group">
                  <label>Room notes <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Amenities, floor, view, AC, attached bath…"
                    style={{ width: '100%', resize: 'vertical', minHeight: '96px' }}
                  />
                </div>
              </div>
            </section>
          </div>

          <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="premium-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div
                style={{
                  backgroundColor: 'var(--primary-light)',
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <FileText size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', margin: 0 }}>
                  Room preview
                </h3>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    height: '120px',
                    backgroundColor: 'var(--surface-elevated)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                  }}
                >
                  {coverPreview ? (
                    <img src={coverPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <BedDouble size={40} />
                  )}
                </div>

                <div>
                  <p style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--secondary)' }}>
                    {form.room_number
                      ? `${form.unit_kind === 'SUITE' ? 'Suite' : 'Room'} ${form.room_number}`
                      : (form.unit_kind === 'SUITE' ? 'Suite -' : 'Room -')}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{kindLabel} · {typeLabel}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <Users size={14} />
                  {bedTotal || form.beds || '-'} bed{(bedTotal || Number(form.beds)) !== 1 ? 's' : ''}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Nightly rate</span>
                  <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--primary)' }}>
                    {nightly > 0 ? formatRs(nightly) : '-'}
                  </span>
                </div>

                <span
                  style={{
                    alignSelf: 'flex-start',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700',
                    backgroundColor: form.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                    color: form.status === 'ACTIVE' ? '#166534' : 'var(--text-dim)',
                  }}
                >
                  {form.status}
                </span>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {statusLabel}
                </p>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '14px',
                    marginTop: '8px',
                  }}
                >
                  <CheckCircle size={18} />
                  {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Room'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/gh/settings?tab=rooms')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                  }}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--primary-light)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              <h4
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '0 0 10px 0',
                }}
              >
                <HelpCircle size={14} /> Note
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                Only <strong>Active</strong> rooms appear when creating new stays. Use Maintenance for repairs.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
