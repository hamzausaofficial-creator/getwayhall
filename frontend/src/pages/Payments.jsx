import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Printer,
  Calendar,
  CheckCircle,
  Clock,
  HelpCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';

const Payments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigateState = location.state;

  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [searchQuery, setSearchQuery] = useState(navigateState?.bookingEventName || '');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Add/Record payment state
  const [formData, setFormData] = useState({
    booking: navigateState?.preselectedBookingId ? String(navigateState.preselectedBookingId) : '',
    amount: '',
    payment_method: 'CASH',
    status: 'COMPLETED',
    notes: ''
  });

  // Selected Booking specs for real-time ledger preview in modal
  const [selectedBookingSpecs, setSelectedBookingSpecs] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [payRes, bookRes] = await Promise.all([
        client.get('/finance/payments/'),
        client.get('/bookings/')
      ]);
      setPayments(payRes.data.results || payRes.data || []);
      setBookings(bookRes.data.results || bookRes.data || []);
    } catch (err) {
      toast.error('Failed to load transaction ledgers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (navigateState?.autoOpenRecord && navigateState?.preselectedBookingId) {
      setShowModal(true);
    }
  }, [navigateState]);

  // Update selected booking specs when booking dropdown changes in modal
  useEffect(() => {
    if (formData.booking) {
      const selected = bookings.find(b => String(b.id) === String(formData.booking));
      if (selected) {
        // Calculate grand total including tax and extras
        const gents = Number(selected.gents_count || 0);
        const ladies = Number(selected.ladies_count || 0);
        const rate = Number(selected.rate_per_head || 0);
        const attendanceSubtotal = (gents + ladies) * rate;
        
        const extraCharges = (Number(selected.overtime_hours || 0) * 5000) + 
                             Number(selected.kitchen_charge || 0) + 
                             Number(selected.decoration_charge || 0) + 
                             Number(selected.generator_charge || 0);
        
        const subtotal = attendanceSubtotal + extraCharges;
        const grandTotal = subtotal * 1.05; // 5% Flat Tax
        const balancePaid = Number(selected.advance_paid || 0);
        const remaining = Math.max(0, grandTotal - balancePaid);

        setSelectedBookingSpecs({
          grandTotal,
          balancePaid,
          remaining
        });

        // Set default input amount to remaining balance if empty
        setFormData(prev => ({
          ...prev,
          amount: prev.amount ? prev.amount : String(Math.round(remaining))
        }));
      }
    } else {
      setSelectedBookingSpecs(null);
    }
  }, [formData.booking, bookings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.booking) {
      toast.error('Please select an active booking');
      return;
    }
    if (Number(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await client.post('/finance/payments/', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success('Payment successfully captured!');
      setShowModal(false);
      
      // Reset form
      setFormData({
        booking: '',
        amount: '',
        payment_method: 'CASH',
        status: 'COMPLETED',
        notes: ''
      });
      setSelectedBookingSpecs(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to record payment');
    }
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete/void this transaction? The payment ledger will be reversed!')) {
      try {
        await client.delete(`/finance/payments/${paymentId}/`);
        toast.success('Transaction voided successfully');
        fetchData();
      } catch (err) {
        toast.error('Failed to void transaction');
      }
    }
  };

  const handlePrintSlip = (payment) => {
    setSelectedReceipt(payment);
    setShowReceiptModal(true);
  };

  const triggerThermalPrint = () => {
    const printContent = document.getElementById('thermal-receipt-view').innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Simple window overwrite print strategy
    document.body.innerHTML = `
      <html>
        <head>
          <title>Receipt_PAY-${selectedReceipt.id}</title>
          <style>
            @media print {
              body {
                font-family: 'Courier New', monospace;
                padding: 10px;
                color: black;
                background: white;
              }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent}
        </body>
      </html>
    `;
    
    window.print();
    // Restore page
    document.body.innerHTML = originalContent;
    window.location.reload(); // Quick reset state
  };

  // Financial aggregates
  const completedPayments = payments.filter(p => p.status === 'COMPLETED');
  const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const pendingRevenue = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  
  // Calculate total outstanding billing for context
  const totalBookingsValue = bookings.reduce((sum, b) => {
    const gents = Number(b.gents_count || 0);
    const ladies = Number(b.ladies_count || 0);
    const rate = Number(b.rate_per_head || 0);
    const subtotal = ((gents + ladies) * rate) + 
                     (Number(b.overtime_hours || 0) * 5000) + 
                     Number(b.kitchen_charge || 0) + 
                     Number(b.decoration_charge || 0) + 
                     Number(b.generator_charge || 0);
    return sum + (subtotal * 1.05);
  }, 0);

  const filteredPayments = payments.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const formattedId = `pay-${String(p.id).padStart(5, '0')}`;
    const matchesSearch = (p.booking_event_name || '').toLowerCase().includes(q) ||
                          (p.payment_method || '').toLowerCase().includes(q) ||
                          (p.transaction_id || '').toLowerCase().includes(q) ||
                          (p.notes || '').toLowerCase().includes(q) ||
                          String(p.id).toLowerCase().includes(q) ||
                          formattedId.includes(q);

    const matchesMethod = filterMethod === 'ALL' || p.payment_method === filterMethod;
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  return (
    <>
      <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
        {/* HEADER ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--secondary)' }}>
            Financial Ledger & Payments
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Monitor booking deposits, manual installments, and overall revenue metrics.
          </p>
        </div>
        
        <button 
          className="btn-primary" 
          onClick={() => setShowModal(true)} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <Plus size={18} /> Record New Deposit
        </button>
      </div>

      {/* METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.05em', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', backgroundColor: '#166534', borderRadius: '50%' }}></span>
            Net Completed Income
          </span>
          <h3 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--secondary)', margin: 0, letterSpacing: '-0.02em' }}>
            <span style={{ fontSize: '50%', fontWeight: '600', opacity: 0.6, marginRight: '4px' }}>PKR</span>
            {totalRevenue.toLocaleString()}
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Cleared bank deposits and cash reserves.</p>
        </div>

        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.05em', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', backgroundColor: '#b45309', borderRadius: '50%' }}></span>
            Pending Transactions
          </span>
          <h3 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--secondary)', margin: 0, letterSpacing: '-0.02em' }}>
            <span style={{ fontSize: '50%', fontWeight: '600', opacity: 0.6, marginRight: '4px' }}>PKR</span>
            {pendingRevenue.toLocaleString()}
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Cheques awaiting clearance or bank verification.</p>
        </div>

        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--primary)', borderRadius: '50%' }}></span>
            Contracted Bookings Volume
          </span>
          <h3 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--secondary)', margin: 0, letterSpacing: '-0.02em' }}>
            <span style={{ fontSize: '50%', fontWeight: '600', opacity: 0.6, marginRight: '4px' }}>PKR</span>
            {totalBookingsValue.toLocaleString()}
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Sum of all invoices booked in active pipeline.</p>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="card" style={{ 
        marginBottom: '32px', 
        padding: '20px 24px', 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'center', 
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Search */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search transactions by event name, transaction ID, or payment parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '44px', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px' }}
          />
        </div>
        
        {/* Method filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Method:</span>
          <select 
            value={filterMethod} 
            onChange={(e) => setFilterMethod(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontWeight: '600' }}
          >
            <option value="ALL">All Methods</option>
            <option value="CASH">Cash (نقد)</option>
            <option value="CARD">Card (کارڈ)</option>
            <option value="BANK_TRANSFER">Bank Transfer (بینک)</option>
            <option value="ONLINE">Online Transfer</option>
          </select>
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Status:</span>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontWeight: '600' }}
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {(searchQuery || filterMethod !== 'ALL' || filterStatus !== 'ALL') && (
          <button 
            className="btn-secondary" 
            onClick={() => {
              setSearchQuery('');
              setFilterMethod('ALL');
              setFilterStatus('ALL');
            }}
            style={{ padding: '10px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Transaction Reference</th>
              <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Linked Reservation</th>
              <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Payment Method</th>
              <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Amount</th>
              <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)', width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50">
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '800', color: 'var(--secondary)', fontFamily: 'monospace', fontSize: '13px' }}>
                      PAY-{String(payment.id).padStart(5, '0')}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={10} />
                      {new Date(payment.payment_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </td>
                
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                      {payment.booking_event_name || 'Manual Reservation'}
                    </span>
                    {payment.transaction_id && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        Ref: {payment.transaction_id}
                      </span>
                    )}
                  </div>
                </td>

                <td style={{ padding: '18px 24px' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    color: '#475569', 
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    padding: '4px 10px',
                    borderRadius: '20px'
                  }}>
                    {payment.payment_method === 'BANK_TRANSFER' ? '🏦 Bank Transfer' : 
                     payment.payment_method === 'CARD' ? '💳 Card Pay' : '💵 Cash in Hand'}
                  </span>
                </td>

                <td style={{ padding: '18px 24px' }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '11px', 
                    fontWeight: '800',
                    backgroundColor: payment.status === 'COMPLETED' ? '#dcfce7' : 
                                     payment.status === 'PENDING' ? '#fef3c7' : '#fee2e2',
                    color: payment.status === 'COMPLETED' ? '#166534' : 
                           payment.status === 'PENDING' ? '#b45309' : '#991b1b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {payment.status === 'COMPLETED' && <CheckCircle size={10} />}
                    {payment.status === 'PENDING' && <Clock size={10} />}
                    {payment.status}
                  </span>
                </td>

                <td style={{ padding: '18px 24px', fontWeight: '800', fontSize: '14px', color: payment.status === 'COMPLETED' ? '#166534' : '#475569' }}>
                  +<span style={{ fontSize: '80%', opacity: 0.6, marginRight: '2px' }}>PKR</span> 
                  {parseFloat(payment.amount).toLocaleString()}
                </td>

                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handlePrintSlip(payment)} 
                      style={{ color: 'var(--primary)', backgroundColor: 'transparent', padding: '6px', borderRadius: '6px' }} 
                      className="hover:bg-orange-50"
                      title="Print Payment Receipt"
                    >
                      <Printer size={16} />
                    </button>
                    <button 
                      onClick={() => payment.booking && navigate(`/print/${payment.booking}`)} 
                      style={{ color: 'var(--secondary)', backgroundColor: 'transparent', padding: '6px', borderRadius: '6px' }} 
                      className="hover:bg-slate-100"
                      title="View Booking Invoice"
                    >
                      <FileText size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(payment.id)} 
                      style={{ color: 'var(--error)', backgroundColor: 'transparent', padding: '6px', borderRadius: '6px' }} 
                      className="hover:bg-red-50"
                      title="Void Payment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPayments.length === 0 && !isLoading && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>
            No payment transactions match your query criteria.
          </div>
        )}
      </div>

      </div>
      {/* RECORD PAYMENT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '20px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--secondary)', margin: 0 }}>Record Client Deposit</h3>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>کلائنٹ ادائیگی ریکارڈ فارم</p>
              </div>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setSelectedBookingSpecs(null);
                  setFormData({
                    booking: '',
                    amount: '',
                    payment_method: 'CASH',
                    status: 'COMPLETED',
                    notes: ''
                  });
                }} 
                style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div className="input-group">
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '4px', display: 'block' }}>
                  Select Event / Reservation
                </label>
                <select 
                  required 
                  value={formData.booking} 
                  onChange={(e) => setFormData({...formData, booking: e.target.value})}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
                >
                  <option value="">-- Choose Reservation --</option>
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.event_name} (Date: {b.event_date})
                    </option>
                  ))}
                </select>
              </div>

              {/* Real-time Ledger Preview block inside Modal */}
              {selectedBookingSpecs && (
                <div style={{ 
                  backgroundColor: 'rgba(91, 213, 30, 0.04)', 
                  border: '1.5px dashed rgba(91, 213, 30, 0.2)', 
                  borderRadius: '8px', 
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', tracking: '0.05em' }}>
                    Live Booking Statement:
                  </span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 2px 0' }}>Grand Total</p>
                      <p style={{ fontSize: '12px', fontWeight: '800', color: 'var(--secondary)', margin: 0 }}>
                        PKR {Math.round(selectedBookingSpecs.grandTotal).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 2px 0' }}>Paid So Far</p>
                      <p style={{ fontSize: '12px', fontWeight: '800', color: '#166534', margin: 0 }}>
                        PKR {Math.round(selectedBookingSpecs.balancePaid).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 2px 0' }}>Outstanding</p>
                      <p style={{ fontSize: '12px', fontWeight: '800', color: '#b91c1c', margin: 0 }}>
                        PKR {Math.round(selectedBookingSpecs.remaining).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {selectedBookingSpecs.remaining <= 0 && (
                    <div style={{ fontSize: '10px', color: '#166534', fontWeight: '700', textAlign: 'center', marginTop: '4px' }}>
                      ✅ This booking is already fully paid in full!
                    </div>
                  )}
                </div>
              )}

              <div className="input-group">
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '4px', display: 'block' }}>
                  Amount to Pay (PKR)
                </label>
                <input 
                  type="number" 
                  required 
                  value={formData.amount} 
                  onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                  placeholder="0.00"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '4px', display: 'block' }}>
                    Payment Method
                  </label>
                  <select 
                    value={formData.payment_method} 
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
                  >
                    <option value="CASH">Cash (نقد)</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '4px', display: 'block' }}>
                    Status
                  </label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
                  >
                    <option value="COMPLETED">Completed (وصول شدہ)</option>
                    <option value="PENDING">Pending (انتظار)</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '4px', display: 'block' }}>
                  Transaction Reference / Notes
                </label>
                <textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                  placeholder="Cheque number, bank transfer receipts or manual slip details..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '40px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  marginTop: '8px'
                }}
              >
                Confirm Payment Deposit
              </button>

            </form>
          </div>
        </div>
      )}

      {/* PRINT SLIP RECEIPT MODAL */}
      {showReceiptModal && selectedReceipt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyRight: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '16px', position: 'relative' }}>
            
            {/* Action Bar inside dialog */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setSelectedReceipt(null);
                  setShowReceiptModal(false);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
              >
                <X size={14} /> Close Preview
              </button>
              
              <button 
                className="btn-primary" 
                onClick={triggerThermalPrint}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', fontSize: '12px' }}
              >
                <Printer size={14} /> Print Receipt
              </button>
            </div>

            {/* Receipt view modeled around 80mm thermal paper */}
            <div id="thermal-receipt-view" style={{ 
              backgroundColor: '#fff', 
              color: '#000', 
              fontFamily: "'Courier New', monospace", 
              padding: '20px', 
              border: '1px solid #ccc',
              fontSize: '12px',
              lineHeight: '1.4'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '900' }}>GATEWAY VENUE</h3>
                <p style={{ margin: 0, fontSize: '10px' }}>Marriage Hall & Events Management</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '9px' }}>Main Chowk Bypass | +92 300 1234567</p>
                <p style={{ margin: '5px 0' }}>--------------------------------</p>
                <h4 style={{ margin: '5px 0', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>PAYMENT TRANSACTION RECEIPT</h4>
                <p style={{ margin: '5px 0' }}>--------------------------------</p>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '4px 0' }}><strong>Slip ID:</strong> PAY-{String(selectedReceipt.id).padStart(5, '0')}</p>
                <p style={{ margin: '4px 0' }}><strong>Date:</strong> {new Date(selectedReceipt.payment_date).toLocaleDateString()} {new Date(selectedReceipt.payment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <p style={{ margin: '4px 0' }}><strong>Booking Ref:</strong> {selectedReceipt.booking_event_name}</p>
                <p style={{ margin: '4px 0' }}><strong>Method:</strong> {selectedReceipt.payment_method}</p>
                <p style={{ margin: '4px 0' }}><strong>Status:</strong> {selectedReceipt.status}</p>
              </div>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '10px 0', margin: '15px 0', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '11px', textTransform: 'uppercase' }}>AMOUNT PAID (وصول رقم)</p>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900' }}>
                  PKR {parseFloat(selectedReceipt.amount || 0).toLocaleString()}
                </h2>
              </div>

              {selectedReceipt.notes && (
                <div style={{ marginBottom: '20px', fontSize: '10px' }}>
                  <p style={{ margin: '0 0 2px 0' }}><strong>Remarks/Notes:</strong></p>
                  <p style={{ margin: 0, fontStyle: 'italic' }}>{selectedReceipt.notes}</p>
                </div>
              )}

              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                <div style={{ textAlign: 'center', width: '100px' }}>
                  <p style={{ margin: '0 0 15px 0' }}>_________________</p>
                  <p style={{ margin: 0 }}>Client signature</p>
                </div>
                
                <div style={{ textAlign: 'center', width: '100px' }}>
                  <p style={{ margin: '0 0 15px 0' }}>_________________</p>
                  <p style={{ margin: 0 }}>Officer signature</p>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px dashed #000', paddingTop: '10px', fontSize: '9px' }}>
                <p style={{ margin: 0 }}>Thank you for choosing Gateway Halls!</p>
                <p style={{ margin: '2px 0 0 0' }}>Software generated ledger document.</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Payments;
