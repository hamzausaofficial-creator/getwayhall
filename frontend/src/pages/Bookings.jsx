import React, { useState, useEffect, useRef } from 'react';
import SearchInput from '../components/SearchInput';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  Trash2,
  Edit2,
  X,
  XCircle,
  FileText,
  Printer,
  CheckCircle,
  Clock,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Package
} from 'lucide-react';
import client from '../api/client';
import { formatCollectDue, formatCollectDuePKR, bookingCollectDue, hasCollectDue } from '../utils/currency';
import toast from 'react-hot-toast';
import { customerDisplayName, buildCustomerPayload } from '../utils/customer';
import { usePermissions } from '../hooks/usePermissions';
import CancelBookingModal from '../components/bookings/CancelBookingModal';
import CnicScannerPanel from '../components/guesthouse/CnicScannerPanel';
import ScannedGuestPanel from '../components/guesthouse/ScannedGuestPanel';
import { resolveGuestFromIdScan, isPhoneCompleteForAutoSave, saveGuestFromDraft } from '../utils/idCardCustomer';

const BOOKING_STATUS_STYLE = {
  PENDING: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  CONFIRMED: { bg: '#dcfce7', color: '#166534', label: 'Confirmed' },
  COMPLETED: { bg: '#dbeafe', color: '#1e40af', label: 'Completed' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const displayNumField = (v) => (v === '' || v === null || v === undefined ? '' : v);

const toIntField = (raw) => {
  if (raw === '') return '';
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? '' : n;
};

const toFloatField = (raw) => {
  if (raw === '') return '';
  const n = parseFloat(raw);
  return Number.isNaN(n) ? '' : n;
};

const numFromApi = (v) => (v === 0 || v === '0' || v == null ? '' : v);

const Bookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canManage, canAccessPayments } = usePermissions();
  const [bookings, setBookings] = useState([]);
  const [halls, setHalls] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [decorationPackages, setDecorationPackages] = useState([]);
  const [selectedDecorationId, setSelectedDecorationId] = useState('');
  const [inventoryCatalog, setInventoryCatalog] = useState([]);
  const [inventoryLines, setInventoryLines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'edit'
  const [editingId, setEditingId] = useState(null);
  const isEdit = viewMode === 'edit';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  
  // Primary Form Data
  const [formData, setFormData] = useState({
    event_name: '',
    customer: '',
    venue: '',
    booking_date: new Date().toISOString().split('T')[0],
    event_date: '',
    slot: '',
    gents_count: '',
    ladies_count: '',
    rate_per_head: 1200,
    overtime_hours: '',
    kitchen_charge: '',
    decoration_charge: '',
    deg_count: '',
    generator_charge: '',
    cnic: '',
    advance_paid: '',
    booking_status: 'CONFIRMED'
  });

  // Dual-mode customer state
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    full_name: '',
    cnic: '',
    email: '',
    phone: '',
    address: ''
  });

  const [bookingError, setBookingError] = useState('');
  const [scanProcessing, setScanProcessing] = useState(false);
  const [scannedClient, setScannedClient] = useState(null);
  const [savingScannedClient, setSavingScannedClient] = useState(false);
  const savingClientRef = useRef(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookingsRes, hallsRes, customersRes, decoRes, invRes] = await Promise.all([
        client.get('/bookings/'),
        client.get('/venues/'),
        client.get('/customers/'),
        client.get('/decorations/packages/?is_active=true').catch(() => ({ data: [] })),
        client.get('/inventory/items/').catch(() => ({ data: [] })),
      ]);
      setBookings(bookingsRes.data.results || bookingsRes.data || []);
      setHalls(hallsRes.data.results || hallsRes.data || []);
      const invData = invRes.data?.results || invRes.data || [];
      setInventoryCatalog(Array.isArray(invData) ? invData : []);
      setCustomers(customersRes.data.results || customersRes.data || []);
      const decoData = decoRes.data?.results || decoRes.data || [];
      setDecorationPackages(Array.isArray(decoData) ? decoData.filter((p) => p.is_active !== false) : []);
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
      venue: '',
      booking_date: new Date().toISOString().split('T')[0],
      event_date: '',
      slot: '',
      gents_count: '',
      ladies_count: '',
      rate_per_head: 1200,
      overtime_hours: '',
      kitchen_charge: '',
      decoration_charge: '',
      deg_count: '',
      generator_charge: '',
      cnic: '',
      advance_paid: '',
      booking_status: 'CONFIRMED'
    });
    setNewCustomer({
      full_name: '',
      cnic: '',
      email: '',
      phone: '',
      address: ''
    });
    setNewCustomerMode(false);
    setBookingError('');
    setEditingId(null);
    setSelectedDecorationId('');
    setInventoryLines([]);
    setScannedClient(null);
    setScanProcessing(false);
    setSavingScannedClient(false);
  };

  const selectClientFromScan = (customer) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === customer.id);
      return exists ? prev.map((c) => (c.id === customer.id ? customer : c)) : [...prev, customer];
    });
    setFormData((prev) => ({
      ...prev,
      customer: String(customer.id),
      cnic: customer.cnic || prev.cnic,
    }));
    setNewCustomerMode(false);
    setScannedClient(null);
    setNewCustomer({
      full_name: '',
      cnic: '',
      email: '',
      phone: '',
      address: '',
    });
    toast.success(`Client selected: ${customerDisplayName(customer)}`, { id: 'booking-id-scan' });
  };

  const saveClientFromScan = async (clientDraft) => {
    if (savingClientRef.current) return false;
    savingClientRef.current = true;
    setSavingScannedClient(true);
    try {
      const result = await saveGuestFromDraft(clientDraft);
      if (!result.ok) {
        toast.error(result.error || 'Please complete all required fields');
        return false;
      }
      selectClientFromScan(result.customer);
      if (result.created) {
        toast.success(`New client saved: ${customerDisplayName(result.customer)}`, { id: 'booking-id-scan' });
      }
      return true;
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.cnic?.[0] || data?.phone?.[0] || data?.detail || 'Failed to save client';
      toast.error(msg);
      return false;
    } finally {
      savingClientRef.current = false;
      setSavingScannedClient(false);
    }
  };

  const handleIdScan = async (parsed) => {
    if (scanProcessing || isEdit) return;
    setScannedClient(null);
    setScanProcessing(true);
    try {
      const result = await resolveGuestFromIdScan(parsed, { customers });
      if (result.status === 'invalid') {
        toast.error('Could not read ID card. Scan again or upload a clearer photo.');
        return;
      }
      if (result.status === 'existing') {
        selectClientFromScan(result.customer);
        return;
      }
      if (result.status === 'created') {
        selectClientFromScan(result.customer);
        toast.success(`New client saved: ${customerDisplayName(result.customer)}`, { id: 'booking-id-scan' });
        return;
      }
      setScannedClient(result.draft);
      setNewCustomer({ ...result.draft });
      setNewCustomerMode(true);
      toast('ID card read — check fields and add phone', { id: 'booking-id-scan', icon: 'ℹ️' });
    } catch {
      toast.error('Failed to process ID card');
    } finally {
      setScanProcessing(false);
    }
  };

  const handleScannedClientChange = (field, value) => {
    setScannedClient((prev) => (prev ? { ...prev, [field]: value } : prev));
    setNewCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const handleScannedClientPhoneChange = async (value) => {
    if (!scannedClient) return;
    const next = { ...scannedClient, phone: value };
    setScannedClient(next);
    setNewCustomer((prev) => ({ ...prev, phone: value }));
    if (isPhoneCompleteForAutoSave(value)) {
      await saveClientFromScan(next);
    }
  };

  const loadBookingInventory = async (bookingId) => {
    try {
      const res = await client.get(`/inventory/booking-items/?booking=${bookingId}`);
      const rows = res.data.results || res.data || [];
      setInventoryLines(
        rows.map((r) => ({
          id: r.id,
          inventory_item: String(r.inventory_item),
          quantity_used: r.quantity_used,
        }))
      );
    } catch {
      setInventoryLines([]);
    }
  };

  const syncBookingInventory = async (bookingId) => {
    const res = await client.get(`/inventory/booking-items/?booking=${bookingId}`);
    const existing = res.data.results || res.data || [];
    await Promise.all(existing.map((e) => client.delete(`/inventory/booking-items/${e.id}/`)));
    for (const line of inventoryLines) {
      const itemId = parseInt(line.inventory_item, 10);
      const qty = parseInt(line.quantity_used, 10);
      if (!itemId || !qty || qty <= 0) continue;
      await client.post('/inventory/booking-items/', {
        booking: bookingId,
        inventory_item: itemId,
        quantity_used: qty,
      });
    }
  };

  const hallsForSelect = halls.filter(
    (h) => h.status !== 'INACTIVE' || String(h.id) === String(formData.venue)
  );

  const handleCreateNewClick = () => {
    if (!canManage) {
      toast.error('You do not have permission to create bookings.');
      return;
    }
    resetForm();
    setViewMode('create');
  };

  const handleEditClick = (booking) => {
    if (!canManage) {
      toast.error('You do not have permission to edit bookings.');
      return;
    }
    setEditingId(booking.id);
    setFormData({
      event_name: booking.event_name,
      customer: booking.customer,
      venue: booking.venue,
      booking_date: booking.booking_date || new Date().toISOString().split('T')[0],
      event_date: booking.event_date || (booking.start_date ? booking.start_date.split('T')[0] : ''),
      slot: booking.slot || '',
      gents_count: numFromApi(booking.gents_count),
      ladies_count: numFromApi(booking.ladies_count),
      rate_per_head: booking.rate_per_head || 1200,
      overtime_hours: numFromApi(booking.overtime_hours),
      kitchen_charge: numFromApi(booking.kitchen_charge),
      decoration_charge: numFromApi(booking.decoration_charge),
      deg_count: numFromApi(booking.deg_count),
      generator_charge: numFromApi(booking.generator_charge),
      cnic: booking.cnic || '',
      advance_paid: numFromApi(booking.advance_paid),
      booking_status: booking.booking_status || 'CONFIRMED'
    });
    setNewCustomerMode(false);
    setBookingError('');
    setSelectedDecorationId(booking.decoration_package ? String(booking.decoration_package) : '');
    loadBookingInventory(booking.id);
    setViewMode('edit');
  };

  useEffect(() => {
    const editId = location.state?.editBookingId;
    if (!editId || bookings.length === 0) return;
    const booking = bookings.find((b) => String(b.id) === String(editId));
    if (booking) {
      handleEditClick(booking);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [bookings, location.state?.editBookingId]);

  useEffect(() => {
    if (!location.state?.openCreate || !canManage) return;
    const prefillCustomer = location.state?.prefillCustomer;
    handleCreateNewClick();
    if (prefillCustomer) {
      setFormData((prev) => ({ ...prev, customer: String(prefillCustomer) }));
      setNewCustomerMode(false);
    }
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state?.openCreate, location.state?.prefillCustomer, canManage, navigate, location.pathname]);

  const handleDecorationPackageSelect = (packageId) => {
    setSelectedDecorationId(packageId);
    if (!packageId) return;
    const pkg = decorationPackages.find((p) => String(p.id) === String(packageId));
    if (pkg) {
      setFormData((prev) => ({
        ...prev,
        decoration_charge: Number(pkg.base_price) || 0,
      }));
    }
  };

  const handleSaveNewCustomerInline = async () => {
    setBookingError('');
    if (!newCustomer.full_name?.trim() || !newCustomer.phone?.trim()) {
      setBookingError('Please enter Full Name and Phone Number.');
      toast.error('Required fields missing');
      return;
    }
    
    try {
      const customerPayload = buildCustomerPayload(newCustomer);
      const custRes = await client.post('/customers/', customerPayload);
      const savedCust = custRes.data;
      
      // Add the new client to the local customers list so they appear in dropdowns
      setCustomers(prev => [...prev, savedCust]);
      
      // Auto-select this newly created client
      setFormData(prev => ({
        ...prev,
        customer: savedCust.id,
        cnic: savedCust.cnic || newCustomer.cnic || prev.cnic,
      }));
      
      // Switch back to "Select Client" mode to display the selected new client
      setNewCustomerMode(false);
      
      // Clear inline client fields
      setNewCustomer({
        full_name: '',
        cnic: '',
        email: '',
        phone: '',
        address: ''
      });
      
      toast.success(`Client saved and selected: ${customerDisplayName(savedCust)}`);
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.non_field_errors?.[0]
        || (typeof Object.values(errData || {})?.[0] === 'object' ? Object.values(errData)?.[0]?.[0] : Object.values(errData)?.[0])
        || 'Failed to save new client details.';
      setBookingError(msg);
      toast.error('Client saving failed');
    }
  };

  const handleSubmit = async (e, statusOverride) => {
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
        if (!newCustomer.full_name?.trim() || !newCustomer.phone?.trim()) {
          setBookingError('Please enter Full Name and Phone Number.');
          return;
        }
        const customerPayload = buildCustomerPayload(newCustomer);
        const custRes = await client.post('/customers/', customerPayload);
        finalCustomerId = custRes.data.id;
        toast.success(`Client profile created: ${newCustomer.full_name.trim()}`);
      }

      if (!finalCustomerId) {
        setBookingError('Please select a customer or create a new client profile.');
        return;
      }

      if (!formData.venue) {
        setBookingError('Please select a venue hall.');
        toast.error('Venue required');
        return;
      }

      if (!formData.slot) {
        setBookingError('Please select a timing slot (Morning or Evening).');
        toast.error('Timing required');
        return;
      }

      // 2. Build booking payload (CNIC only when adding a new client)
      const selectedCustomer = customers.find((c) => String(c.id) === String(finalCustomerId));
      const bookingCnic = newCustomerMode
        ? (newCustomer.cnic || '')
        : (selectedCustomer?.cnic || '');
      const payload = {
        ...formData,
        booking_status: statusOverride || formData.booking_status,
        cnic: bookingCnic,
        customer: parseInt(finalCustomerId),
        venue: parseInt(formData.venue),
        gents_count: parseInt(formData.gents_count || 0),
        ladies_count: parseInt(formData.ladies_count || 0),
        rate_per_head: parseFloat(formData.rate_per_head || 0),
        overtime_hours: parseFloat(formData.overtime_hours || 0),
        kitchen_charge: parseFloat(formData.kitchen_charge || 0),
        decoration_charge: parseFloat(formData.decoration_charge || 0),
        decoration_package: selectedDecorationId ? parseInt(selectedDecorationId, 10) : null,
        deg_count: parseInt(formData.deg_count || 0),
        generator_charge: parseFloat(formData.generator_charge || 0),
        advance_paid: parseFloat(formData.advance_paid || 0),
        total_price: parseFloat(grandTotal) // send computed grand total
      };

      let bookingId = editingId;
      if (viewMode === 'edit') {
        await client.put(`/bookings/${editingId}/`, payload);
        toast.success('Reservation updated successfully');
      } else {
        const created = await client.post('/bookings/', payload);
        bookingId = created.data.id;
        toast.success(
          payload.booking_status === 'PENDING'
            ? 'Booking saved as pending'
            : 'Reservation saved successfully'
        );
      }

      if (bookingId) {
        try {
          await syncBookingInventory(bookingId);
        } catch {
          toast.error('Booking saved but inventory allocation failed');
        }
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
      toast.error('Reservation failed - check details');
    }
  };

  const handlePrintRowClick = (booking) => {
    const path = booking.booking_status === 'CANCELLED'
      ? `/print/${booking.id}?doc=cancellation`
      : `/print/${booking.id}`;
    navigate(path);
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
            <div className="page-header">
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--secondary)' }}>Bookings & Reservations</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Oversee schedule listings, revenue parameters, and confirm hall draft bookings.</p>
              </div>
              {canManage && (
              <button className="btn-primary" onClick={handleCreateNewClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600' }}>
                <Plus size={18} /> New Reservation
              </button>
              )}
            </div>

            {/* Filter Search */}
            <div className="search-toolbar">
              <SearchInput
                variant="inset"
                placeholder="Search reservations by event name, customer first/last name, hall tag, or booking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Bookings table */}
            <div className="card table-scroll" style={{ padding: 0, borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr className="table-header-row">
                    {[
                      { label: 'Customer / Event', title: 'Customer name & event' },
                      { label: 'Hall', title: 'Venue / marriage hall' },
                      { label: 'Date', title: 'Event date & time slot' },
                      { label: 'Status', title: 'Booking status' },
                      { label: 'Payment', title: 'Payment status' },
                      { label: 'Due', title: 'Balance due' },
                      { label: 'Total', title: 'Grand total amount' },
                      { label: '', title: 'Actions' },
                    ].map((col) => (
                      <th
                        key={col.label || 'actions'}
                        title={col.title}
                        style={{
                          padding: '14px 16px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
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
                          <p style={{ fontSize: '11px', fontWeight: '600', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.02em' }}>{booking.booking_id || `BK-2026-${booking.id}`}</p>
                          {booking.customer ? (
                            <Link
                              to={`/customers/${booking.customer}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{ fontWeight: '700', fontSize: '16px', color: 'var(--primary)', display: 'inline-block', lineHeight: 1.3 }}
                            >
                              {booking.customer_name}
                            </Link>
                          ) : (
                            <p style={{ fontWeight: '700', fontSize: '16px', color: 'var(--secondary)', lineHeight: 1.3 }}>{booking.customer_name}</p>
                          )}
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500', lineHeight: 1.35 }}>{booking.event_name}</p>
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
                          onClick={canAccessPayments ? () => navigate('/payments', { 
                            state: { 
                              preselectedBookingId: booking.id,
                              bookingEventName: booking.event_name,
                              autoOpenRecord: booking.payment_status !== 'PAID' 
                            } 
                          }) : undefined}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: booking.payment_status === 'PAID' ? '#dcfce7' : booking.payment_status === 'PARTIAL' ? '#ffedd5' : '#fee2e2',
                            color: booking.payment_status === 'PAID' ? '#166534' : booking.payment_status === 'PARTIAL' ? '#c2410c' : '#991b1b',
                            cursor: canAccessPayments ? 'pointer' : 'default',
                            display: 'inline-block',
                            transition: canAccessPayments ? 'transform 0.15s, box-shadow 0.15s' : undefined
                          }}
                          className={canAccessPayments ? 'hover:scale-105 hover:shadow-sm' : undefined}
                          title={canAccessPayments ? 'Click to view payment history or record new payment' : undefined}
                        >
                          {booking.payment_status}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px', fontWeight: '800', fontSize: '14px', color: hasCollectDue(bookingCollectDue(booking)) ? '#b91c1c' : 'var(--text-dim)' }}>
                        {formatCollectDue(bookingCollectDue(booking))}
                      </td>
                      <td style={{ padding: '20px 24px', fontWeight: '700', fontSize: '14px', color: 'var(--secondary)' }}>
                        <span style={{ fontSize: '80%', opacity: 0.6, marginRight: '2px' }}>PKR</span> 
                        {parseFloat(booking.total_price || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {canManage && (
                          <button onClick={() => handleEditClick(booking)} style={{ color: 'var(--secondary)', backgroundColor: 'transparent', padding: '4px', borderRadius: '4px' }} className="hover:bg-slate-200" title="Edit booking"><Edit2 size={16} /></button>
                          )}
                          <button onClick={() => handlePrintRowClick(booking)} style={{ color: 'var(--primary)', backgroundColor: 'transparent', padding: '4px', borderRadius: '4px' }} className="hover:bg-orange-50" title="Print receipts & reports"><Printer size={16} /></button>
                          {canManage && booking.booking_status !== 'CANCELLED' && booking.booking_status !== 'COMPLETED' && (
                          <button onClick={() => setCancelTarget(booking)} style={{ color: '#b91c1c', backgroundColor: 'transparent', padding: '4px', borderRadius: '4px' }} className="hover:bg-red-50" title="Cancel booking"><XCircle size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBookings.length === 0 && !isLoading && (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '15px', fontWeight: '500' }}>No reservations match your criteria.</p>
                  {canManage && (
                  <button className="btn-secondary" onClick={handleCreateNewClick} style={{ marginTop: '16px' }}>+ Create New Booking</button>
                  )}
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
                <button type="button" onClick={() => setViewMode('list')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }} className="hover:bg-slate-100">
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--secondary)' }}>
                    {viewMode === 'create' ? 'Booking Request' : 'Modify Booking Details'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>Fill in the details to reserve a hall slot.</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {(() => {
                  const st = BOOKING_STATUS_STYLE[formData.booking_status] || BOOKING_STATUS_STYLE.PENDING;
                  return (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        backgroundColor: st.bg,
                        color: st.color,
                      }}
                    >
                      {st.label}
                    </span>
                  );
                })()}
                <select
                  value={formData.booking_status}
                  onChange={(e) => setFormData({ ...formData, booking_status: e.target.value })}
                  aria-label="Booking status"
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: 'var(--surface)',
                    color: 'var(--text-main)',
                  }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {bookingError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px 20px', color: '#b91c1c', fontSize: '14px', fontWeight: '600', marginBottom: '32px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <X size={18} style={{ backgroundColor: '#b91c1c', color: 'white', borderRadius: '50%', padding: '2px' }} />
                {bookingError}
              </div>
            )}

            <div className="booking-layout">
              {/* Form entries - Left hand side */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                
                {/* section: Essentials */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.15em', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '4px', height: '16px', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></span>
                    Essentials
                  </h3>
                  <div className="premium-card form-grid-2 form-grid-2--gap-24" style={{ padding: '28px' }}>
                    <div className="input-group">
                      <label>Booking ID</label>
                      <input type="text" readOnly value={formData.booking_id || 'BK-2026-AUTO'} style={{ backgroundColor: 'var(--surface-muted)', color: 'var(--text-dim)', fontWeight: 'bold', fontFamily: 'monospace' }} />
                    </div>
                    <div className="input-group">
                      <label>Booking Date</label>
                      <input type="date" required disabled={isEdit} value={formData.booking_date} onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })} style={isEdit ? { backgroundColor: 'var(--surface-elevated)', color: 'var(--text-dim)', cursor: 'not-allowed' } : {}} />
                    </div>
                    <div className="input-group">
                      <label>Event Date</label>
                      <input type="date" required disabled={isEdit} value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} style={isEdit ? { backgroundColor: 'var(--surface-elevated)', color: 'var(--text-dim)', cursor: 'not-allowed' } : {}} />
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
                        style={isEdit ? { backgroundColor: 'var(--surface-elevated)', color: 'var(--text-dim)', cursor: 'not-allowed' } : {}}
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
                      <div style={{ display: 'flex', backgroundColor: 'var(--toggle-track)', borderRadius: '8px', padding: '2px' }}>
                        <button type="button" onClick={() => { setNewCustomerMode(false); setScannedClient(null); }} style={{ fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '6px', backgroundColor: !newCustomerMode ? 'var(--surface)' : 'transparent', color: !newCustomerMode ? 'var(--secondary)' : 'var(--text-dim)', boxShadow: !newCustomerMode ? 'var(--shadow-sm)' : 'none' }}>
                          Select Client
                        </button>
                        <button type="button" onClick={() => { setNewCustomerMode(true); setScannedClient(null); }} style={{ fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '6px', backgroundColor: newCustomerMode ? 'var(--surface)' : 'transparent', color: newCustomerMode ? 'var(--secondary)' : 'var(--text-dim)', boxShadow: newCustomerMode ? 'var(--shadow-sm)' : 'none' }}>
                          + Add Client
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px' }}>
                    {!newCustomerMode ? (
                      <div className="input-group">
                        <label>Existing Client / Customer</label>
                        <select
                          required={!newCustomerMode}
                          disabled={isEdit}
                          value={formData.customer}
                          onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                          style={isEdit ? { backgroundColor: 'var(--surface-elevated)', color: 'var(--text-dim)', cursor: 'not-allowed' } : {}}
                        >
                          <option value="">Select Customer</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {customerDisplayName(c)} ({c.phone})
                            </option>
                          ))}
                        </select>
                        {formData.customer && (
                          <Link
                            to={`/customers/${formData.customer}`}
                            style={{ marginTop: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--primary)', display: 'inline-block' }}
                          >
                            View customer profile →
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <CnicScannerPanel
                          onScan={handleIdScan}
                          disabled={scanProcessing || savingScannedClient}
                        />
                        {scannedClient ? (
                          <ScannedGuestPanel
                            draft={scannedClient}
                            loading={scanProcessing}
                            saving={savingScannedClient}
                            onChange={handleScannedClientChange}
                            onPhoneChange={handleScannedClientPhoneChange}
                            onSave={() => saveClientFromScan(scannedClient)}
                            onCancel={() => setScannedClient(null)}
                          />
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="input-group">
                              <label>Full Name</label>
                              <input type="text" required placeholder="e.g. Muhammad Ali Khan" value={newCustomer.full_name} onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })} />
                            </div>
                            <div className="input-group">
                              <label>CNIC</label>
                              <input type="text" placeholder="e.g. 35202-1234567-9" value={newCustomer.cnic} onChange={(e) => setNewCustomer({ ...newCustomer, cnic: e.target.value })} style={{ fontFamily: 'monospace' }} />
                            </div>
                            <div className="input-group">
                              <label>Phone Number</label>
                              <input type="tel" required placeholder="+92 300 0000000" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                            </div>
                            <div className="input-group">
                              <label>Email Address <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>(optional)</span></label>
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
                                  transition: 'opacity 0.2s',
                                }}
                                className="hover:opacity-90"
                              >
                                <Plus size={16} /> Save & Select Client
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* section: Venue & Logistics */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.15em', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '4px', height: '16px', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></span>
                    Venue & Logistics
                  </h3>
                  <div className="premium-card form-grid-2 form-grid-2--gap-24" style={{ padding: '28px' }}>
                    
                    {/* Venue & Slot Segmented control */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="input-group">
                        <label>Select Venue Hall</label>
                        {!formData.venue && !isEdit && (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>No hall selected - tap a hall below</p>
                        )}
                        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--toggle-track)', borderRadius: '8px', padding: '3px', flexWrap: 'wrap' }}>
                          {halls.length === 0 && (
                            <span style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '8px 12px' }}>No halls available. Add a hall first.</span>
                          )}
                          {hallsForSelect.map(h => {
                            const isSel = formData.venue !== '' && String(formData.venue) === String(h.id);
                            return (
                              <button
                                key={h.id}
                                type="button"
                                disabled={isEdit}
                                onClick={() => {
                                  if (isSel) {
                                    setFormData({ ...formData, venue: '', rate_per_head: 1200 });
                                  } else {
                                    setFormData({ ...formData, venue: h.id, rate_per_head: h.price_per_head || 1200 });
                                  }
                                }}
                                style={{
                                  flex: 1,
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: isSel ? 'white' : 'transparent',
                                  color: isSel ? 'var(--primary)' : 'var(--text-dim)',
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
                        {!formData.slot && !isEdit && (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>No timing selected - choose Morning or Evening</p>
                        )}
                        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--toggle-track)', borderRadius: '8px', padding: '3px' }}>
                          {['morning', 'evening'].map(s => {
                            const isSel = formData.slot === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                disabled={isEdit}
                                onClick={() => setFormData({ ...formData, slot: isSel ? '' : s })}
                                style={{
                                  flex: 1,
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: isSel ? 'white' : 'transparent',
                                  color: isSel ? 'var(--primary)' : 'var(--text-dim)',
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
                      <div className="form-grid-2">
                        <div className="input-group">
                          <label>Gents Guest</label>
                          <input type="number" min="0" placeholder="-" value={displayNumField(formData.gents_count)} onChange={(e) => setFormData({ ...formData, gents_count: toIntField(e.target.value) })} />
                        </div>
                        <div className="input-group">
                          <label>Ladies Guest</label>
                          <input type="number" min="0" placeholder="-" value={displayNumField(formData.ladies_count)} onChange={(e) => setFormData({ ...formData, ladies_count: toIntField(e.target.value) })} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#fcfcfd', border: '1px solid var(--border)', borderRadius: '12px', marginTop: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Total Attendance</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)' }}>{totalAttendance}</span>
                          {(() => {
                            const sel = halls.find(h => String(h.id) === String(formData.venue));
                            return sel ? <p style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '500' }}>(Max Limit: {sel.capacity})</p> : null;
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
                        <input type="number" step="0.5" min="0" placeholder="-" value={displayNumField(formData.overtime_hours)} onChange={(e) => setFormData({ ...formData, overtime_hours: toFloatField(e.target.value) })} style={{ width: '100%', paddingRight: '40px' }} />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: '700', color: 'var(--text-dim)' }}>HRS</span>
                      </div>
                    </div>

                    <div className="input-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kitchen Services (PKR)</label>
                      <input type="number" min="0" placeholder="-" value={displayNumField(formData.kitchen_charge)} onChange={(e) => setFormData({ ...formData, kitchen_charge: toFloatField(e.target.value) })} />
                    </div>

                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={12} /> Decoration package (optional)
                      </label>
                      <select
                        value={selectedDecorationId}
                        onChange={(e) => handleDecorationPackageSelect(e.target.value)}
                        style={{ width: '100%', marginBottom: '8px' }}
                      >
                        <option value="">- Custom amount only -</option>
                        {decorationPackages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} ({pkg.tier}) - Rs {Number(pkg.base_price || 0).toLocaleString()}
                          </option>
                        ))}
                      </select>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Decorations charge (PKR)</label>
                      <input type="number" min="0" placeholder="-" value={displayNumField(formData.decoration_charge)} onChange={(e) => setFormData({ ...formData, decoration_charge: toFloatField(e.target.value) })} />
                    </div>

                    <div className="input-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deg Cooking Count</label>
                      <input type="number" min="0" placeholder="-" value={displayNumField(formData.deg_count)} onChange={(e) => setFormData({ ...formData, deg_count: toIntField(e.target.value) })} />
                    </div>

                    <div className="input-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Generator Usage (PKR)</label>
                      <input type="number" min="0" placeholder="-" value={displayNumField(formData.generator_charge)} onChange={(e) => setFormData({ ...formData, generator_charge: toFloatField(e.target.value) })} />
                    </div>
                  </div>
                </section>

                <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={14} /> Inventory for this event
                  </h3>
                  <div className="premium-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {inventoryLines.map((line, idx) => (
                      <div key={line.id || `line-${idx}`} className="form-grid-2" style={{ alignItems: 'end' }}>
                        <div className="input-group">
                          <label style={{ fontSize: '11px' }}>Item</label>
                          <select
                            value={line.inventory_item}
                            onChange={(e) => {
                              const next = [...inventoryLines];
                              next[idx] = { ...next[idx], inventory_item: e.target.value };
                              setInventoryLines(next);
                            }}
                          >
                            <option value="">Select item</option>
                            {inventoryCatalog.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({item.quantity} {item.unit} available)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div className="input-group" style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px' }}>Qty used</label>
                            <input
                              type="number"
                              min="1"
                              value={line.quantity_used}
                              onChange={(e) => {
                                const next = [...inventoryLines];
                                next[idx] = { ...next[idx], quantity_used: e.target.value };
                                setInventoryLines(next);
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setInventoryLines(inventoryLines.filter((_, i) => i !== idx))}
                            style={{ alignSelf: 'flex-end', padding: '10px', background: 'transparent', color: '#b91c1c' }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setInventoryLines([...inventoryLines, { inventory_item: '', quantity_used: 1 }])}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      + Add inventory item
                    </button>
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
                        <input type="number" min="0" disabled={isEdit} value={displayNumField(formData.rate_per_head)} onChange={(e) => setFormData({ ...formData, rate_per_head: toFloatField(e.target.value) })} style={isEdit ? { width: '100%', textAlign: 'right', fontSize: '13px', padding: '4px 8px', fontWeight: '700', backgroundColor: 'var(--surface-elevated)', color: 'var(--text-dim)', cursor: 'not-allowed' } : { width: '100%', textAlign: 'right', fontSize: '13px', padding: '4px 8px', fontWeight: '700' }} />
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

                    {isEdit && (
                      <div className="input-group" style={{ marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Booking status</label>
                        <select
                          value={formData.booking_status}
                          onChange={(e) => setFormData({ ...formData, booking_status: e.target.value })}
                          style={{ width: '100%' }}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    )}

                    {/* Total billing block */}
                    <div style={{ backgroundColor: 'var(--background)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>Grand Total</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary)', marginRight: '4px' }}>PKR</span>
                          <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--primary)', tracking: '-0.02em' }}>{grandTotal.toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Advance Paid</span>
                        <input type="number" min="0" placeholder="-" disabled={isEdit} value={displayNumField(formData.advance_paid)} onChange={(e) => setFormData({ ...formData, advance_paid: toFloatField(e.target.value) })} style={isEdit ? { width: '100px', padding: '4px 8px', fontSize: '12px', textAlign: 'right', fontWeight: '700', backgroundColor: 'var(--surface-elevated)', color: 'var(--text-dim)', cursor: 'not-allowed' } : { width: '100px', padding: '4px 8px', fontSize: '12px', textAlign: 'right', fontWeight: '700' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', tracking: '0.05em', color: hasCollectDue(remainingBalance) ? 'var(--error)' : 'var(--text-dim)' }}>Due</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: hasCollectDue(remainingBalance) ? 'var(--error)' : 'var(--text-dim)', tracking: '-0.02em' }}>{formatCollectDuePKR(remainingBalance)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                      <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '10px', fontWeight: '700', fontSize: '14px' }}>
                        <CheckCircle size={18} />
                        {formData.booking_status === 'CONFIRMED' ? 'Confirm & Save' : 'Save booking'}
                      </button>
                      {viewMode === 'create' && (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '13px' }}
                          onClick={(e) => handleSubmit(e, 'PENDING')}
                        >
                          <Clock size={18} /> Save as Pending
                        </button>
                      )}

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

      <CancelBookingModal
        booking={cancelTarget}
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelled={fetchData}
      />
    </div>
  );
};

export default Bookings;
