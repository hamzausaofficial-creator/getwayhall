import { Loader } from 'lucide-react';

export default function ScannedGuestPanel({
  draft,
  loading = false,
  saving = false,
  onChange,
  onPhoneChange,
  onSave,
  onCancel,
}) {
  if (loading && !draft) {
    return <p className="cnic-scan-result__loading">Processing ID card…</p>;
  }

  if (!draft) return null;

  return (
    <div className="cnic-scan-result">
      <p className="cnic-scan-result__title">From ID card</p>
      <div className="cnic-scan-result__grid">
        <div className="cnic-scan-result__row">
          <strong>Name</strong>
          <input
            type="text"
            className="cnic-scan-result__input"
            value={draft.full_name || ''}
            onChange={(e) => onChange?.('full_name', e.target.value)}
            placeholder="Guest full name"
          />
        </div>
        <div className="cnic-scan-result__row">
          <strong>CNIC number</strong>
          <input
            type="text"
            className="cnic-scan-result__input cnic-scan-result__input--mono"
            value={draft.cnic || ''}
            onChange={(e) => onChange?.('cnic', e.target.value)}
            placeholder="35202-1234567-9"
          />
        </div>
      </div>
      <div className="cnic-scan-result__phone-section">
        <p className="cnic-scan-result__phone-label">
          Phone <span className="cnic-scan-result__required">*</span>
          <span className="cnic-scan-result__phone-note"> — enter manually (not on ID card)</span>
        </p>
        <input
          type="text"
          className="cnic-scan-result__input"
          value={draft.phone || ''}
          onChange={(e) => (onPhoneChange ? onPhoneChange(e.target.value) : onChange?.('phone', e.target.value))}
          placeholder="0300 1234567"
          autoFocus
        />
      </div>
      <div className="cnic-scan-result__actions">
        <button
          type="button"
          className="btn-primary"
          onClick={onSave}
          disabled={saving}
          style={{ flex: 1, minWidth: 140, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {saving ? (
            <>
              <Loader size={15} className="spin" />
              Saving…
            </>
          ) : (
            'Save guest'
          )}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
