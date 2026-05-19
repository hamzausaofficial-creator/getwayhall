import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Receipt, 
  ArrowUpRight,
  ChevronRight,
  Trash2,
  X,
  Printer,
  DollarSign,
  Briefcase,
  FileText,
  Percent,
  Activity,
  Layers
} from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';

// 12 Marriage Hall Standard Account Titles & Categories Mapping
const ACCOUNT_TITLES = [
  { id: 'CAPITAL_AC', label: 'Capital A/C', category: 'OTHER', desc: 'Owner equity, investment capital, initial funds.' },
  { id: 'CASH_AC', label: 'Cash A/C', category: 'OTHER', desc: 'Cash assets, direct office draw, liquid currency.' },
  { id: 'ABC_VENDOR', label: 'ABC Vendor', category: 'OTHER', desc: 'Third party contractor payments & credit settlements.' },
  { id: 'CLOTH_TABLE_CHAIRS', label: 'Cloth, Table & Chairs', category: 'MAINTENANCE', desc: 'Inventory purchases, repairs to seat linen and covers.' },
  { id: 'DECORATION_EXP', label: 'Decoration Exp', category: 'DECORATION', desc: 'Stage design, floral sets, premium lighting, backdrops.' },
  { id: 'DISCOUNT_RECEIVED', label: 'Discount Received', category: 'OTHER', desc: 'Deductions & savings obtained from suppliers/contractors.' },
  { id: 'ELECTRIC_BILL_HALL', label: 'Electric Bill Hall', category: 'UTILITIES', desc: 'Grid electrical bill, commercial meter charges.' },
  { id: 'FBR_TAX', label: 'FBR Tax Marriage Hall', category: 'OTHER', desc: 'Federal Board of Revenue tax returns & local commercial levies.' },
  { id: 'MAINTENANCE', label: 'Marriage Hall Maintenance', category: 'MAINTENANCE', desc: 'Building paints, ceiling works, sound systems, structural fixes.' },
  { id: 'GENERATOR_FUEL', label: 'Generator Fuel & Diesel', category: 'UTILITIES', desc: 'Diesel refills for heavy standby generators.' },
  { id: 'STAFF_SALARY', label: 'Staff Salary', category: 'SALARY', desc: 'Monthly payments to managers, security, cleaners, & waiters.' },
  { id: 'CATERING_KITCHEN', label: 'Catering & Kitchen Exp', category: 'CATERING', desc: 'Food items, LPG gas cylinder refills, chef daily wages.' }
];

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Voucher Printing states
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    accountTitleId: 'ELECTRIC_BILL_HALL', // Selector
    title: '', // Specific reason
    payeeName: 'ABC Vendor', // Vendor Name
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await client.get('/finance/expenses/');
      setExpenses(response.data.results || response.data || []);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Format Helper for display
  const getAccountTitleLabel = (expense) => {
    // If the description contains our structured account tag, parse it
    if (expense.description && expense.description.includes('[Account Title:')) {
      const match = expense.description.match(/\[Account Title: (.*?)\]/);
      if (match && match[1]) {
        const found = ACCOUNT_TITLES.find(at => at.id === match[1]);
        return found ? found.label : match[1];
      }
    }
    // Fallback based on category
    const map = {
      'SALARY': 'Staff Salary',
      'UTILITIES': 'Electric Bill Hall',
      'DECORATION': 'Decoration Exp',
      'MAINTENANCE': 'Marriage Hall Maintenance',
      'CATERING': 'Catering & Kitchen Exp',
      'OTHER': 'Other Miscellaneous Expenses'
    };
    return map[expense.category] || 'Other Miscellaneous Expenses';
  };

  const getPayeeName = (expense) => {
    if (expense.description && expense.description.includes('[Payee:')) {
      const match = expense.description.match(/\[Payee: (.*?)\]/);
      if (match && match[1]) return match[1];
    }
    return 'ABC Vendor';
  };

  const getNotesOnly = (expense) => {
    if (!expense.description) return '';
    // Strip our structured tags
    return expense.description
      .replace(/\[Account Title: .*?\]/, '')
      .replace(/\[Payee: .*?\]/, '')
      .trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedAccount = ACCOUNT_TITLES.find(at => at.id === formData.accountTitleId);
      
      // Inject Account Title and Payee into the description safely to bypass django schema limits
      const structuredDesc = `[Account Title: ${selectedAccount.id}] [Payee: ${formData.payeeName}] ${formData.description}`;
      
      const payload = {
        title: formData.title || selectedAccount.label.split(' (')[0],
        category: selectedAccount.category,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        description: structuredDesc
      };

      await client.post('/finance/expenses/', payload);
      toast.success('Payment voucher recorded successfully!');
      setShowModal(false);
      
      // Reset
      setFormData({
        accountTitleId: 'ELECTRIC_BILL_HALL',
        title: '',
        payeeName: 'ABC Vendor',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: ''
      });

      fetchExpenses();
    } catch (err) {
      toast.error('Failed to record expense. Check input values.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel and delete this payment receipt voucher?')) {
      try {
        await client.delete(`/finance/expenses/${id}/`);
        toast.success('Voucher deleted from accounts');
        fetchExpenses();
      } catch (err) {
        toast.error('Failed to delete voucher');
      }
    }
  };

  // View Voucher click handler
  const handleOpenVoucher = (expense) => {
    setSelectedVoucher(expense);
    setShowVoucherModal(true);
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  // Realtime search filter
  const filteredExpenses = expenses.filter(exp => {
    const q = searchQuery.toLowerCase();
    const title = (exp.title || '').toLowerCase();
    const desc = (exp.description || '').toLowerCase();
    const category = (exp.category || '').toLowerCase();
    const accountLabel = getAccountTitleLabel(exp).toLowerCase();
    const payee = getPayeeName(exp).toLowerCase();
    return (
      title.includes(q) ||
      desc.includes(q) ||
      category.includes(q) ||
      accountLabel.includes(q) ||
      payee.includes(q)
    );
  });

  // Analytics totals
  const totalExpense = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const electricTotal = expenses.reduce((sum, exp) => {
    return sum + (exp.description?.includes('ELECTRIC_BILL_HALL') || exp.category === 'UTILITIES' ? parseFloat(exp.amount) : 0);
  }, 0);
  const taxTotal = expenses.reduce((sum, exp) => {
    return sum + (exp.description?.includes('FBR_TAX') ? parseFloat(exp.amount) : 0);
  }, 0);
  const maintTotal = expenses.reduce((sum, exp) => {
    return sum + (exp.category === 'MAINTENANCE' ? parseFloat(exp.amount) : 0);
  }, 0);

  return (
    <>
    <div className="animate-fade-in print-hide">
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--secondary)' }}>
            Payment Receipts & Vouchers
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>
            Manage official cash accounts, utility bills, capital draws, decoration, FBR tax, and vendor payments.
          </p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => setShowModal(true)} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600' }}
        >
          <Plus size={18} /> Add Payment Receipt
        </button>
      </div>

      {/* Analytics widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--primary-light)', borderRadius: '12px', color: 'var(--primary)' }}>
              <DollarSign size={24} />
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Total Expenses</p>
            <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px' }}>
              <span style={{ fontSize: '55%', fontWeight: '600', opacity: 0.6 }}>Rs</span> {totalExpense.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--primary-light)', borderRadius: '12px', color: 'var(--primary)' }}>
              <Activity size={24} />
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Utilities & Fuel</p>
            <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px' }}>
              <span style={{ fontSize: '55%', fontWeight: '600', opacity: 0.6 }}>Rs</span> {electricTotal.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--primary-light)', borderRadius: '12px', color: 'var(--primary)' }}>
              <Percent size={24} />
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>FBR Tax Paid</p>
            <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px' }}>
              <span style={{ fontSize: '55%', fontWeight: '600', opacity: 0.6 }}>Rs</span> {taxTotal.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--primary-light)', borderRadius: '12px', color: 'var(--primary)' }}>
              <Briefcase size={24} />
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Maintenance</p>
            <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px' }}>
              <span style={{ fontSize: '55%', fontWeight: '600', opacity: 0.6 }}>Rs</span> {maintTotal.toLocaleString()}
            </h3>
          </div>
        </div>

      </div>

      {/* Realtime Search & Filtration */}
      <div className="card" style={{ marginBottom: '32px', padding: '16px 24px', display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search payment receipts by reason, vendor name (ABC Vendor), account title, category or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '44px', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px' }}
          />
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Voucher / Reason</th>
              <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Account Title</th>
              <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Payee Vendor</th>
              <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Date</th>
              <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Amount</th>
              <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense) => (
              <tr key={expense.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }} className="hover:bg-slate-50/50">
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                      <Receipt size={16} />
                    </div>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '14px', color: 'var(--secondary)' }}>{expense.title}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{getNotesOnly(expense) || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '20px', fontWeight: '700', backgroundColor: '#e2e8f0', color: '#475569', display: 'inline-block' }}>
                    {getAccountTitleLabel(expense)}
                  </span>
                </td>
                <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: '600', color: 'var(--secondary)' }}>
                  {getPayeeName(expense)}
                </td>
                <td style={{ padding: '20px 24px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarIcon size={14} color="var(--text-muted)" />
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </div>
                </td>
                <td style={{ padding: '20px 24px', fontWeight: '800', fontSize: '15px', color: '#ef4444' }}>
                  -<span style={{ fontSize: '80%', opacity: 0.6, marginRight: '2px' }}>PKR</span> 
                  {parseFloat(expense.amount).toLocaleString()}
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleOpenVoucher(expense)} 
                      style={{ color: 'var(--primary)', backgroundColor: 'transparent', padding: '6px', borderRadius: '6px' }} 
                      className="hover:bg-orange-50"
                      title="View Official Voucher & Print"
                    >
                      <Printer size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(expense.id)} 
                      style={{ color: '#ef4444', backgroundColor: 'transparent', padding: '6px', borderRadius: '6px' }} 
                      className="hover:bg-red-50"
                      title="Delete Voucher"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredExpenses.length === 0 && !isLoading && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Receipt size={36} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            <p style={{ fontSize: '15px', fontWeight: '500' }}>No payment vouchers matching your criteria.</p>
          </div>
        )}
      </div>

    </div>

    {/* NEW VOUCHER MODAL */}
    {showModal && (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '580px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Receipt size={22} color="var(--primary)" />
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--secondary)' }}>Record Payment Receipt</h3>
            </div>
            <button onClick={() => setShowModal(false)} style={{ backgroundColor: 'transparent', color: 'var(--text-muted)' }}>
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            {/* Account Title Selector */}
            <div className="input-group">
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                Account Title
              </label>
              <select 
                value={formData.accountTitleId} 
                onChange={(e) => setFormData({...formData, accountTitleId: e.target.value})}
                style={{ width: '100%', height: '48px', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '0 16px', fontSize: '14px', fontWeight: '600' }}
              >
                {ACCOUNT_TITLES.map(at => (
                  <option key={at.id} value={at.id}>{at.label}</option>
                ))}
              </select>
            </div>

            {/* Title / specific reason */}
            <div className="input-group">
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Voucher Reason / Specific Title</label>
              <input 
                type="text"
                required 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Electric bill May 2026, Tables maintenance, diesel refill..." 
                style={{ width: '100%', height: '48px', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '0 16px', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Payee / vendor */}
              <div className="input-group">
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Vendor / Payee Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.payeeName} 
                  onChange={(e) => setFormData({...formData, payeeName: e.target.value})} 
                  placeholder="e.g. ABC Vendor, FBR Office, Cashier" 
                  style={{ width: '100%', height: '48px', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '0 16px', fontSize: '14px' }}
                />
              </div>

              {/* Amount */}
              <div className="input-group">
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Amount Paid (PKR)</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  value={formData.amount} 
                  onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                  placeholder="0.00" 
                  style={{ width: '100%', height: '48px', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '0 16px', fontSize: '14px', fontWeight: '700' }}
                />
              </div>
            </div>

            {/* Date */}
            <div className="input-group">
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Voucher Date</label>
              <input 
                type="date" 
                required 
                value={formData.expense_date} 
                onChange={(e) => setFormData({...formData, expense_date: e.target.value})} 
                style={{ width: '100%', height: '48px', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '0 16px', fontSize: '14px' }}
              />
            </div>

            {/* Notes */}
            <div className="input-group">
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Voucher Remarks / Notes</label>
              <textarea 
                rows="2" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="Write any additional observations or comments regarding this transaction..."
                style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', resize: 'none' }} 
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(255, 107, 44, 0.2)' }}
            >
              <FileText size={18} /> Confirm & Print Voucher
            </button>
          </form>

        </div>
      </div>
    )}

    {/* VOUCHER RECEIPT MODAL FOR OFFICIAL PRINTING */}
    {showVoucherModal && selectedVoucher && (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(6px)' }} className="print-overlay">
        
        <div className="card" style={{ width: '92%', maxWidth: '560px', padding: '20px', backgroundColor: 'white', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }} id="printable-voucher-card">
          
          {/* Header Close/Print inside web view */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }} className="print-hide">
            <h4 style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>Payment Voucher Preview</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handlePrintVoucher} 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                <Printer size={14} /> Print
              </button>
              <button 
                onClick={() => { setShowVoucherModal(false); setSelectedVoucher(null); }} 
                style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>

          {/* PRINT VOUCHER SHEET (Professional Letterhead layout) */}
          <div style={{ border: '2px solid #000', padding: '16px', fontFamily: '"Courier New", Courier, monospace', color: '#000', backgroundColor: '#fff' }}>
            
            {/* Header Letterhead */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px double #000', paddingBottom: '10px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '900', margin: '0', letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
                  Gateway Marriage Hall
                </h2>
                <p style={{ fontSize: '9px', margin: '2px 0 0 0', fontWeight: '600' }}>GT Road, Lahore | Tel: +92-42-111-222-333</p>
                <p style={{ fontSize: '9px', margin: '1px 0 0 0', fontWeight: '600' }}>Official Accounts Ledger</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ border: '1.5px solid #000', padding: '4px 8px', margin: '0', fontSize: '11px', fontWeight: '800', backgroundColor: '#f1f5f9' }}>
                  PAYMENT VOUCHER
                </h3>
                <p style={{ fontSize: '10px', margin: '4px 0 0 0', fontWeight: '700' }}>
                  No: <span style={{ textDecoration: 'underline' }}>PV-{selectedVoucher.id}</span>
                </p>
              </div>
            </div>

            {/* Voucher Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '12px 0', fontSize: '11px', fontWeight: '700' }}>
              <div>
                <p style={{ margin: '0 0 6px 0' }}>Debit Account: <span style={{ textDecoration: 'underline' }}>{getAccountTitleLabel(selectedVoucher)}</span></p>
                <p style={{ margin: '0' }}>Payment Date: <span style={{ textDecoration: 'underline' }}>{new Date(selectedVoucher.expense_date).toLocaleDateString()}</span></p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 6px 0' }}>Payee Vendor: <span style={{ textDecoration: 'underline' }}>{getPayeeName(selectedVoucher)}</span></p>
                <p style={{ margin: '0' }}>Status: <span style={{ textDecoration: 'underline', color: 'green' }}>PAID (Cash)</span></p>
              </div>
            </div>

            {/* Voucher Item Details Grid */}
            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '12px 0', border: '1px solid #000' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '2.5px solid #000' }}>
                  <th style={{ border: '1px solid #000', padding: '6px', fontSize: '10px', textAlign: 'left' }}>ACCOUNT HEAD</th>
                  <th style={{ border: '1px solid #000', padding: '6px', fontSize: '10px', textAlign: 'left' }}>REASON / DESCRIPTION</th>
                  <th style={{ border: '1px solid #000', padding: '6px', fontSize: '10px', textAlign: 'right', width: '110px' }}>AMOUNT (PKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px 6px', fontSize: '11px', fontWeight: '700' }}>
                    {getAccountTitleLabel(selectedVoucher)}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px 6px', fontSize: '10px' }}>
                    <p style={{ fontWeight: '700', margin: '0 0 2px 0' }}>{selectedVoucher.title}</p>
                    <p style={{ margin: '0', fontSize: '9px', color: '#333' }}>{getNotesOnly(selectedVoucher) || 'No supplementary notes.'}</p>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px 6px', fontSize: '11px', fontWeight: '900', textAlign: 'right' }}>
                    Rs {parseFloat(selectedVoucher.amount).toLocaleString()}
                  </td>
                </tr>
                
                {/* Total row */}
                <tr style={{ borderTop: '2px solid #000', fontWeight: '900' }}>
                  <td colSpan="2" style={{ border: '1px solid #000', padding: '8px 6px', fontSize: '11px', textAlign: 'right' }}>GRAND TOTAL</td>
                  <td style={{ border: '1px solid #000', padding: '8px 6px', fontSize: '11px', textAlign: 'right', backgroundColor: '#f9f9f9' }}>
                    Rs {parseFloat(selectedVoucher.amount).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* In Words */}
            <div style={{ border: '1px dashed #000', padding: '8px 10px', margin: '12px 0', fontSize: '10px', fontWeight: '700' }}>
              Amount in words: <span style={{ textTransform: 'uppercase', fontStyle: 'italic' }}>
                PKR {parseFloat(selectedVoucher.amount).toLocaleString()} Rupees Only.
              </span>
            </div>

            {/* Signatures Block */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '30px', textAlign: 'center', fontSize: '9px', fontWeight: '700' }}>
              <div>
                <div style={{ borderBottom: '1.5px solid #000', margin: '0 auto 10px auto', width: '90%', height: '20px' }}></div>
                <p style={{ margin: '0' }}>PREPARED BY</p>
                <p style={{ margin: '2px 0 0 0', opacity: 0.7 }}>Accounts Clerk</p>
              </div>
              <div>
                <div style={{ borderBottom: '1.5px solid #000', margin: '0 auto 10px auto', width: '90%', height: '20px' }}></div>
                <p style={{ margin: '0' }}>CHECKED BY</p>
                <p style={{ margin: '2px 0 0 0', opacity: 0.7 }}>Internal Auditor</p>
              </div>
              <div>
                <div style={{ borderBottom: '1.5px solid #000', margin: '0 auto 10px auto', width: '90%', height: '20px' }}></div>
                <p style={{ margin: '0' }}>APPROVED BY</p>
                <p style={{ margin: '2px 0 0 0', opacity: 0.7 }}>General Manager</p>
              </div>
              <div>
                <div style={{ borderBottom: '1.5px solid #000', margin: '0 auto 10px auto', width: '90%', height: '20px' }}></div>
                <p style={{ margin: '0' }}>RECEIVED BY</p>
                <p style={{ margin: '2px 0 0 0', opacity: 0.7 }}>Payee Signature</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    )}

    {/* PRINT-ONLY CSS INJECTION */}
    <style dangerouslySetInnerHTML={{__html: `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-voucher-card, #printable-voucher-card * {
          visibility: visible;
        }
        #printable-voucher-card {
          position: absolute;
          left: 0;
          top: 0;
          width: 100% !important;
          max-width: 100% !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .print-hide {
          display: none !important;
        }
        .print-overlay {
          background-color: white !important;
          backdrop-filter: none !important;
        }
      }
    `}} />

    </>
  );
};

export default Expenses;
