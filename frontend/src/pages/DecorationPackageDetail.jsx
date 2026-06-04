import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Edit2,
  Trash2,
  Clock,
  ListChecks,
  ChevronRight,
} from 'lucide-react';
import { getDecorationPackage } from '../api/decorations';
import client from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { TIER_LABELS, TIER_STYLES } from '../utils/decorationHelpers';

const DecorationPackageDetail = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [pkg, setPkg] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getDecorationPackage(packageId);
        setPkg(data);
        try {
          const res = await client.get(`/bookings/?decoration_package=${packageId}`);
          const rows = res.data?.results || res.data || [];
          setBookings(Array.isArray(rows) ? rows : []);
        } catch {
          setBookings([]);
        }
      } catch {
        toast.error('Package not found');
        navigate('/decoration-packages');
      } finally {
        setIsLoading(false);
      }
    };
    if (packageId) load();
  }, [packageId, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this decoration package?')) return;
    try {
      await client.delete(`/decorations/packages/${packageId}/`);
      toast.success('Package deleted');
      navigate('/decoration-packages');
    } catch {
      toast.error('Failed to delete package');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading package…
      </div>
    );
  }

  if (!pkg) return null;

  const tierStyle = TIER_STYLES[pkg.tier] || TIER_STYLES.CLASSIC;
  const items = Array.isArray(pkg.included_items) ? pkg.included_items : [];

  return (
    <div className="animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          background: 'transparent',
          color: 'var(--text-muted)',
          fontWeight: '600',
        }}
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', fontFamily: 'monospace', marginBottom: '6px' }}>
            PKG-{pkg.id}
          </p>
          <h2 style={{ fontSize: '28px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Sparkles size={28} color="var(--primary)" />
            {pkg.name}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Decoration package — stage, lighting aur florals ki bundle detail
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                backgroundColor: tierStyle.bg,
                color: tierStyle.color,
              }}
            >
              {TIER_LABELS[pkg.tier] || pkg.tier}
            </span>
            <span
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                backgroundColor: pkg.is_active ? '#dcfce7' : '#f1f5f9',
                color: pkg.is_active ? '#166534' : '#64748b',
              }}
            >
              {pkg.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/decoration-packages', { state: { editPackageId: pkg.id } })}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Edit2 size={18} /> Edit package
            </button>
            <button
              type="button"
              onClick={handleDelete}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                background: 'transparent',
                color: '#b91c1c',
                fontWeight: '600',
              }}
            >
              <Trash2 size={18} /> Delete
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="premium-card" style={{ padding: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Base price</p>
          <p style={{ fontSize: '28px', fontWeight: '900' }}>
            <span style={{ fontSize: '50%', opacity: 0.7 }}>Rs</span>{' '}
            {parseFloat(pkg.base_price || 0).toLocaleString()}
          </p>
        </div>
        <div className="premium-card" style={{ padding: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} /> Setup time
          </p>
          <p style={{ fontSize: '24px', fontWeight: '800' }}>~{pkg.setup_hours} hours</p>
        </div>
        <div className="premium-card" style={{ padding: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Display order</p>
          <p style={{ fontSize: '24px', fontWeight: '800' }}>{pkg.display_order ?? 0}</p>
        </div>
        <div className="premium-card" style={{ padding: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Bookings</p>
          <p style={{ fontSize: '24px', fontWeight: '800' }}>{bookings.length}</p>
        </div>
      </div>

      {pkg.description && (
        <div className="premium-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '10px' }}>Description</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{pkg.description}</p>
        </div>
      )}

      <div className="premium-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListChecks size={20} color="var(--primary)" /> Included items
        </h3>
        {items.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No line items listed.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '22px', fontSize: '15px', lineHeight: 1.8, color: 'var(--text-main)' }}>
            {items.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="premium-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>
          Bookings using this package ({bookings.length})
        </h3>
        {bookings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No bookings linked yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bookings.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => navigate(`/bookings/${b.id}`)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <div>
                  <p style={{ fontWeight: '700', fontSize: '14px' }}>{b.event_name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {b.booking_id || `BK-${b.id}`} · {b.event_date || '—'} · {b.customer_name || ''}
                  </p>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DecorationPackageDetail;
