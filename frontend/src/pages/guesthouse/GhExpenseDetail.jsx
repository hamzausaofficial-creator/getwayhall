import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Calendar, Printer, Edit2, Trash2, Copy, Briefcase,
} from 'lucide-react';
import { getGhExpense, deleteGhExpense } from '../../api/guesthouse';
import toast from 'react-hot-toast';
import AppLoader from '../../components/AppLoader';
import { usePermissions } from '../../hooks/usePermissions';
import { formatRs } from '../../utils/currency';
import { GH_CATEGORY_LABELS, voucherDisplayId } from '../../utils/ghExpenseHelpers';

const CATEGORY_STYLE = {
  SALARY: { bg: '#dbeafe', color: '#1e40af' },
  UTILITIES: { bg: '#fef3c7', color: '#92400e' },
  MAINTENANCE: { bg: '#f3e8ff', color: '#6b21a8' },
  SUPPLIES: { bg: '#e0f2fe', color: '#0369a1' },
  LAUNDRY: { bg: '#fce7f3', color: '#9d174d' },
  MARKETING: { bg: '#dcfce7', color: '#166534' },
  OTHER: { bg: '#f1f5f9', color: '#475569' },
};

export default function GhExpenseDetail() {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const { canManage } = usePermissions();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setExpense(await getGhExpense(expenseId));
      } catch {
        toast.error('Voucher not found');
        navigate('/gh/expenses');
      } finally {
        setLoading(false);
      }
    };
    if (expenseId) load();
  }, [expenseId, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this expense voucher?')) return;
    try {
      await deleteGhExpense(expenseId);
      toast.success('Voucher deleted');
      navigate('/gh/expenses');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleUseAgain = () => {
    navigate(`/gh/expenses/new?from=${expenseId}`);
  };

  if (loading) {
    return <AppLoader message="Loading voucher…" />;
  }

  if (!expense) return null;

  const voucherId = voucherDisplayId(expense.id);
  const catStyle = CATEGORY_STYLE[expense.category] || CATEGORY_STYLE.OTHER;
  const categoryLabel = GH_CATEGORY_LABELS[expense.category] || expense.category;

  return (
    <div className="animate-fade-in">
      <button
        type="button"
        onClick={() => navigate('/gh/expenses')}
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
        <ArrowLeft size={18} /> Back to vouchers
      </button>

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', fontFamily: 'monospace', marginBottom: '6px' }}>
            {voucherId}
          </p>
          <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>{expense.title}</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Expense voucher - view, print, or use again for a new payment
          </p>
          <span
            style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              background: catStyle.bg,
              color: catStyle.color,
            }}
          >
            {categoryLabel}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/gh/print/expense/${expense.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={18} /> Print voucher
          </button>
          {canManage && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleUseAgain}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Copy size={18} /> Use again
            </button>
          )}
          {canManage && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(`/gh/expenses/${expense.id}/edit`)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Edit2 size={18} /> Edit
            </button>
          )}
          {canManage && (
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
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="premium-card" style={{ padding: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Amount paid
          </p>
          <p style={{ fontSize: '28px', fontWeight: '900', color: '#ef4444', margin: 0 }}>{formatRs(expense.amount)}</p>
        </div>
        <div className="premium-card" style={{ padding: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Voucher date
          </p>
          <p style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>{expense.expense_date}</p>
        </div>
        <div className="premium-card" style={{ padding: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Briefcase size={14} /> Category
          </p>
          <p style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{categoryLabel}</p>
        </div>
        <div className="premium-card" style={{ padding: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Recorded by
          </p>
          <p style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{expense.created_by_name || '-'}</p>
        </div>
      </div>

      {expense.description && (
        <div className="premium-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} /> Notes / vendor details
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{expense.description}</p>
        </div>
      )}

      <div className="premium-card" style={{ padding: '24px', textAlign: 'center' }}>
        <FileText size={40} style={{ opacity: 0.25, marginBottom: '12px' }} />
        <p style={{ fontWeight: '700', margin: '0 0 8px 0' }}>Need the same voucher again?</p>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
          Use again copies title and category - enter new amount and date.
        </p>
        {canManage && (
          <button type="button" className="btn-primary" onClick={handleUseAgain} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Copy size={16} /> Use this voucher again
          </button>
        )}
      </div>
    </div>
  );
}
