import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  ChevronLeft,
  Trash2,
  Edit2,
  X,
  FileText,
  Printer,
  CheckCircle,
  Clock,
  HelpCircle,
  ChevronRight,
  Sparkles,
  DollarSign
} from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';

const Bookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [halls, setHalls] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'edit'
  const [editingId, setEditingId] = useState(null);
  const isEdit = viewMode === 'edit';
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Primary Form Data
  const [formData, setFormData] = useState({
    event_name: '',
    customer: '',
    venue: '',
    booking_date: new Date().toISOString().split('T')[0],
    event_date: '',
    slot: 'morning',
    gents_count: 0,
    ladies_count: 0,
    rate_per_head: 1200,
    overtime_hours: 0,
    kitchen_charge: 0,
    decoration_charge: 0,
    deg_count: 0,
    generator_charge: 0,
    cnic: '',
    advance_paid: 0,
    booking_status: 'CONFIRMED'
  });

  // Dual-mode customer state
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [bookingError, setBookingError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookingsRes, hallsRes, customersRes] = await Promise.all([
        client.get('/bookings/'),
        client.get('/venues/'),
        client.get('/customers/')
      ]);
      setBookings(bookingsRes.data.results || bookingsRes.data || []);
      setHalls(hallsRes.data.results || hallsRes.data || []);
      setCustomers(customersRes.data.results || customersRes.data || []);
    } catch (err) {
      toast.error('Failed to load data from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Recalculate calculations in real-time
  const totalAttendance = Number(formData.gents_count || 0) + Number(formData.ladies_count || 0);
  const subtotal = totalAttendance * Number(formData.rate_per_head || 0);
  
  // Overtime rate: 5000 PKR per hour
  const extraServices = (Number(formData.overtime_hours || 0) * 5000) + 
                        Number(formData.kitchen_charge || 0) + 
                        Number(formData.decoration_charge || 0) + 
                        Number(formData.generator_charge || 0);
                        
  const totalBeforeTax = subtotal + extraServices;
  const taxAmount = totalBeforeTax * 0.05;
  const grandTotal = totalBeforeTax + taxAmount;
  const remainingBalance = grandTotal - Number(formData.advance_paid || 0);

  const resetForm = () => {
    setFormData({
      event_name: '',
      customer: '',
      venue: halls[0]?.id || '',
      booking_date: new Date().toISOString().split('T')[0],
      event_date: '',
      slot: 'morning',
      gents_count: 0,
      ladies_count: 0,
      rate_per_head: 1200,
      overtime_hours: 0,
      kitchen_charge: 0,
      decoration_charge: 0,
      deg_count: 0,
      generator_charge: 0,
      cnic: '',
      advance_paid: 0,
      booking_status: 'CONFIRMED'
    });
    setNewCustomer({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: ''
    });
    setNewCustomerMode(false);
    setBookingError('');
    setEditingId(null);
  };

  const handleCreateNewClick = () => {
    resetForm();
    if (halls.length > 0) {
      setFormData(prev => ({
        ...prev,
        venue: halls[0].id,
        rate_per_head: halls[0].price_per_head || 1200
      }));
    }
    setViewMode('create');
  };

  const handleEditClick = (booking) => {
    setEditingId(booking.id);
    setFormData({
      event_name: booking.event_name,
      customer: booking.customer,
      venue: booking.venue,
      booking_date: booking.booking_date || new Date().toISOString().split('T')[0],
      event_date: booking.event_date || (booking.start_date ? booking.start_date.split('T')[0] : ''),
      slot: booking.slot || 'morning',
      gents_count: booking.gents_count || 0,
      ladies_count: booking.ladies_count || 0,
      rate_per_head: booking.rate_per_head || 1200,
      overtime_hours: booking.overtime_hours || 0,
      kitchen_charge: booking.kitchen_charge || 0,
      decoration_charge: booking.decoration_charge || 0,
      deg_count: booking.deg_count || 0,
      generator_charge: booking.generator_charge || 0,
      cnic: booking.cnic || '',
      advance_paid: booking.advance_paid || 0,
      booking_status: booking.booking_status || 'CONFIRMED'
    });
    setNewCustomerMode(false);
    setBookingError('');
    setViewMode('edit');
  };

  const handlePrintRowClick = (booking) => {
    navigate(`/print/${booking.id}`);
  };

  const handleSaveNewCustomerInline = async () => {
    setBookingError('');
    if (!newCustomer.first_name || !newCustomer.last_name || !newCustomer.phone) {
      setBookingError('Please complete all required Client Info fields (First Name, Last Name, Phone).');
      toast.error('Required fields missing');
      return;
    }
    
    try {
      const customerPayload = {
        ...newCustomer,
        email: newCustomer.email || `${newCustomer.first_name.toLowerCase()}.${newCustomer.last_name.toLowerCase()}@example.com`
      };
      const custRes = await client.post('/customers/', customerPayload);
      const savedCust = custRes.data;
      
      // Add the new client to the local customers list so they appear in dropdowns
      setCustomers(prev => [...prev, savedCust]);
      
      // Auto-select this newly created client
      setFormData(prev => ({ ...prev, customer: savedCust.id }));
      
      // Switch back to "Select Client" mode to display the selected new client
      setNewCustomerMode(false);
      
      // Clear inline client fields
      setNewCustomer({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: ''
      });
      
      toast.success(`Client saved and selected: ${savedCust.first_name} ${savedCust.last_name}`);
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.non_field_errors?.[0]
        || (typeof Object.values(errData || {})?.[0] === 'object' ? Object.values(errData)?.[0]?.[0] : Object.values(errData)?.[0])
        || 'Failed to save new client details.';
      setBookingError(msg);
      toast.error('Client saving failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    // Select active venue
    const selectedHall = halls.find(h => String(h.id) === String(formData.venue));
    if (selectedHall && totalAttendance > selectedHall.capacity) {
      setBookingError(
        `Total guest attendance (${totalAttendance}) exceeds '${selectedHall.name}' maximum capacity of ${selectedHall.capacity} seats. Please adjust attendees or choose a larger hall.`
      );
      toast.error('Capacity exceeded');
      return;
    }

    try {
      let finalCustomerId = formData.customer;

      // 1. If "Create New Customer" is active, call customer API first
      if (newCustomerMode) {
        if (!newCustomer.first_name || !newCustomer.last_name || !newCustomer.phone) {
          setBookingError('Please complete all required Client Info fields (First Name, Last Name, Phone).');
          return;
        }
        // Fallback email if empty
        const customerPayload = {
          ...newCustomer,
          email: newCustomer.email || `${newCustomer.first_name.toLowerCase()}.${newCustomer.last_name.toLowerCase()}@example.com`
        };
        const custRes = await client.post('/customers/', customerPayload);
        finalCustomerId = custRes.data.id;
        toast.success(`Client profile created: ${newCustomer.first_name}`);
      }

      if (!finalCustomerId) {
        setBookingError('Please select a customer or create a new client profile.');
        return;
      }

      // 2. Build booking payload
      const payload = {
        ...formData,
        customer: parseInt(finalCustomerId),
        venue: parseInt(formData.venue),
        gents_count: parseInt(formData.gents_count || 0),
        ladies_count: parseInt(formData.ladies_count || 0),
        rate_per_head: parseFloat(formData.rate_per_head || 0),
        overtime_hours: parseFloat(formData.overtime_hours || 0),
        kitchen_charge: parseFloat(formData.kitchen_charge || 0),
        decoration_charge: parseFloat(formData.decoration_charge || 0),
        deg_count: parseInt(formData.deg_count || 0),
        generator_charge: parseFloat(formData.generator_charge || 0),
        advance_paid: parseFloat(formData.advance_paid || 0),
        total_price: parseFloat(grandTotal) // send computed grand total
      };

      if (viewMode === 'edit') {
        await client.put(`/bookings/${editingId}/`, payload);
        toast.success('Reservation updated successfully');
      } else {
        await client.post('/bookings/', payload);
        toast.success('Reservation saved successfully');
      }

      resetForm();
      setViewMode('list');
      fetchData();
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.non_field_errors?.[0]
        || (typeof Object.values(errData || {})?.[0] === 'object' ? Object.values(errData)?.[0]?.[0] : Object.values(errData)?.[0])
        || 'Failed to save booking details.';
      setBookingError(msg);
      toast.error('Reservation failed — check details');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you absolutely sure you want to cancel and delete this reservation?')) {
      try {
        await client.delete(`/bookings/${id}/`);
        toast.success('Booking successfully deleted');
        fetchData();
      } catch (err) {
        toast.error('Failed to delete booking from database');
      }
    }
  };



  // Filter list bookings
  const filteredBookings = bookings.filter(b => {
    const q = searchQuery.toLowerCase();
    return (
      (b.event_name || '').toLowerCase().includes(q) ||
      (b.customer_name || '').toLowerCase().includes(q) ||
      (b.venue_name || '').toLowerCase().includes(q) ||
      (b.booking_id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-in">
        {/* LIST VIEW MODE */}
        {viewMode === 'list' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--secondary)' }}>Bookings & Reservations</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Oversee schedule listings, revenue parameters, and confirm hall draft bookings.</p>
              </div>
              <button className="btn-primary" onClick={handleCreateNewClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600' }}>
                <Plus size={18} /> New Reservation
              </button>
            </div>

            {/* Filter Search */}
            <div className="card" style={{ marginBottom: '32px', padding: '16px 24px', display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search reservations by event name, customer first/last name, hall tag, or booking ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', paddingLeft: '44px', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
              </div>
            </div>

            {/* Bookings table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Booking ID / Event</th>
                    <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Venue Hall</th>
                    <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Event Date & Slot</th>
                    <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Payment</th>
                    <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Grand Total</th>
                    <th style={{ padding: '18px 24px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }} className="hover:bg-slate-50/50">
                      <td 
                        style={{ padding: '20px 24px', cursor: 'pointer' }}
                        onClick={() => handleEditClick(booking)}
                        title="Click to view or edit this reservation details"
                      >
                        <div style={{ transition: 'opacity 0.2s' }} className="hover:opacity-85">
                          <p style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'monospace', color: 'var(--primary)', marginBottom: '2px' }}>{booking.booking_id || `BK-2026-${booking.id}`}</p>
                          <p style={{ fontWeight: '700', fontSize: '14px', color: 'var(--secondary)', display: 'inline-block', borderBottom: '1px dashed transparent', transition: 'border-color 0.2s' }} className="hover:border-slate-400">{booking.event_name}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{booking.customer_name}</p>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: '500', color: 'var(--secondary)' }}>{booking.venue_name}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--secondary)' }}>
                            <CalendarIcon size={14} color="var(--text-muted)" />
                            {booking.event_date ? new Date(booking.event_date).toLocaleDateString() : (booking.start_date ? new Date(booking.start_date).toLocaleDateString() : 'N/A')}
                          </div>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '10px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            color: booking.slot === 'evening' ? '#6366f1' : '#f59e0b',
                            backgroundColor: booking.slot === 'evening' ? '#e0e7ff' : '#fef3c7',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            marginTop: '4px'
                          }}>
                            {booking.slot || 'Morning'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: booking.booking_status === 'CONFIRMED' ? '#dcfce7' : booking.booking_status === 'COMPLETED' ? '#dbeafe' : '#fef3c7',
                          color: booking.booking_status === 'CONFIRMED' ? '#166534' : booking.booking_status === 'COMPLETED' ? '#1e40af' : '#92400e'
                        }}>
                          {booking.booking_status}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span 
                          onClick={() => navigate('/dashboard/payments', { 
                            state: { 
                              preselectedBookingId: booking.id,
                              bookingEventName: booking.event_name,
                              autoOpenRecord: booking.payment_status !== 'PAID' 
                            } 
                          })}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: booking.payment_status === 'PAID' ? '#dcfce7' : booking.payment_status === 'PARTIAL' ? '#ffedd5' : '#fee2e2',
                            color: booking.payment_status === 'PAID' ? '#166534' : booking.payment_status === 'PARTIAL' ? '#c2410c' : '#991b1b',
                            cursor: 'pointer',
                            display: 'inline-block',
                            transition: 'transform 0.15s, box-shadow 0.15s'
                          }}
                          className="hover:scale-105 hover:shadow-sm"
                          title="Click to view payment history or record new payment"
                        >
                          {booking.payment_status}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px', fontWeight: '700', fontSize: '14px', color: 'var(--secondary)' }}>
                        <span style={{ fontSize: '80%', opacity: 0.6, marginRight: '2px' }}>PKR</span> 
                        {parseFloat(booking.total_price || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEditClick(booking)} style={{ color: 'var(--secondary)', backgroundColor: 'transparent', padding: '4px', borderRadius: '4px' }} className="hover:bg-slate-200" title="Edit booking"><Edit2 size={16} /></button>
                          <button onClick={() => handlePrintRowClick(booking)} style={{ color: 'var(--primary)', backgroundColor: 'transparent', padding: '4px', borderRadius: '4px' }} className="hover:bg-orange-50" title="Print receipts & reports"><Printer size={16} /></button>
                          <button onClick={() => handleDelete(booking.id)} style={{ color: 'var(--error)', backgroundColor: 'transparent', padding: '4px', borderRadius: '4px' }} className="hover:bg-red-50" title="Delete booking"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBookings.length === 0 && !isLoading && (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '15px', fontWeight: '500' }}>No reservations match your criteria.</p>
                  <button className="btn-secondary" onClick={handleCreateNewClick} style={{ marginTop: '16px' }}>+ Create New Booking</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* FULL PAGE CREATE & EDIT MODE */}
        {(viewMode === 'create' || viewMode === 'edit') && (
          <form onSubmit={handleSubmit}>
            {/* Header section with back nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button type="button" onClick={() => setViewMode('list')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: 'white' }} className="hover:bg-slate-100">
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--secondary)' }}>
                    {viewMode === 'create' ? 'Booking Request' : 'Modify Booking Details'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>Fill in the details to reserve a hall slot.</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.1em', padding: '6px 12px', borderRadius: '20px', backgroundColor: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={12} /> Draft Mode
                </span>
              </div>
            </div>

            {bookingError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px 20px', color: '#b91c1c', fontSize: '14px', fontWeight: '600', marginBottom: '32px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <X size={18} style={{ backgroundColor: '#b91c1c', color: 'white', borderRadius: '50%', padding: '2px' }} />
                {bookingError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px', alignItems: 'start' }}>
              {/* Form entries - Left hand side */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                
                {/* section: Essentials */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.15em', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '4px', height: '16px', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></span>
                    Essentials
                  </h3>
                  <div className="premium-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '28px' }}>
                    <div className="input-group">
                      <label>Booking ID</label>
                      <input type="text" readOnly value={formData.booking_id || 'BK-2026-AUTO'} style={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 'bold', fontFamily: 'monospace' }} />
                    </div>
                    <div className="input-group">
                      <label>Booking Date</label>
                      <input type="date" required disabled={isEdit} value={formData.booking_date} onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })} style={isEdit ? { backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}} />
                    </div>
                    <div className="input-group">
                      <label>Event Date</label>
                      <input type="date" required disabled={isEdit} value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} style={isEdit ? { backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}} />
                    </div>
                    <div className="input-group">
                      <label>Event Title</label>
                      <input 
                        type="text" 
                        list="event-suggestions" 
                        required 
                        disabled={isEdit}
                        placeholder="e.g. Barat Ceremony, Walima Reception..." 
                        value={formData.event_name} 
                        onChange={(e) => setFormData({ ...formData, event_name: e.target.value })} 
                        style={isEdit ? { backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}}
                      />
                      <datalist id="event-suggestions">
                        {Array.from(new Set(bookings.map(b => b.event_name).filter(Boolean))).map(name => (
                          <option key={name} value={name} />
                        ))}
                        <option value="Barat Ceremony" />
                        <option value="Walima Reception" />
                        <option value="Mehndi Night" />
                        <option value="Mayon Ceremony" />
                        <option value="Shendi Ceremony" />
                        <option value="Engagement Ceremony" />
                        <option value="Birthday Celebration" />
                        <option value="Corporate Seminar" />
                        <option value="Get Together Party" />
                      </datalist>
                    </div>
                  </div>
                </section>

                {/* section: Client Info */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.15em', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '4px', height: '16px', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></span>
                      Client Info
                    </h3>
                    
                    {/* Selector toggle */}
                    {!isEdit && (
                      <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '2px' }}>
                        <button type="button" onClick={() => setNewCustomerMode(false)} style={{ fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '6px', backgroundColor: !newCustomerMode ? 'white' : 'transparent', color: !newCustomerMode ? 'var(--secondary)' : '#64748b', boxShadow: !newCustomerMode ? 'var(--shadow-sm)' : 'none' }}>
                          Select Client
                        </button>
                        <button type="button" onClick={() => setNewCustomerMode(true)} style={{ fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '6px', backgroundColor: newCustomerMode ? 'white' : 'transparent', color: newCustomerMode ? 'var(--secondary)' : '#64748b', boxShadow: newCustomerMode ? 'var(--shadow-sm)' : 'none' }}>
                          + Add Client
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px' }}>
                    {!newCustomerMode ? (
                      <div className="input-group">
                        <label>Existing Client / Customer</label>
                        <select required={!newCustomerMode} disabled={isEdit} value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} style={isEdit ? { backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : {}}>
                          <option value="">Select Customer</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.phone})</option>)}
                        </select>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group">
                          <label>First Name</label>
                          <input type="text" placeholder="First Name" value={newCustomer.first_name} onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })} />
                        </div>
                        <div className="input-group">
                          <label>Last Name</label>
                          <input type="text" placeholder="Last Name" value={newCustomer.last_name} onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })} />
                        </div>
                        <div className="input-group">
                          <label>Phone Number</label>
                          <input type="tel" placeholder="+92 300 0000000" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                        </div>
                        <div className="input-group">
                          <label>Email Address</label>
                          <input type="email" placeholder="example@gmail.com" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                          <label>Residential Address</label>
                          <textarea rows="2" placeholder="Street address, City, Province" value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} style={{ resize: 'none' }}></textarea>
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                          <button 
                            type="button" 
                            onClick={handleSaveNewCustomerInline} 
                            style={{
                              backgroundColor: 'var(--primary)',
                              color: 'white',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '700',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: 'var(--shadow-sm)',
                              transition: 'opacity 0.2s'
                            }}
                            className="hover:opacity-90"
                          >
                            <Plus size={16} /> Save & Select Client
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="input-group" style={{ marginTop: '10px', borderTop: '1px dashed var(--border)', paddingTop: '20px' }}>
                      <label>CNIC (National ID Card Number)</label>
                      <input type="text" placeholder="e.g. 35202-1234567-9" disabled={isEdit} value={formData.cnic} onChange={(e) => setFormData({ ...formData, cnic: e.target.value })} style={isEdit ? { fontFamily: 'monospace', backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : { fontFamily: 'monospace' }} />
                    </div>
                  </div>
                </section>

                {/* section: Venue & Logistics */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.15em', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '4px', height: '16px', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></span>
                    Venue & Logistics
                  </h3>
                  <div className="premium-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', padding: '28px' }}>
                    
                    {/* Venue & Slot Segmented control */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="input-group">
                        <label>Select Venue Hall</label>
                        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
                          {halls.map(h => {
                            const isSel = String(formData.venue) === String(h.id);
                            return (
                              <button
                                key={h.id}
                                type="button"
                                disabled={isEdit}
                                onClick={() => setFormData({ ...formData, venue: h.id, rate_per_head: h.price_per_head || 1200 })}
                                style={{
                                  flex: 1,
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: isSel ? 'white' : 'transparent',
                                  color: isSel ? 'var(--primary)' : '#64748b',
                                  boxShadow: isSel ? 'var(--shadow-sm)' : 'none',
                                  cursor: isEdit ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {h.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Select Slot</label>
                        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
                          {['morning', 'evening'].map(s => {
                            const isSel = formData.slot === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                disabled={isEdit}
                                onClick={() => setFormData({ ...formData, slot: s })}
                                style={{
                                  flex: 1,
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: isSel ? 'white' : 'transparent',
                                  color: isSel ? 'var(--primary)' : '#64748b',
                                  boxShadow: isSel ? 'var(--shadow-sm)' : 'none',
                                  textTransform: 'capitalize',
                                  cursor: isEdit ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Attendance aggregation box */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                          <label>Gents Guest Count</label>
                          <input type="number" min="0" value={formData.gents_count} onChange={(e) => setFormData({ ...formData, gents_count: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="input-group">
                          <label>Ladies Guest Count</label>
                          <input type="number" min="0" value={formData.ladies_count} onChange={(e) => setFormData({ ...formData, ladies_count: parseInt(e.target.value) || 0 })} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#fcfcfd', border: '1px solid var(--border)', borderRadius: '12px', marginTop: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Total Attendance</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)' }}>{totalAttendance}</span>
                          {(() => {
                            const sel = halls.find(h => String(h.id) === String(formData.venue));
                            return sel ? <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '500' }}>(Max Limit: {sel.capacity})</p> : null;
                          })()}
                        </div>
                      </div>
                    </div>

                  </div>
                </section>

                {/* section: Special Services */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.15em', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '4px', height: '16px', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></span>
                    Special Services
                  </h3>
                  <div className="premium-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '28px' }}>
                    <div className="input-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Overtime Hours</label>
                      <div style={{ position: 'relative' }}>
                        <input type="number" step="0.5" value={formData.overtime_hours} onChange={(e) => setFormData({ ...formData, overtime_hours: parseFloat(e.target.value) || 0 })} style={{ width: '100%', paddingRight: '40px' }} />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: '700', color: '#64748b' }}>HRS</span>
                      </div>
                    </div>

                    <div className="input-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kitchen Services (PKR)</label>
                      <input type="number" value={formData.kitchen_charge} onChange={(e) => setFormData({ ...formData, kitchen_charge: parseFloat(e.target.value) || 0 })} />
                    </div>

                    <div className="input-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Decorations (PKR)</label>
                      <input type="number" value={formData.decoration_charge} onChange={(e) => setFormData({ ...formData, decoration_charge: parseFloat(e.target.value) || 0 })} />
                    </div>

                    <div className="input-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deg Cooking Count</label>
                      <input type="number" value={formData.deg_count} onChange={(e) => setFormData({ ...formData, deg_count: parseInt(e.target.value) || 0 })} />
                    </div>

                    <div className="input-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Generator Usage (PKR)</label>
                      <input type="number" value={formData.generator_charge} onChange={(e) => setFormData({ ...formData, generator_charge: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                </section>

              </div>

              {/* Invoicing summary sidebar - Right hand side */}
              <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="premium-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  
                  {/* Frosted header */}
                  <div style={{ backgroundColor: 'rgba(255,107,44,0.05)', padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', tracking: '0.05em' }}>Billing Summary</h3>
                  </div>

                  {/* Pricing grid */}
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>Rate per Head</span>
                      <div style={{ position: 'relative', width: '110px' }}>
                        <input type="number" disabled={isEdit} value={formData.rate_per_head} onChange={(e) => setFormData({ ...formData, rate_per_head: parseFloat(e.target.value) || 0 })} style={isEdit ? { width: '100%', textAlign: 'right', fontSize: '13px', padding: '4px 8px', fontWeight: '700', backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : { width: '100%', textAlign: 'right', fontSize: '13px', padding: '4px 8px', fontWeight: '700' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>Subtotal</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary)' }}>PKR {subtotal.toLocaleString()}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Extra Services</span>
                        <span style={{ fontWeight: '600' }}>PKR {extraServices.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Taxes (5%)</span>
                        <span style={{ fontWeight: '600' }}>PKR {taxAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Total billing block */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Grand Total</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary)', marginRight: '4px' }}>PKR</span>
                          <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--primary)', tracking: '-0.02em' }}>{grandTotal.toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Advance Paid</span>
                        <input type="number" min="0" disabled={isEdit} value={formData.advance_paid} onChange={(e) => setFormData({ ...formData, advance_paid: parseFloat(e.target.value) || 0 })} style={isEdit ? { width: '100px', padding: '4px 8px', fontSize: '12px', textAlign: 'right', fontWeight: '700', backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : { width: '100px', padding: '4px 8px', fontSize: '12px', textAlign: 'right', fontWeight: '700' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--error)' }}>Remaining</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--error)', marginRight: '4px' }}>PKR</span>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--error)', tracking: '-0.02em' }}>{remainingBalance.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                      <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '10px', fontWeight: '700', fontSize: '14px' }}>
                        <CheckCircle size={18} /> Confirm & Save
                      </button>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (viewMode === 'edit' && editingId) {
                              navigate(`/print/${editingId}`);
                            } else {
                              toast.error('Please save the booking first to print receipts & reports!');
                            }
                          }} 
                          className="btn-secondary" 
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}
                        >
                          <Printer size={15} /> Receipts & Reports
                        </button>
                        <button type="button" onClick={() => setViewMode('list')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', border: '1px solid #fee2e2', color: '#b91c1c' }}>
                          <X size={15} /> Cancel
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Manager's note display */}
                <div style={{ backgroundColor: 'rgba(255,107,44,0.03)', border: '1px solid rgba(255,107,44,0.1)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.1em', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HelpCircle size={14} /> Manager's Note
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6', fontWeight: '500' }}>
                    Ensure all client identification documents (CNIC copy, mobile registration) are uploaded within 48 hours of advance payment. Overtime is charged flat at <span style={{ fontWeight: '700' }}>PKR 5,000/hr</span>.
                  </p>
                </div>

              </div>

            </div>
          </form>
        )}
    </div>
  );
};

export default Bookings;
