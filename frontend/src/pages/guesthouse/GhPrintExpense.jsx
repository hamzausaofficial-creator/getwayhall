import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGhExpense } from '../../api/guesthouse';
import { formatRs } from '../../utils/currency';
import GhPrintShell, { GhPrintHeader, GhPrintFooter } from '../../components/guesthouse/GhPrintShell';
import AppLoader from '../../components/AppLoader';

const CATEGORY_LABELS = {
  SALARY: 'Salary',
  UTILITIES: 'Utilities',
  MAINTENANCE: 'Maintenance',
  SUPPLIES: 'Supplies',
  LAUNDRY: 'Laundry',
  MARKETING: 'Marketing',
  OTHER: 'Other',
};

export default function GhPrintExpense() {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);

  useEffect(() => {
    getGhExpense(expenseId)
      .then(setExpense)
      .catch(() => navigate('/gh/expenses'));
  }, [expenseId, navigate]);

  if (!expense) {
    return <AppLoader fullScreen message="Loading voucher…" />;
  }

  const voucherId = `EXP-${String(expense.id).padStart(5, '0')}`;

  return (
    <GhPrintShell title="Expense voucher" subtitle={voucherId} backTo="/gh/expenses">
      <GhPrintHeader docType="Payment voucher / expense receipt" />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Voucher no.</p>
          <p style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'monospace', margin: 0 }}>{voucherId}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Date</p>
          <p style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{expense.expense_date}</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '20px', background: '#fef2f2', borderRadius: '12px', border: '1px dashed #fecaca', marginBottom: '28px' }}>
        <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Amount paid</p>
        <p style={{ margin: 0, fontSize: '36px', fontWeight: '900', color: '#ef4444' }}>{formatRs(expense.amount)}</p>
      </div>

      <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse' }}>
        <tbody>
          {[
            ['Title', expense.title],
            ['Category', CATEGORY_LABELS[expense.category] || expense.category],
            ['Recorded by', expense.created_by_name || '-'],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ padding: '10px 0', color: '#64748b', width: '38%', fontSize: '13px' }}>{label}</td>
              <td style={{ padding: '10px 0', fontWeight: '600', fontSize: '14px' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {expense.description && (
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', marginBottom: '24px', fontSize: '13px' }}>
          <strong>Description:</strong> {expense.description}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px', fontSize: '11px' }}>
        <div style={{ width: '42%', textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #94a3b8', height: '48px', marginBottom: '6px' }} />
          <p style={{ margin: 0, color: '#64748b' }}>Paid to (signature)</p>
        </div>
        <div style={{ width: '42%', textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #94a3b8', height: '48px', marginBottom: '6px' }} />
          <p style={{ margin: 0, color: '#64748b' }}>Authorized by</p>
        </div>
      </div>

      <GhPrintFooter />
    </GhPrintShell>
  );
}
