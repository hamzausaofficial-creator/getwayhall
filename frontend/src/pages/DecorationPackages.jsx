import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Trash2, Edit, X, Filter, Plus, ChevronRight } from 'lucide-react';
import SearchInput from '../components/SearchInput';
import client from '../api/client';
import toast from 'react-hot-toast';
import {
  TIER_LABELS,
  TIER_STYLES,
  linesToItems,
  emptyPackageForm,
  parsePackageToForm,
} from '../utils/decorationHelpers';
import { usePermissions } from '../hooks/usePermissions';

const DecorationPackages = () => {
  const { canManage } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [formData, setFormData] = useState(emptyPackageForm);

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterTier) params.append('tier', filterTier);
      if (filterActive === 'true' || filterActive === 'false') params.append('is_active', filterActive);

      const qs = params.toString();
      const url = qs ? `/decorations/packages/?${qs}` : '/decorations/packages/';
      const response = await client.get(url);
      const data = response.data.results || response.data;
      setPackages(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load decoration packages');
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filterTier, filterActive]);

  useEffect(() => {
    void fetchPackages();
  }, [fetchPackages]);

  const openModal = (pkg = null) => {
    if (!canManage) {
      toast.error('You do not have permission to modify decoration packages.');
      return;
    }
    if (pkg) {
      setEditing(pkg);
      setFormData(parsePackageToForm(pkg));
    } else {
      setEditing(null);
      setFormData(emptyPackageForm);
    }
    setShowModal(true);
  };

  const openPackageDetail = (id) => {
    navigate(`/decoration-packages/${id}`);
  };

  useEffect(() => {
    const editId = location.state?.editPackageId;
    if (!editId || packages.length === 0) return;
    const pkg = packages.find((p) => String(p.id) === String(editId));
    if (pkg) {
      openModal(pkg);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [packages, location.state?.editPackageId, navigate, location.pathname]);

  const parseError = (err) => {
    const d = err.response?.data;
    if (!d) return 'Could not save package';
    if (typeof d === 'string') return d;
    if (d.detail) return String(d.detail);
    const first = Object.entries(d).find(([, v]) => v != null);
    if (first) {
      const [k, v] = first;
      const msg = Array.isArray(v) ? v[0] : typeof v === 'object' ? JSON.stringify(v) : String(v);
      return `${k}: ${msg}`;
    }
    return 'Could not save package';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      tier: formData.tier,
      description: formData.description.trim(),
      included_items: linesToItems(formData.included_lines),
      base_price: formData.base_price,
      setup_hours: formData.setup_hours,
      is_active: formData.is_active,
      display_order: formData.display_order,
    };
    try {
      if (editing) {
        await client.put(`/decorations/packages/${editing.id}/`, payload);
        toast.success('Package updated');
      } else {
        await client.post('/decorations/packages/', payload);
        toast.success('Package created');
      }
      setShowModal(false);
      fetchPackages();
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!canManage) return;
    if (!window.confirm('Delete this decoration package?')) return;
    try {
      await client.delete(`/decorations/packages/${id}/`);
      toast.success('Package deleted');
      fetchPackages();
    } catch {
      toast.error('Failed to delete package');
    }
  };

  return (
    <>
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Decoration Packages</h2>
            <p style={{ color: 'var(--text-muted)' }}>Create pricing bundles for stage, lighting, florals, and themed décor.</p>
          </div>
          {canManage && (
          <button type="button" className="btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> New package
          </button>
          )}
        </div>

        <div className="search-filter-bar" style={{ marginBottom: '24px' }}>
          <div className="search-filter-bar__search">
            <SearchInput
              variant="inset"
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ width: '200px' }}>
            <div style={{ position: 'relative' }}>
              <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }} />
              <select className="search-filter-bar__select" value={filterTier} onChange={(e) => setFilterTier(e.target.value)} style={{ paddingLeft: '40px', width: '100%' }}>
                <option value="">All tiers</option>
                {Object.entries(TIER_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ width: '180px' }}>
            <select className="search-filter-bar__select" value={filterActive} onChange={(e) => setFilterActive(e.target.value)} style={{ width: '100%' }}>
              <option value="">All statuses</option>
              <option value="true">Active only</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading packages…</div>
        ) : packages.length === 0 ? (
          <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Sparkles size={48} style={{ margin: '0 auto 16px', opacity: 0.35 }} />
            <p style={{ fontSize: '16px', fontWeight: '600' }}>No decoration packages yet</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Add your first package to quote events faster.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {packages.map((pkg) => {
              const tierStyle = TIER_STYLES[pkg.tier] || TIER_STYLES.CLASSIC;
              const items = Array.isArray(pkg.included_items) ? pkg.included_items : [];
              return (
                <div
                  key={pkg.id}
                  role="button"
                  tabIndex={0}
                  className="card"
                  style={{ padding: '24px', cursor: 'pointer' }}
                  onClick={() => openPackageDetail(pkg.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openPackageDetail(pkg.id);
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{pkg.name}</h3>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: tierStyle.bg,
                            color: tierStyle.color,
                          }}
                        >
                          {TIER_LABELS[pkg.tier] || pkg.tier}
                        </span>
                        {!pkg.is_active && (
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Inactive</span>
                        )}
                      </div>
                      {pkg.description && (
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>{pkg.description}</p>
                      )}
                      <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text)' }}>Included</p>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        {items.length ? (
                          items.slice(0, 4).map((line, idx) => (
                            <li key={idx}>{line}</li>
                          ))
                        ) : (
                          <li style={{ listStyle: 'none', marginLeft: '-20px', fontStyle: 'italic' }}>No line items listed</li>
                        )}
                        {items.length > 4 && (
                          <li style={{ listStyle: 'none', marginLeft: '-20px', fontStyle: 'italic' }}>+{items.length - 4} more…</li>
                        )}
                      </ul>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '140px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>From</p>
                      <p style={{ fontSize: '26px', fontWeight: '800', marginTop: '4px' }}>
                        <span style={{ fontSize: '55%', fontWeight: '600', opacity: 0.65 }}>Rs</span> {parseFloat(pkg.base_price || 0).toLocaleString()}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Setup ~{pkg.setup_hours}h</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', alignItems: 'center' }}>
                        {canManage && (
                        <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(pkg);
                          }}
                          style={{ color: 'var(--primary)', padding: '8px', background: 'transparent' }}
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(pkg.id, e)}
                          style={{ color: '#ef4444', padding: '8px', background: 'transparent' }}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                        </>
                        )}
                        <ChevronRight size={20} color="var(--text-muted)" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '640px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>{editing ? 'Edit package' : 'New decoration package'}</h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ backgroundColor: 'transparent', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Package name</label>
                  <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Royal Gold Stage" />
                </div>
                <div className="input-group">
                  <label>Tier</label>
                  <select required value={formData.tier} onChange={(e) => setFormData({ ...formData, tier: e.target.value })}>
                    {Object.entries(TIER_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What makes this package special?"
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', resize: 'vertical', minHeight: '72px' }}
                />
              </div>

              <div className="input-group">
                <label>Included items (one per line)</label>
                <textarea
                  value={formData.included_lines}
                  onChange={(e) => setFormData({ ...formData, included_lines: e.target.value })}
                  placeholder={'Stage backdrop with floral arch\nLED walkway pillars\nCeiling fairy lights'}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', resize: 'vertical', minHeight: '120px', fontFamily: 'inherit' }}
                />
              </div>

              <div className="form-grid-3">
                <div className="input-group">
                  <label>Base price (Rs)</label>
                  <input type="number" required min="0" step="0.01" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="input-group">
                  <label>Setup hours</label>
                  <input type="number" required min="1" max="72" value={formData.setup_hours} onChange={(e) => setFormData({ ...formData, setup_hours: parseInt(e.target.value, 10) || 1 })} />
                </div>
                <div className="input-group">
                  <label>Display order</label>
                  <input type="number" min="0" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })} />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                Active (visible for quoting)
              </label>

              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '12px' }}>
                  {editing ? 'Update package' : 'Create package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DecorationPackages;
