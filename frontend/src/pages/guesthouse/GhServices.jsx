import { useEffect, useState } from 'react';
import { Plus, Snowflake, Edit2, Trash2, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import AppLoader from '../../components/AppLoader';
import {
  listGhServicesAll, createGhService, updateGhService, deleteGhService,
} from '../../api/guesthouse';
import { usePermissions } from '../../hooks/usePermissions';
import { formatRs } from '../../utils/currency';

const PRICING_OPTIONS = [
  { value: 'PER_NIGHT', label: 'Per night' },
  { value: 'PER_STAY', label: 'Per stay (one-time)' },
  { value: 'PER_GUEST', label: 'Per guest per night' },
];

const slugCode = (label) => String(label || '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '_')
  .replace(/^_|_$/g, '')
  .slice(0, 32) || `SVC_${Date.now()}`;

const emptyForm = {
  label: '',
  price: '',
  pricing_unit: 'PER_NIGHT',
  sort_order: 0,
};

export default function GhServices({ embedded = false }) {
  const { canManage } = usePermissions();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setServices(await listGhServicesAll());
    } catch {
      toast.error('Failed to load add-on services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    if (!canManage) {
      toast.error('You do not have permission to manage services.');
      return;
    }
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (svc) => {
    if (!canManage) return;
    setEditing(svc);
    setForm({
      label: svc.label || '',
      price: String(svc.price ?? ''),
      pricing_unit: svc.pricing_unit || 'PER_NIGHT',
      sort_order: svc.sort_order ?? 0,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.label.trim()) {
      toast.error('Service name is required');
      return;
    }
    const price = Number(form.price);
    if (!price || price <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: form.label.trim(),
        price,
        pricing_unit: form.pricing_unit,
        sort_order: Number(form.sort_order) || 0,
        is_active: true,
      };
      if (editing) {
        await updateGhService(editing.id, payload);
        toast.success('Service updated');
      } else {
        await createGhService({ ...payload, code: slugCode(form.label) });
        toast.success('Service added');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.code?.[0] || data?.label?.[0] || data?.detail || 'Could not save service';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (svc) => {
    if (!canManage) return;
    if (!window.confirm(`Remove "${svc.label}" from booking options?`)) return;
    try {
      await deleteGhService(svc.id);
      toast.success('Service removed');
      await load();
    } catch {
      toast.error('Failed to remove service');
    }
  };

  const activeServices = services.filter((s) => s.is_active !== false);
  const inactiveServices = services.filter((s) => s.is_active === false);

  return (
    <div className="animate-fade-in">
      {!embedded && (
        <div className="page-header">
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Add-on Services</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Manage AC, breakfast, laundry, and other extras shown when booking stays.
            </p>
          </div>
          {canManage && (
            <button type="button" className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} /> Add service
            </button>
          )}
        </div>
      )}

      {embedded && canManage && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button type="button" className="btn-primary" onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Plus size={16} /> Add service
          </button>
        </div>
      )}

      {loading ? (
        <AppLoader inline message="Loading services…" />
      ) : activeServices.length === 0 ? (
        <div className="premium-card" style={{ padding: '32px', textAlign: 'center' }}>
          <Snowflake size={36} style={{ opacity: 0.35, marginBottom: 12 }} />
          <p style={{ fontWeight: 700, marginBottom: 8 }}>No add-on services yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
            Add services like AC, breakfast, or laundry for guests to select when booking.
          </p>
          {canManage && (
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add first service
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {activeServices.map((svc) => {
            const unit = PRICING_OPTIONS.find((o) => o.value === svc.pricing_unit)?.label || svc.pricing_unit;
            return (
              <div
                key={svc.id}
                className="premium-card"
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 800, margin: '0 0 4px 0', color: 'var(--secondary)' }}>{svc.label}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                    {formatRs(svc.price)} · {unit}
                    {svc.code && <span style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 11 }}>{svc.code}</span>}
                  </p>
                </div>
                {canManage && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn-secondary" onClick={() => openEdit(svc)} style={{ padding: '8px 12px', fontSize: 12 }}>
                      <Edit2 size={14} />
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => handleDeactivate(svc)} style={{ padding: '8px 12px', fontSize: 12, color: '#b91c1c' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {inactiveServices.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Inactive ({inactiveServices.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inactiveServices.map((svc) => (
              <div key={svc.id} className="premium-card" style={{ padding: '12px 16px', opacity: 0.65, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14 }}>{svc.label}</span>
                {canManage && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: '6px 10px' }}
                    onClick={async () => {
                      try {
                        await updateGhService(svc.id, { is_active: true });
                        toast.success('Service restored');
                        load();
                      } catch {
                        toast.error('Failed to restore');
                      }
                    }}
                  >
                    Restore
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {modalOpen && createPortal(
        <div className="modal-overlay" onClick={() => !saving && setModalOpen(false)}>
          <div
            className="card modal-panel modal-panel--sm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gh-service-modal-title"
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 24,
              }}
            >
              <div>
                <h3 id="gh-service-modal-title" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                  {editing ? 'Edit service' : 'Add service'}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
                  {editing
                    ? 'Update price and how this extra is charged on stays.'
                    : 'Add AC, breakfast, laundry, or other extras for booking.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setModalOpen(false)}
                disabled={saving}
                style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', flexShrink: 0 }}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="input-group">
                <label>Service name</label>
                <input
                  required
                  autoFocus
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Breakfast, AC, Laundry"
                />
              </div>
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Price (Rs)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div className="input-group">
                  <label>Pricing</label>
                  <select
                    value={form.pricing_unit}
                    onChange={(e) => setForm({ ...form, pricing_unit: e.target.value })}
                  >
                    {PRICING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Sort order</label>
                <input
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  placeholder="0"
                />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Lower numbers appear first when booking a stay.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Add service'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
