import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, FileText, CheckCircle, X, HelpCircle, Copy } from 'lucide-react';
import { createGhExpense, updateGhExpense, getGhExpense, listGhExpenses } from '../../api/guesthouse';
import toast from 'react-hot-toast';
import AppLoader from '../../components/AppLoader';
import { usePermissions } from '../../hooks/usePermissions';
import { formatRs } from '../../utils/currency';
import {
  GH_VOUCHER_TEMPLATES,
  getGhTemplateById,
  templateToForm,
  expenseToReuseForm,
} from '../../utils/ghExpenseHelpers';

const CATEGORIES = [
  { value: 'SALARY', label: 'Salary' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SUPPLIES', label: 'Supplies' },
  { value: 'LAUNDRY', label: 'Laundry' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OTHER', label: 'Other' },
];

const emptyForm = {
  title: '',
  category: 'OTHER',
  amount: '',
  expense_date: new Date().toISOString().split('T')[0],
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

export default function ExpenseFormPage() {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canManage } = usePermissions();
  const isEdit = Boolean(expenseId);

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [recentVouchers, setRecentVouchers] = useState([]);
  const [reuseSource, setReuseSource] = useState(null);

  useEffect(() => {
    if (!canManage) {
      toast.error('You do not have permission to manage expenses.');
      navigate('/gh/expenses');
    }
  }, [canManage, navigate]);

  const applyTemplate = (template, sourceLabel = null) => {
    const next = templateToForm(template);
    if (next) {
      setForm(next);
      setReuseSource(sourceLabel);
      toast.success(sourceLabel ? `Loaded: ${sourceLabel}` : 'Template applied');
    }
  };

  const applyReuseExpense = (expense) => {
    setForm(expenseToReuseForm(expense));
    setReuseSource(expense.title);
    toast.success(`Reusing voucher: ${expense.title}`);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isEdit && expenseId) {
          const exp = await getGhExpense(expenseId);
          setForm({
            title: exp.title || '',
            category: exp.category || 'OTHER',
            amount: String(exp.amount ?? ''),
            expense_date: exp.expense_date,
            description: exp.description || '',
          });
        } else {
          try {
            const list = await listGhExpenses();
            setRecentVouchers((list || []).slice(0, 8));
          } catch {
            setRecentVouchers([]);
          }
          const fromId = searchParams.get('from');
          const templateId = searchParams.get('template');
          if (fromId) {
            try {
              const exp = await getGhExpense(fromId);
              applyReuseExpense(exp);
            } catch {
              toast.error('Could not load voucher to reuse');
            }
          } else if (templateId) {
            const tpl = getGhTemplateById(templateId);
            if (tpl) applyTemplate(tpl, tpl.label);
          }
        }
      } catch {
        toast.error('Expense not found');
        navigate('/gh/expenses');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEdit, expenseId, navigate, searchParams]);

  const categoryLabel = CATEGORIES.find((c) => c.value === form.category)?.label || form.category;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim() || Number(form.amount) <= 0) {
      setFormError('Enter a title and valid amount.');
      return;
    }
    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      category: form.category,
      amount: parseFloat(form.amount),
      expense_date: form.expense_date,
      description: form.description,
    };
    try {
      if (isEdit) {
        await updateGhExpense(expenseId, payload);
        toast.success('Expense updated');
        navigate('/gh/expenses');
      } else {
        const created = await createGhExpense(payload);
        toast.success('Voucher saved - opening print');
        navigate(`/gh/print/expense/${created.id}`);
      }
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Could not save expense';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <AppLoader message="Loading…" />;
  }

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '24px',
            marginBottom: '40px',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/gh/expenses')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: 'var(--secondary)' }}>
              {isEdit ? 'Edit expense voucher' : 'Record expense voucher'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Guest house operating cost - saved to reports automatically.
            </p>
          </div>
        </div>

        {formError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#b91c1c', fontWeight: '600', marginBottom: '32px' }}>
            {formError}
          </div>
        )}

        <div className="booking-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {!isEdit && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sectionTitle('Use a voucher template')}
                <div className="premium-card" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
                    Pick a common expense type or reuse a voucher you created before.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: recentVouchers.length ? '16px' : 0 }}>
                    {GH_VOUCHER_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        className="btn-secondary"
                        onClick={() => applyTemplate(tpl, tpl.label)}
                        style={{ fontSize: '12px', padding: '8px 14px', fontWeight: '600' }}
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                  {recentVouchers.length > 0 && (
                    <>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Recent vouchers - use again
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recentVouchers.map((exp) => (
                          <button
                            key={exp.id}
                            type="button"
                            onClick={() => applyReuseExpense(exp)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: '1px solid var(--border)',
                              background: 'var(--surface)',
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                          >
                            <span style={{ minWidth: 0 }}>
                              <span style={{ fontWeight: '700', fontSize: '14px', display: 'block' }}>{exp.title}</span>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {exp.expense_date} · {formatRs(exp.amount)}
                              </span>
                            </span>
                            <Copy size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {reuseSource && (
                    <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700', margin: '14px 0 0 0' }}>
                      Loaded from: {reuseSource} - enter amount and save
                    </p>
                  )}
                </div>
              </section>
            )}

            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sectionTitle('Voucher details')}
              <div className="premium-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="input-group">
                  <label>Title / reason</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Electricity bill March, Staff salary…"
                  />
                </div>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label>Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: '100%' }}>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Expense date</label>
                    <input
                      type="date"
                      required
                      value={form.expense_date}
                      onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Amount (Rs)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="input-group">
                  <label>Description <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Vendor name, invoice number, notes…"
                    style={{ width: '100%', resize: 'vertical', minHeight: '88px' }}
                  />
                </div>
              </div>
            </section>
          </div>

          <div style={{ position: 'sticky', top: '100px' }}>
            <div className="premium-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <FileText size={22} color="var(--primary)" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Voucher preview</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>{categoryLabel}</p>
              <p style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0' }}>{form.title || '-'}</p>
              <p style={{ fontSize: '32px', fontWeight: '900', color: '#ef4444', margin: '0 0 8px 0' }}>
                {form.amount ? formatRs(form.amount) : '-'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Date: {form.expense_date}</p>

              <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', padding: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle size={18} />
                {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Save & print voucher'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate('/gh/expenses')} style={{ width: '100%', marginTop: '10px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <X size={16} /> Cancel
              </button>

              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <HelpCircle size={14} style={{ flexShrink: 0 }} />
                New vouchers open print preview after save. Edits return to the list.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
