import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Sparkles, BedDouble, FileText, CheckCircle, X, HelpCircle, Users, ImagePlus,
} from 'lucide-react';
import { createRoom, updateRoom, getRoom } from '../../api/guesthouse';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import { formatRs } from '../../utils/currency';
import { resolveMediaUrl } from '../../utils/media';

const ROOM_TYPES = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'DOUBLE', label: 'Double' },
  { value: 'SUITE', label: 'Suite' },
  { value: 'FAMILY', label: 'Family' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active — available for stays' },
  { value: 'MAINTENANCE', label: 'Maintenance — temporarily unavailable' },
  { value: 'INACTIVE', label: 'Inactive — hidden from new bookings' },
];

const emptyForm = {
  room_number: '',
  room_type: 'DOUBLE',
  beds: 1,
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
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!canManage) {
      toast.error('You do not have permission to manage rooms.');
      navigate('/gh/rooms');
    }
  }, [canManage, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isEdit && roomId) {
          const room = await getRoom(roomId);
          setForm({
            room_number: room.room_number || '',
            room_type: room.room_type || 'DOUBLE',
            beds: room.beds ?? 1,
            price_per_night: room.price_per_night ?? '',
            status: room.status || 'ACTIVE',
            description: room.description || '',
          });
          setExistingImage(room.image || '');
        }
      } catch {
        toast.error('Room not found');
        navigate('/gh/rooms');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEdit, roomId, navigate]);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl('');
    return undefined;
  }, [imageFile]);

  const displayImage = previewUrl || (existingImage ? resolveMediaUrl(existingImage) : '');

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setRemoveImage(false);
  };

  const clearImage = () => {
    setImageFile(null);
    setExistingImage('');
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const typeLabel = ROOM_TYPES.find((t) => t.value === form.room_type)?.label || form.room_type;
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === form.status)?.label || form.status;
  const nightly = parseFloat(form.price_per_night) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const payload = {
      room_number: form.room_number.trim(),
      room_type: form.room_type,
      beds: Number(form.beds),
      price_per_night: Number(form.price_per_night),
      status: form.status,
      description: form.description,
    };
    try {
      if (isEdit) {
        if (imageFile) {
          await updateRoom(roomId, payload, imageFile);
        } else if (removeImage) {
          await updateRoom(roomId, { ...payload, image: null });
        } else {
          await updateRoom(roomId, payload);
        }
        toast.success('Room updated');
      } else {
        await createRoom(payload, imageFile);
        toast.success('Room added');
      }
      navigate('/gh/rooms');
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Could not save room';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ padding: '48px', textAlign: 'center' }}>
        Loading…
      </div>
    );
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
              onClick={() => navigate('/gh/rooms')}
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
              <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--secondary)', margin: 0 }}>
                {isEdit ? 'Modify Room' : 'Add New Room'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
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
              {sectionTitle('Room details')}
              <div className="premium-card form-grid-2 form-grid-2--gap-24" style={{ padding: '28px' }}>
                <div className="input-group">
                  <label>Room number</label>
                  <input
                    required
                    value={form.room_number}
                    onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                    placeholder="e.g. 101, A-2, Deluxe-1"
                  />
                </div>
                <div className="input-group">
                  <label>Room type</label>
                  <select
                    value={form.room_type}
                    onChange={(e) => setForm({ ...form, room_type: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    {ROOM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sectionTitle('Capacity & pricing')}
              <div className="premium-card form-grid-2 form-grid-2--gap-24" style={{ padding: '28px' }}>
                <div className="input-group">
                  <label>Number of beds</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.beds}
                    onChange={(e) => setForm({ ...form, beds: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Price per night (Rs)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.price_per_night}
                    onChange={(e) => setForm({ ...form, price_per_night: e.target.value })}
                    placeholder="e.g. 3500"
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

            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sectionTitle('Room photo')}
              <div className="premium-card" style={{ padding: '28px' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagePick}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    borderRadius: '14px',
                    border: '2px dashed var(--border)',
                    overflow: 'hidden',
                    background: 'var(--background)',
                  }}
                >
                  {displayImage ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={displayImage}
                        alt="Room preview"
                        style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700 }}
                        >
                          Change
                        </button>
                        {(imageFile || existingImage) && (
                          <button
                            type="button"
                            onClick={() => { clearImage(); setExistingImage(''); }}
                            style={{
                              padding: '8px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              background: '#fff',
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              color: '#b91c1c',
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '100%',
                        padding: '48px 24px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <ImagePlus size={36} style={{ color: 'var(--primary)', opacity: 0.7 }} />
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--secondary)' }}>Upload room photo</span>
                      <span style={{ fontSize: 12 }}>JPG, PNG or WebP · max 5MB</span>
                    </button>
                  )}
                </div>
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
                  {displayImage ? (
                    <img src={displayImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <BedDouble size={40} />
                  )}
                </div>

                <div>
                  <p style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--secondary)' }}>
                    {form.room_number ? `Room ${form.room_number}` : 'Room —'}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{typeLabel}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <Users size={14} />
                  {form.beds || '—'} bed{Number(form.beds) !== 1 ? 's' : ''}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Nightly rate</span>
                  <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--primary)' }}>
                    {nightly > 0 ? formatRs(nightly) : '—'}
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
                    color: form.status === 'ACTIVE' ? '#166534' : '#64748b',
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
                  onClick={() => navigate('/gh/rooms')}
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
