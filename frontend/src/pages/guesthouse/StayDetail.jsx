import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft, Calendar, User, BedDouble, CreditCard, Printer, Edit2,
  Wallet, Phone, Clock, Users, FileText, LogIn, LogOut, CheckCircle, XCircle,
  Plus, Trash2,
} from 'lucide-react';
import {
  getStay, stayCheckIn, stayCheckOut, stayConfirm, listGhPayments,
  addStayCharge, removeStayCharge,
} from '../../api/guesthouse';
import CancelStayModal from '../../components/guesthouse/CancelStayModal';
import AppLoader from '../../components/AppLoader';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatRs, formatCollectDuePKR, hasCollectDue } from '../../utils/currency';
import { canCancelGhStay } from '../../utils/ghStay';
import '../../styles/dashboard.css';
import './stay-detail.css';

const METHOD_LABELS = {
  CASH: 'Cash',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
  ONLINE: 'Online',
};

const TRACK_STEPS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'CHECKED_IN', label: 'Checked in' },
  { key: 'CHECKED_OUT', label: 'Checked out' },
];

const STATUS_ORDER = { PENDING: 0, CONFIRMED: 1, CHECKED_IN: 2, CHECKED_OUT: 3, CANCELLED: -1 };

const formatDate = (d) => {
  if (!d) return '-';
  try {
    return format(parseISO(d), 'EEE, dd MMM yyyy');
  } catch {
    return d;
  }
};

const formatDateShort = (d) => {
  if (!d) return '-';
  try {
    return format(parseISO(d), 'dd MMM yyyy');
  } catch {
    return d;
  }
};

function StatusTrack({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div className="sd-track">
        <div className="sd-track__step sd-track__step--cancelled">
          <span className="sd-track__dot"><XCircle size={12} /></span>
          <span className="sd-track__label">Cancelled</span>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER[status] ?? 0;

  return (
    <div className="sd-track">
      {TRACK_STEPS.map((step, i) => {
        const done = currentIdx > i;
        const current = currentIdx === i;
        const cls = [
          'sd-track__step',
          done ? 'sd-track__step--done' : '',
          current ? 'sd-track__step--current' : '',
        ].filter(Boolean).join(' ');

        return (
          <div key={step.key} className={cls}>
            <span className="sd-track__dot">{done ? '✓' : i + 1}</span>
            <span className="sd-track__label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function StayDetail() {
  const { stayId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { canOperate, canAccessPayments, canCancelStay } = usePermissions();
  const backTo = location.state?.from || '/gh/stays';
  const backLabel = location.state?.fromLabel || 'Back to stays';
  const [stay, setStay] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [addingCharge, setAddingCharge] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const s = await getStay(stayId);
      setStay(s);
      if (canAccessPayments) {
        setPayments(await listGhPayments({ stay: stayId }));
      } else {
        setPayments([]);
      }
    } catch {
      toast.error('Stay not found');
      navigate('/gh/stays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stayId) load();
  }, [stayId]);

  const runAction = async (fn, msg, body = {}) => {
    try {
      const updated = await fn(stayId, body);
      setStay(updated);
      await load();
      toast.success(msg);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed');
    }
  };

  const handleCheckIn = async () => {
    try {
      const updated = await stayCheckIn(stayId);
      setStay(updated);
      toast.success('Checked in');
      load();
    } catch (err) {
      const data = err.response?.data;
      if (data?.requires_acknowledgement) {
        const ok = window.confirm(`${data.detail}\n\nCheck in anyway without collecting full payment?`);
        if (ok) {
          try {
            const updated = await stayCheckIn(stayId, { acknowledge_balance: true });
            setStay(updated);
            toast.success('Checked in (balance still due)');
            load();
          } catch (e2) {
            toast.error(e2.response?.data?.detail || 'Check-in failed');
          }
        }
      } else {
        toast.error(data?.detail || 'Check-in failed');
      }
    }
  };

  const handleCheckOut = async () => {
    try {
      await stayCheckOut(stayId);
      toast.success('Checked out');
      load();
    } catch (err) {
      const data = err.response?.data;
      if (data?.requires_acknowledgement) {
        const ok = window.confirm(`${data.detail}\n\nCheck out anyway?`);
        if (ok) {
          try {
            const updated = await stayCheckOut(stayId, { acknowledge_balance: true });
            setStay(updated);
            toast.success('Checked out');
            load();
          } catch (e2) {
            toast.error(e2.response?.data?.detail || 'Check-out failed');
          }
        }
      } else {
        toast.error(data?.detail || 'Check-out failed');
      }
    }
  };

  const billing = useMemo(() => {
    if (!stay) return null;
    const due = stay.status === 'CANCELLED' ? 0 : Number(stay.remaining_balance || 0);
    const total = Number(stay.total_amount || 0);
    const paid = Number(stay.advance_paid || 0);
    const paidPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
    return { due, total, paid, paidPct };
  }, [stay]);

  if (loading) {
    return <AppLoader message="Loading reservation…" />;
  }
  if (!stay || !billing) return null;

  const { due, total, paid, paidPct } = billing;
  const isCancelled = stay.status === 'CANCELLED';
  const canAct = canOperate && !isCancelled && stay.status !== 'CHECKED_OUT';
  const showCancel = canCancelStay && canCancelGhStay(stay);
  const canAddCharges = canOperate && !isCancelled && stay.status !== 'CHECKED_OUT';
  const handleAddCharge = async (e) => {
    e.preventDefault();
    const desc = chargeDesc.trim();
    const amt = Number(chargeAmount);
    if (!desc) {
      toast.error('Enter a description');
      return;
    }
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setAddingCharge(true);
    try {
      const updated = await addStayCharge(stayId, { description: desc, amount: amt });
      setStay(updated);
      setChargeDesc('');
      setChargeAmount('');
      toast.success('Charge added');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not add charge');
    } finally {
      setAddingCharge(false);
    }
  };

  const handleRemoveCharge = async (chargeId) => {
    if (!window.confirm('Remove this charge?')) return;
    try {
      const updated = await removeStayCharge(stayId, chargeId);
      setStay(updated);
      toast.success('Charge removed');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not remove charge');
    }
  };

  return (
    <div className="animate-fade-in sd-page">
      <button type="button" className="sd-back" onClick={() => navigate(backTo)}>
        <ArrowLeft size={18} /> {backLabel}
      </button>

      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', fontFamily: 'monospace', margin: '0 0 6px 0' }}>
            {stay.booking_ref}
          </p>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: '800', margin: 0, wordBreak: 'break-word' }}>
            {stay.customer_name || 'Guest'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '14px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <BedDouble size={14} /> Room {stay.room_number}
            </span>
            {stay.customer_phone && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={14} /> {stay.customer_phone}
              </span>
            )}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <StatusBadge status={stay.status} />
            <StatusBadge status={stay.payment_status} />
          </div>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(
              isCancelled
                ? `/gh/print/stay/${stay.id}?doc=cancellation`
                : `/gh/print/stay/${stay.id}?doc=advance`,
            )}
          >
            <Printer size={16} /> {isCancelled ? 'Print cancellation' : 'Receipt'}
          </button>
          {!isCancelled && (
            <button type="button" className="btn-secondary" onClick={() => navigate(`/gh/print/stay/${stay.id}?doc=invoice`)}>
              <FileText size={16} /> Invoice
            </button>
          )}
          {canOperate && !isCancelled && (
            <button type="button" className="btn-secondary" onClick={() => navigate(`/gh/stays/${stay.id}/edit`)}>
              <Edit2 size={16} /> Edit
            </button>
          )}
          {showCancel && (
            <button
              type="button"
              className="sd-btn-cancel"
              onClick={() => setShowCancelModal(true)}
              style={{ padding: '10px 16px', width: 'auto' }}
            >
              <XCircle size={16} /> Cancel stay
            </button>
          )}
          {canAccessPayments && hasCollectDue(due) && (
            <button type="button" className="btn-primary" onClick={() => navigate(`/gh/payments/new?stay=${stay.id}`)}>
              <CreditCard size={16} /> Collect payment
            </button>
          )}
        </div>
      </div>

      <StatusTrack status={stay.status} />

      {isCancelled && (
        <div
          className="premium-card"
          style={{
            padding: '20px 22px',
            marginBottom: '20px',
            borderColor: '#fecaca',
            background: '#fef2f2',
          }}
        >
          <p style={{ fontWeight: '800', color: '#991b1b', marginBottom: '8px' }}>This stay has been cancelled</p>
          {stay.cancelled_at && (
            <p style={{ fontSize: '13px', color: '#7f1d1d', marginBottom: '6px' }}>
              Cancelled on: {new Date(stay.cancelled_at).toLocaleString()}
            </p>
          )}
          {stay.cancellation_reason && (
            <p style={{ fontSize: '14px', color: '#7f1d1d', margin: 0 }}>
              Reason: {stay.cancellation_reason}
            </p>
          )}
        </div>
      )}

      <div className="sd-kpi-row">
        {[
          { label: 'Check-in', value: formatDateShort(stay.check_in), icon: LogIn },
          { label: 'Check-out', value: formatDateShort(stay.check_out), icon: LogOut },
          { label: 'Nights / Guests', value: `${stay.nights}N · ${stay.guests_count} guest${stay.guests_count !== 1 ? 's' : ''}`, icon: Users },
          { label: 'Rate / night', value: formatRs(stay.price_per_night), icon: Wallet },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="sd-kpi">
            <p className="sd-kpi__label"><Icon size={12} /> {label}</p>
            <p className="sd-kpi__value">{value}</p>
          </div>
        ))}
      </div>

      <div className="booking-layout">
        <div>
          <div className="premium-card sd-section" style={{ padding: '22px' }}>
            <h3 className="sd-section-title"><User size={18} /> Guest & room</h3>
            <div className="sd-room-badge">
              <span className="sd-room-badge__num">{stay.room_number}</span>
              <div>
                <p style={{ fontWeight: 800, margin: '0 0 2px 0', color: 'var(--secondary)' }}>{stay.room_type || 'Standard room'}</p>
                <p className="sd-room-badge__meta">{formatRs(stay.price_per_night)} / night</p>
              </div>
            </div>
            <div className="sd-grid-2">
              <div>
                <p className="sd-field__label">Guest name</p>
                <p className="sd-field__value">{stay.customer_name}</p>
              </div>
              <div>
                <p className="sd-field__label">Phone</p>
                <p className="sd-field__value">{stay.customer_phone || '-'}</p>
              </div>
            </div>
            <Link to={`/gh/customers/${stay.customer}`} className="sd-link">
              View customer profile →
            </Link>
          </div>

          <div className="premium-card sd-section" style={{ padding: '22px' }}>
            <h3 className="sd-section-title"><Calendar size={18} /> Stay period</h3>
            <div className="sd-date-row">
              <div className="sd-date-box sd-date-box--in">
                <p className="sd-date-box__tag">Check-in</p>
                <p className="sd-date-box__val">{formatDate(stay.check_in)}</p>
              </div>
              <div className="sd-date-mid">{stay.nights}N</div>
              <div className="sd-date-box">
                <p className="sd-date-box__tag">Check-out</p>
                <p className="sd-date-box__val">{formatDate(stay.check_out)}</p>
              </div>
            </div>
            {stay.notes && <div className="sd-notes">{stay.notes}</div>}
          </div>

          {canAccessPayments && (
            <div className="premium-card sd-section" style={{ padding: '22px' }}>
              <h3 className="sd-section-title"><Wallet size={18} /> Payment history</h3>
              {payments.length === 0 ? (
                <div className="sd-empty">
                  <CreditCard size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ margin: '0 0 12px 0', fontWeight: 600 }}>No payments yet</p>
                  {hasCollectDue(due) && (
                    <button type="button" className="btn-primary" onClick={() => navigate(`/gh/payments/new?stay=${stay.id}`)}>
                      Record payment
                    </button>
                  )}
                </div>
              ) : (
                <div className="sd-pay-row">
                  {payments.map((p) => {
                    const isRefund = Number(p.amount) < 0 || (p.notes || '').includes('Refund');
                    const isAdvance = (p.notes || '').includes('Initial advance');
                    return (
                      <div key={p.id} className={`sd-pay-card${isRefund ? ' sd-pay-card--refund' : ''}`}>
                        <div className="sd-pay-card__top">
                          <div style={{ minWidth: 0 }}>
                            <p className="sd-pay-card__amt" style={{ color: isRefund ? '#b91c1c' : '#166534' }}>
                              {formatRs(p.amount)}
                              {isRefund && <span className="sd-tag sd-tag--refund">Refund</span>}
                              {isAdvance && <span className="sd-tag sd-tag--advance">Advance</span>}
                            </p>
                            <p className="sd-pay-card__meta">
                              {METHOD_LABELS[p.payment_method] || p.payment_method}
                              {p.payment_date && ` · ${new Date(p.payment_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`}
                            </p>
                            {p.notes && !isAdvance && !isRefund && (
                              <p className="sd-pay-card__meta">{p.notes}</p>
                            )}
                          </div>
                          <div className="sd-pay-card__actions">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => navigate(`/gh/print/payment/${p.id}`)}
                              style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              <Printer size={14} /> Receipt
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Link to="/gh/payments" className="sd-link">All payments →</Link>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="premium-card sd-bill">
            <div className="sd-bill__total">
              <p className="sd-bill__total-label">Total amount</p>
              <p className="sd-bill__total-amt">{formatRs(total)}</p>
            </div>
            <div className="sd-bill__body">
              {stay.billing_breakdown && (
                <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Room ({stay.billing_breakdown.nights} night{stay.billing_breakdown.nights !== 1 ? 's' : ''})
                    </span>
                    <span style={{ fontWeight: 700 }}>{formatRs(stay.billing_breakdown.room_base)}</span>
                  </div>
                  {stay.billing_breakdown.extra_guests > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Extra guests ({stay.billing_breakdown.extra_guests})
                      </span>
                      <span style={{ fontWeight: 700 }}>{formatRs(stay.billing_breakdown.extra_guest_total)}</span>
                    </div>
                  )}
                  {(stay.billing_breakdown.service_charges || []).map((line) => (
                    <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{line.description}</span>
                      <span style={{ fontWeight: 700 }}>{formatRs(line.amount)}</span>
                    </div>
                  ))}
                  {(stay.billing_breakdown.custom_charges || []).map((line) => (
                    <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{line.description}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700 }}>{formatRs(line.amount)}</span>
                        {canAddCharges && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCharge(line.id)}
                            style={{ border: 'none', background: 'transparent', color: '#b91c1c', cursor: 'pointer', padding: 2 }}
                            title="Remove charge"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {canAddCharges && (
                <form onSubmit={handleAddCharge} style={{ marginBottom: 16, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Add custom charge
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      type="text"
                      value={chargeDesc}
                      onChange={(e) => setChargeDesc(e.target.value)}
                      placeholder="e.g. Minibar, laundry, damage"
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        min="1"
                        value={chargeAmount}
                        onChange={(e) => setChargeAmount(e.target.value)}
                        placeholder="Amount (Rs)"
                        style={{ flex: 1 }}
                      />
                      <button type="submit" className="btn-secondary" disabled={addingCharge} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <Plus size={14} /> {addingCharge ? 'Adding…' : 'Add'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
              <div className="sd-bill__bar-wrap">
                <div className="sd-bill__bar-head">
                  <span style={{ color: 'var(--text-muted)' }}>Paid</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{paidPct}%</span>
                </div>
                <div className="sd-bill__bar">
                  <div
                    className="sd-bill__bar-fill"
                    style={{
                      width: `${paidPct}%`,
                      background: paidPct >= 100 ? '#22c55e' : 'var(--primary)',
                    }}
                  />
                </div>
              </div>
              <div className="sd-bill__line">
                <span style={{ color: 'var(--text-muted)' }}>Amount paid</span>
                <span style={{ fontWeight: 800, color: '#166534' }}>{formatRs(paid)}</span>
              </div>
              <div className={`sd-bill__due ${hasCollectDue(due) ? 'sd-bill__due--warn' : 'sd-bill__due--ok'}`}>
                <span>Balance due</span>
                <span>{formatCollectDuePKR(due)}</span>
              </div>
              {canAccessPayments && hasCollectDue(due) && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate(`/gh/payments/new?stay=${stay.id}`)}
                  style={{ width: '100%', marginTop: 16, padding: 13, borderRadius: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <CreditCard size={16} /> Record payment
                </button>
              )}
            </div>
          </div>

          {(canAct || showCancel) && (
            <div className="premium-card" style={{ padding: '20px 22px' }}>
              <h3 className="sd-section-title" style={{ marginBottom: 14 }}><Clock size={18} /> Actions</h3>
              <div className="sd-actions">
                {canAct && stay.status === 'PENDING' && (
                  <button type="button" className="btn-secondary" onClick={() => runAction(stayConfirm, 'Stay confirmed')}>
                    <CheckCircle size={16} /> Confirm booking
                  </button>
                )}
                {canAct && ['CONFIRMED', 'PENDING'].includes(stay.status) && (
                  <button type="button" className="btn-primary" onClick={handleCheckIn}>
                    <LogIn size={16} /> Check in
                  </button>
                )}
                {canAct && stay.status === 'CHECKED_IN' && (
                  <button type="button" className="btn-primary" onClick={handleCheckOut}>
                    <LogOut size={16} /> Check out
                  </button>
                )}
                {showCancel && (
                  <button type="button" className="sd-btn-cancel" onClick={() => setShowCancelModal(true)}>
                    <XCircle size={16} /> Cancel stay booking
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {canAccessPayments && hasCollectDue(due) && (
        <div className="sd-mobile-bar">
          <button type="button" className="btn-primary" onClick={() => navigate(`/gh/payments/new?stay=${stay.id}`)}>
            <CreditCard size={18} /> Collect {formatCollectDuePKR(due)}
          </button>
        </div>
      )}

      <CancelStayModal
        stay={stay}
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onCancelled={load}
      />
    </div>
  );
}
