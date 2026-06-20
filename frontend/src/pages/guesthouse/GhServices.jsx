import { useEffect, useState } from 'react';
import { Plus, Snowflake, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLoader from '../../components/AppLoader';
import GhServiceFormModal, {
  emptyGhServiceForm, ghServiceSlugCode, GH_SERVICE_PRICING_OPTIONS,
} from '../../components/guesthouse/GhServiceFormModal';
import {
  listGhServicesAll, createGhService, updateGhService, deleteGhService,
} from '../../api/guesthouse';
import { usePermissions } from '../../hooks/usePermissions';
import { formatRs } from '../../utils/currency';
import './gh-services.css';

const PRICING_OPTIONS = GH_SERVICE_PRICING_OPTIONS;

function pricingMeta(unit) {
  return PRICING_OPTIONS.find((o) => o.value === unit) || { label: unit, short: unit };
}

export default function GhServices({ embedded = false }) {
  const { canManage } = usePermissions();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyGhServiceForm);
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
    setForm(emptyGhServiceForm);
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
        await createGhService({ ...payload, code: ghServiceSlugCode(form.label) });
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

  const renderServiceCard = (svc) => {
    const unit = pricingMeta(svc.pricing_unit);
    return (
      <article key={svc.id} className="gh-services__card">
        <div className="gh-services__card-top">
          <div className="gh-services__icon" aria-hidden>
            <Snowflake size={16} />
          </div>
          <div className="gh-services__info">
            <p className="gh-services__name">{svc.label}</p>
            <div className="gh-services__price-row">
              <p className="gh-services__price">{formatRs(svc.price)}</p>
              <span className="gh-services__unit">{unit.short}</span>
            </div>
            {svc.code && <p className="gh-services__code">{svc.code}</p>}
          </div>
        </div>
        {canManage && (
          <div className="gh-services__actions">
            <button
              type="button"
              className="btn-secondary gh-services__action-btn"
              onClick={() => openEdit(svc)}
              aria-label={`Edit ${svc.label}`}
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              className="btn-secondary gh-services__action-btn gh-services__action-btn--danger"
              onClick={() => handleDeactivate(svc)}
              aria-label={`Remove ${svc.label}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className={`gh-services animate-fade-in${embedded ? ' gh-services--embedded' : ''}`}>
      <div className="gh-services__toolbar">
        {!embedded && (
          <p className="gh-services__meta">
            Manage AC, breakfast, laundry, and other extras shown when booking stays.
          </p>
        )}
        {embedded && (
          <p className="gh-services__meta">
            {activeServices.length} active service{activeServices.length !== 1 ? 's' : ''}
          </p>
        )}
        {canManage && (
          <button type="button" className="btn-primary gh-services__add-btn" onClick={openCreate}>
            <Plus size={16} aria-hidden />
            Add service
          </button>
        )}
      </div>

      {loading ? (
        <AppLoader inline message="Loading services…" />
      ) : activeServices.length === 0 ? (
        <div className="gh-services__empty">
          <Snowflake size={28} style={{ opacity: 0.35, marginBottom: 10 }} />
          <p className="gh-services__empty-title">No add-on services yet</p>
          <p className="gh-services__empty-text">
            Add AC, breakfast, laundry, or other extras for guests when booking.
          </p>
          {canManage && (
            <button type="button" className="btn-primary gh-services__add-btn" onClick={openCreate}>
              <Plus size={16} aria-hidden />
              Add first service
            </button>
          )}
        </div>
      ) : (
        <div className="gh-services__grid">
          {activeServices.map(renderServiceCard)}
        </div>
      )}

      {inactiveServices.length > 0 && (
        <div className="gh-services__inactive">
          <p className="gh-services__inactive-title">
            Inactive ({inactiveServices.length})
          </p>
          <div className="gh-services__inactive-list">
            {inactiveServices.map((svc) => (
              <div key={svc.id} className="gh-services__inactive-row">
                <span>{svc.label}</span>
                {canManage && (
                  <button
                    type="button"
                    className="btn-secondary gh-services__restore-btn"
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

      {modalOpen && (
        <GhServiceFormModal
          open={modalOpen}
          editing={editing}
          form={form}
          saving={saving}
          createTitle="Add service"
          onClose={() => !saving && setModalOpen(false)}
          onChange={setForm}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}
