import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const GH_SERVICE_PRICING_OPTIONS = [
  { value: 'PER_NIGHT', label: 'Per night', short: '/ night' },
  { value: 'PER_STAY', label: 'Per stay (one-time)', short: '/ stay' },
  { value: 'PER_GUEST', label: 'Per guest per night', short: '/ guest / night' },
];

export function ghServiceSlugCode(label) {
  return String(label || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 32) || `SVC_${Date.now()}`;
}

export const emptyGhServiceForm = {
  label: '',
  price: '',
  pricing_unit: 'PER_NIGHT',
  sort_order: 0,
};

export default function GhServiceFormModal({
  open,
  editing,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
  createTitle = 'Add custom service',
}) {
  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
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
              {editing ? 'Edit service' : createTitle}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
              {editing
                ? 'Update name, price, and how this extra is charged.'
                : 'Create AC, breakfast, laundry, or any other add-on.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            disabled={saving}
            style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', flexShrink: 0 }}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="input-group">
            <label>Service name</label>
            <input
              required
              autoFocus
              value={form.label}
              onChange={(e) => onChange({ ...form, label: e.target.value })}
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
                onChange={(e) => onChange({ ...form, price: e.target.value })}
                placeholder="500"
              />
            </div>
            <div className="input-group">
              <label>Pricing</label>
              <select
                value={form.pricing_unit}
                onChange={(e) => onChange({ ...form, pricing_unit: e.target.value })}
              >
                {GH_SERVICE_PRICING_OPTIONS.map((o) => (
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
              onChange={(e) => onChange({ ...form, sort_order: e.target.value })}
              placeholder="0"
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Lower numbers appear first when booking.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
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
  );
}
