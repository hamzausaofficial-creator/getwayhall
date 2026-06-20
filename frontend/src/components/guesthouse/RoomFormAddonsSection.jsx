import { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  listGhServices, createGhService, updateGhService, deleteGhService,
} from '../../api/guesthouse';
import { usePermissions } from '../../hooks/usePermissions';
import { formatRs } from '../../utils/currency';
import GhServiceFormModal, {
  emptyGhServiceForm, ghServiceSlugCode, GH_SERVICE_PRICING_OPTIONS,
} from './GhServiceFormModal';
import '../../pages/guesthouse/room-form-addons.css';

function pricingShort(unit) {
  return GH_SERVICE_PRICING_OPTIONS.find((o) => o.value === unit)?.short || unit;
}

export default function RoomFormAddonsSection({ selectedIds, onSelectedIdsChange }) {
  const { canManage } = usePermissions();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyGhServiceForm);
  const [saving, setSaving] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listGhServices();
      setServices(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Failed to load add-on services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (loading || services.length === 0) return;
    const validIds = new Set(services.map((svc) => svc.id));
    onSelectedIdsChange((prev) => {
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [loading, services, onSelectedIdsChange]);

  const toggleAddon = (id) => {
    onSelectedIdsChange((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyGhServiceForm);
    setModalOpen(true);
  };

  const openEdit = (svc, e) => {
    e.preventDefault();
    e.stopPropagation();
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
        const created = await createGhService({ ...payload, code: ghServiceSlugCode(form.label) });
        toast.success('Service added');
        if (created?.id) {
          onSelectedIdsChange((prev) => (
            prev.includes(created.id) ? prev : [...prev, Number(created.id)]
          ));
        }
      }
      setModalOpen(false);
      await loadServices();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.code?.[0] || data?.label?.[0] || data?.detail || 'Could not save service';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (svc, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${svc.label}"? It will be removed from all rooms and bookings.`)) return;
    try {
      await deleteGhService(svc.id);
      onSelectedIdsChange((prev) => prev.filter((id) => id !== svc.id));
      toast.success('Service deleted');
      await loadServices();
    } catch {
      toast.error('Failed to delete service');
    }
  };

  return (
    <>
      <div className="premium-card room-form-addons">
        <div className="room-form-addons__head">
          <p className="room-form-addons__hint">
            Tick services for this room, or add your own custom extras.
          </p>
          <div className="room-form-addons__head-actions">
            {services.length > 0 && (
              <span
                className={`room-form-addons__count${selectedIds.length > 0 ? ' room-form-addons__count--active' : ''}`}
              >
                {selectedIds.length} selected
              </span>
            )}
            {canManage && (
              <button
                type="button"
                className="room-form-addons__add-btn"
                onClick={openCreate}
              >
                <Plus size={14} aria-hidden />
                Add custom
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="room-form-addons__empty">Loading services…</p>
        ) : services.length === 0 ? (
          <div className="room-form-addons__empty-block">
            <p className="room-form-addons__empty">No add-on services yet.</p>
            {canManage && (
              <button type="button" className="room-form-addons__add-btn" onClick={openCreate}>
                <Plus size={14} aria-hidden />
                Add custom service
              </button>
            )}
          </div>
        ) : (
          <div className="room-form-addons__grid">
            {services.map((svc) => {
              const checked = selectedIds.includes(svc.id);
              return (
                <article
                  key={svc.id}
                  className={`room-form-addons__card${checked ? ' room-form-addons__card--checked' : ''}`}
                >
                  <div className="room-form-addons__card-main">
                    <label className="room-form-addons__check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAddon(svc.id)}
                        aria-label={`Include ${svc.label} for this room`}
                      />
                    </label>
                    <div className="room-form-addons__info">
                      <span className="room-form-addons__name">{svc.label}</span>
                      <div className="room-form-addons__price-row">
                        <span className="room-form-addons__amount">{formatRs(svc.price)}</span>
                        <span className="room-form-addons__unit">{pricingShort(svc.pricing_unit)}</span>
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="room-form-addons__card-foot">
                      <button
                        type="button"
                        className="room-form-addons__icon-btn"
                        onClick={(e) => openEdit(svc, e)}
                        aria-label={`Edit ${svc.label}`}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="room-form-addons__icon-btn room-form-addons__icon-btn--danger"
                        onClick={(e) => handleDelete(svc, e)}
                        aria-label={`Delete ${svc.label}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <GhServiceFormModal
        open={modalOpen}
        editing={editing}
        form={form}
        saving={saving}
        onClose={() => !saving && setModalOpen(false)}
        onChange={setForm}
        onSubmit={handleSave}
      />
    </>
  );
}
