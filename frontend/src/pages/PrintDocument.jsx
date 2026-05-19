import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, 
  ChevronLeft, 
  Sparkles, 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle,
  Building,
  User,
  FileCheck,
  Edit,
  Save,
  Check
} from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';

// HTML5 Canvas Digital Signature Pad Component
const SignaturePad = ({ label, subtitle, onSave }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0f172a'; // Deep Navy Ink
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Set canvas resolution for crisp drawing
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Initial white background fill
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasSigned) {
      onSave(canvas.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasSigned(false);
    onSave(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: '12px', fontWeight: '800', color: '#f1f5f9' }}>{label}</span>
        <span style={{ fontSize: '9px', color: '#94a3b8' }}>{subtitle}</span>
      </div>
      
      <div style={{ 
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        borderRadius: '10px', 
        overflow: 'hidden', 
        backgroundColor: 'white', 
        cursor: 'crosshair',
        touchAction: 'none' // Essential to stop scrolling on mobile/tablet while signing
      }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ display: 'block', width: '100%', height: '80px' }}
        />
      </div>
      
      <button 
        type="button" 
        onClick={clear}
        style={{
          alignSelf: 'flex-end',
          padding: '4px 10px',
          fontSize: '9px',
          fontWeight: '700',
          color: hasSigned ? '#ef4444' : '#64748b',
          backgroundColor: hasSigned ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          border: '1px solid ' + (hasSigned ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)'),
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        Clear Pad
      </button>
    </div>
  );
};

const PrintDocument = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [venue, setVenue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDocType, setActiveDocType] = useState('final_bill');

  // Digital Signatures Base64 States
  const [officerSig, setOfficerSig] = useState(null);
  const [customerSig, setCustomerSig] = useState(null);

  // Editable State Variables
  const [isEditable, setIsEditable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCnic, setCustomerCnic] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  const [eventName, setEventName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [slot, setSlot] = useState('');

  const [gentsCount, setGentsCount] = useState(0);
  const [ladiesCount, setLadiesCount] = useState(0);
  const [ratePerHead, setRatePerHead] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [kitchenCharge, setKitchenCharge] = useState(0);
  const [decorationCharge, setDecorationCharge] = useState(0);
  const [generatorCharge, setGeneratorCharge] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);

  useEffect(() => {
    const fetchPrintData = async () => {
      setIsLoading(true);
      try {
        const bookingRes = await client.get(`/bookings/${bookingId}/`);
        const bookingData = bookingRes.data;
        setBooking(bookingData);

        // Populate initial editable states
        setEventName(bookingData.event_name || '');
        setVenueName(bookingData.venue_name || '');
        setEventDate(bookingData.event_date || '');
        setSlot(bookingData.slot || 'lunch');
        
        setGentsCount(Number(bookingData.gents_count || 0));
        setLadiesCount(Number(bookingData.ladies_count || 0));
        setRatePerHead(Number(bookingData.rate_per_head || 0));
        setOvertimeHours(Number(bookingData.overtime_hours || 0));
        setKitchenCharge(Number(bookingData.kitchen_charge || 0));
        setDecorationCharge(Number(bookingData.decoration_charge || 0));
        setGeneratorCharge(Number(bookingData.generator_charge || 0));
        setAdvancePaid(Number(bookingData.advance_paid || 0));
        setCustomerCnic(bookingData.cnic || '');

        const [customerRes, venueRes] = await Promise.all([
          client.get(`/customers/${bookingData.customer}/`),
          client.get(`/venues/${bookingData.venue}/`)
        ]);
        
        setCustomer(customerRes.data);
        setCustomerName(`${customerRes.data.first_name || ''} ${customerRes.data.last_name || ''}`);
        setCustomerPhone(customerRes.data.phone || '');
        setCustomerAddress(customerRes.data.address || '');
        
        setVenue(venueRes.data);
        if (!bookingData.venue_name) {
          setVenueName(venueRes.data.name || '');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load printing data');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchPrintData();
    }
  }, [bookingId]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(91, 213, 30, 0.2)',
          borderTop: '3px solid #5BD51E',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <p style={{ fontSize: '16px', fontWeight: '600', color: '#94a3b8' }}>Preparing Document Assets...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        color: 'white',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', color: '#ef4444' }}>Document Not Found</h2>
        <p style={{ color: '#94a3b8', marginBottom: '24px', maxWidth: '400px' }}>
          The reservation you are trying to print could not be retrieved from the server database.
        </p>
        <button 
          onClick={() => navigate('/dashboard/bookings')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#5BD51E',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  // Pre-calculated values based on editable state variables
  const totalAttendance = Number(gentsCount || 0) + Number(ladiesCount || 0);
  const subtotal = totalAttendance * Number(ratePerHead || 0);
  const extraServices = (Number(overtimeHours || 0) * 5000) + 
                        Number(kitchenCharge || 0) + 
                        Number(decorationCharge || 0) + 
                        Number(generatorCharge || 0);
  const totalBeforeTax = subtotal + extraServices;
  const taxAmount = totalBeforeTax * 0.05;
  const grandTotal = totalBeforeTax + taxAmount;
  const remainingBalance = grandTotal - Number(advancePaid || 0);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Split customer name
      const nameParts = customerName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // 1. Update customer first
      await client.patch(`/customers/${booking.customer}/`, {
        first_name: firstName,
        last_name: lastName,
        phone: customerPhone,
        address: customerAddress
      });

      // 2. Update booking details
      const updatedBooking = await client.patch(`/bookings/${bookingId}/`, {
        event_name: eventName,
        venue_name: venueName,
        event_date: eventDate,
        slot: slot,
        gents_count: gentsCount,
        ladies_count: ladiesCount,
        rate_per_head: ratePerHead,
        overtime_hours: overtimeHours,
        kitchen_charge: kitchenCharge,
        decoration_charge: decorationCharge,
        generator_charge: generatorCharge,
        advance_paid: advancePaid,
        cnic: customerCnic
      });

      setBooking(updatedBooking.data);
      toast.success('Changes successfully saved to database!');
      setIsEditable(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes to database');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper helper to render plain text or borderless input when editable mode is on
  const renderInput = (value, onChange, type = 'text', options = {}) => {
    if (!isEditable) {
      return <span style={{ fontWeight: options.fontWeight || '600', color: '#0f172a' }}>{value}</span>;
    }
    return (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{
          border: '1px solid #5BD51E',
          borderRadius: '4px',
          padding: '2px 6px',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          fontWeight: options.fontWeight || '600',
          color: '#0f172a',
          width: options.width || '100%',
          backgroundColor: '#f5fdf2',
          boxSizing: 'border-box',
          ...options.style
        }}
      />
    );
  };

  const renderSelect = (value, onChange, choices) => {
    if (!isEditable) {
      return <span style={{ textTransform: 'capitalize', fontWeight: '600', color: '#0f172a' }}>{value}</span>;
    }
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: '1px solid #5BD51E',
          borderRadius: '4px',
          padding: '2px 6px',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          fontWeight: '600',
          color: '#0f172a',
          backgroundColor: '#f5fdf2'
        }}
      >
        {choices.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a', // Sleek Premium Dark Slate Background
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      paddingBottom: '60px',
      boxSizing: 'border-box'
    }}>
      {/* Print styles override */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #non-printable-toolbar {
            display: none !important;
          }
          #non-printable-sig-panel {
            display: none !important;
          }
          #printable-document-container {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            min-height: auto !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .printable-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          input, select, textarea {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            color: black !important;
            font-weight: inherit !important;
            appearance: none !important;
            -webkit-appearance: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Floating Glass Toolbar */}
      <div id="non-printable-toolbar" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Back navigation */}
        <button 
          onClick={() => navigate('/dashboard/bookings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#f8fafc',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <ChevronLeft size={16} /> Bookings List
        </button>

        {/* Document Selection Segmented Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '4px',
          gap: '2px'
        }}>
          {[
            { id: 'advance_receipt', label: 'Advance Receipt', icon: <DollarSign size={14} />, desc: 'ایڈوانس وصولی کی رسیڈ' },
            { id: 'final_bill', label: 'Final Bill Summary', icon: <FileText size={14} />, desc: 'ایونٹ کا فائنل بل' },
            { id: 'operations_report', label: 'Setup & Logistics', icon: <Clock size={14} />, desc: 'تفصیلی رپورٹ' }
          ].map(tab => {
            const isActive = activeDocType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDocType(tab.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '6px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isActive ? '#5BD51E' : 'transparent',
                  color: isActive ? 'white' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '150px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '13px' }}>
                  {tab.icon}
                  {tab.label}
                </div>
                <span style={{ fontSize: '9px', opacity: isActive ? 0.9 : 0.6, marginTop: '2px' }}>{tab.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Print Button */}
        <button 
          onClick={handlePrint}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#5BD51E',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 24px',
            color: 'white',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(91, 213, 30, 0.4)',
            transition: 'all 0.2s'
          }}
        >
          <Printer size={18} /> Print Document
        </button>
      </div>

      {/* Side-by-Side Flex Workspace Container */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '40px',
        maxWidth: '1220px',
        margin: '40px auto 0 auto',
        padding: '0 20px',
        boxSizing: 'border-box'
      }}>
        
        {/* Left Side: Real A4 Centered Sheet Layout */}
        <div id="printable-document-container" style={{
          flex: '1',
          maxWidth: '820px',
          boxSizing: 'border-box'
        }}>
          
          {/* A4 White Sheet card */}
          <div className="printable-card" style={{
            backgroundColor: 'white',
            color: '#1e293b',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '60px 50px',
            minHeight: '1000px', // exact paper weight impression
            boxSizing: 'border-box',
            position: 'relative'
          }}>
            
            {/* Watermark in Preview */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-35deg)',
              opacity: 0.02,
              fontSize: '90px',
              fontWeight: '900',
              color: '#0f172a',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Gateway Hallora
            </div>

            {/* DOCUMENT HEADER */}
            <div style={{ borderBottom: '3px double #5BD51E', paddingBottom: '20px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Building size={24} color="#5BD51E" />
                  <h1 style={{ fontSize: '26px', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.02em', margin: 0 }}>GATEWAY MARRIAGE HALL</h1>
                </div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', margin: '2px 0' }}>Professional Venue & Event Planners</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '1px 0' }}>Main Bypass Chowk, Near Civic Center | +92 300 1234567</p>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  display: 'inline-block', 
                  backgroundColor: activeDocType === 'advance_receipt' ? '#f5fdf2' : activeDocType === 'final_bill' ? '#f0fdf4' : '#f8fafc',
                  color: activeDocType === 'advance_receipt' ? '#288005' : activeDocType === 'final_bill' ? '#166534' : '#475569',
                  fontSize: '11px', 
                  fontWeight: '800', 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  textTransform: 'uppercase', 
                  marginBottom: '8px',
                  border: '1px solid ' + (activeDocType === 'advance_receipt' ? '#e2facb' : activeDocType === 'final_bill' ? '#dcfce7' : '#e2e8f0')
                }}>
                  {activeDocType === 'advance_receipt' ? 'Deposit Record' : activeDocType === 'final_bill' ? 'Invoice Summary' : 'Ops Spec Sheet'}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'monospace', margin: 0, color: '#0f172a' }}>
                  {booking.booking_id || `BK-${booking.id}`}
                </h3>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Date Issued: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* TWO COLUMN INFO META GRID */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '40px', 
              marginBottom: '32px', 
              border: '1px solid #e2e8f0', 
              padding: '24px', 
              borderRadius: '12px', 
              backgroundColor: '#f8fafc' 
            }}>
              <div>
                <h4 style={{ fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', tracking: '0.05em', color: '#5BD51E', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} /> Client Details
                </h4>
                <p style={{ margin: '6px 0', fontSize: '13px', color: '#334155' }}>
                  <strong>Full Name:</strong> {renderInput(customerName, setCustomerName, 'text', { fontWeight: '700' })}
                </p>
                <p style={{ margin: '6px 0', fontSize: '13px', color: '#334155' }}>
                  <strong>Phone:</strong> {renderInput(customerPhone, setCustomerPhone)}
                </p>
                <p style={{ margin: '6px 0', fontSize: '13px', color: '#334155' }}>
                  <strong>CNIC/ID Card:</strong> {renderInput(customerCnic, setCustomerCnic)}
                </p>
                <p style={{ margin: '6px 0', fontSize: '13px', color: '#334155', lineHeight: '1.4' }}>
                  <strong>Address:</strong> {renderInput(customerAddress, setCustomerAddress)}
                </p>
              </div>
              
              <div>
                <h4 style={{ fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', tracking: '0.05em', color: '#5BD51E', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={13} /> Reservation Specs
                </h4>
                <p style={{ margin: '6px 0', fontSize: '13px', color: '#334155' }}>
                  <strong>Event Title:</strong> {renderInput(eventName, setEventName, 'text', { fontWeight: '700' })}
                </p>
                <p style={{ margin: '6px 0', fontSize: '13px', color: '#334155' }}>
                  <strong>Venue Selected:</strong> {renderInput(venueName, setVenueName)}
                </p>
                <p style={{ margin: '6px 0', fontSize: '13px', color: '#334155' }}>
                  <strong>Event Date:</strong> {renderInput(eventDate, setEventDate, 'date')}
                </p>
                <p style={{ margin: '6px 0', fontSize: '13px', color: '#334155' }}>
                  <strong>Timing Slot:</strong> {renderSelect(slot, setSlot, [{ value: 'lunch', label: 'Lunch' }, { value: 'dinner', label: 'Dinner' }])}
                </p>
              </div>
            </div>

            {/* ACTIVE TEMPLATE VIEWS */}
            
            {/* Tab 1: Advance Receipt View */}
            {activeDocType === 'advance_receipt' && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ 
                  backgroundColor: '#f5fdf2', 
                  border: '1.5px dashed #c0f7a6', 
                  padding: '24px 30px', 
                  borderRadius: '12px', 
                  textAlign: 'center', 
                  marginBottom: '32px' 
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#288005', textTransform: 'uppercase', tracking: '0.1em' }}>Secure Booking Advance Amount (ایڈوانس رقم کی تفصیل)</span>
                  <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#5BD51E', margin: '8px 0', letterSpacing: '-0.03em' }}>
                    PKR {isEditable ? (
                       <span style={{ fontSize: '18px' }}>
                        {renderInput(advancePaid, setAdvancePaid, 'number', { style: { textAlign: 'center', maxWidth: '200px' } })}
                      </span>
                    ) : (
                      Number(advancePaid).toLocaleString()
                    )}
                  </h2>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#c0f7a6', color: '#1e5e03', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
                    <CheckCircle size={12} /> SECURED DEPOSIT
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', fontSize: '13px', lineHeight: '1.6' }}>
                  <h5 style={{ fontWeight: '800', fontSize: '14px', marginBottom: '10px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileCheck size={16} color="#5BD51E" /> Contractual Terms & Obligations:
                  </h5>
                  <ol style={{ paddingLeft: '18px', margin: 0, color: '#475569' }}>
                    <li style={{ marginBottom: '8px' }}>The advance payment of <strong>PKR {Number(advancePaid).toLocaleString()}</strong> reserves the venue slot exclusively.</li>
                    <li style={{ marginBottom: '8px' }}>Outstanding contract balance of <strong>PKR {remainingBalance.toLocaleString()}</strong> is strictly due no later than 24 hours prior to the start slot.</li>
                    <li style={{ marginBottom: '8px' }}>Cancellations done less than 14 days before the scheduled event date will forfeit 100% of the securing deposit.</li>
                    <li style={{ marginBottom: '8px' }}>Any damages caused to the venue structure, lighting fixtures, or decorations will be added to the final billing statement.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Tab 2: Event Final Bill View */}
            {activeDocType === 'final_bill' && (
              <div style={{ marginTop: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #5BD51E', fontWeight: '800', color: '#0f172a' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Billing Item & Description</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: '700', color: '#0f172a', display: 'block' }}>Primary Venue Space Reservation</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Attendance: {renderInput(gentsCount, setGentsCount, 'number', { width: '60px' })} gents + {renderInput(ladiesCount, setLadiesCount, 'number', { width: '60px' })} ladies @ PKR {renderInput(ratePerHead, setRatePerHead, 'number', { width: '80px' })}/head
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600' }}>{subtotal.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: '700', color: '#0f172a', display: 'block' }}>Overtime Booking Facility</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {renderInput(overtimeHours, setOvertimeHours, 'number', { width: '60px' })} hours over schedule @ PKR 5,000 / hour
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600' }}>{(Number(overtimeHours) * 5000).toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: '700', color: '#0f172a', display: 'block' }}>Catering Kitchen & Deg Setup</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Preparations setup including kitchen utensils and staff assistance</span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600' }}>
                        {renderInput(kitchenCharge, setKitchenCharge, 'number', { width: '120px' })}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: '700', color: '#0f172a', display: 'block' }}>Elite Decoration & Theme Setup</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Stage layout, premium table fabrics, LED backdrop, and floral arrangements</span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600' }}>
                        {renderInput(decorationCharge, setDecorationCharge, 'number', { width: '120px' })}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1.5px solid #e2e8f0' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: '700', color: '#0f172a', display: 'block' }}>Alternative Power Backups</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Heavy-duty diesel generator diagnostic activation fee</span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600' }}>
                        {renderInput(generatorCharge, setGeneratorCharge, 'number', { width: '120px' })}
                      </td>
                    </tr>
                    
                    {/* Aggregates blocks */}
                    <tr style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '600' }}>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>Subtotal before taxes</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>{totalBeforeTax.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1.5px solid #e2e8f0', fontWeight: '600' }}>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>Provincial Venue Taxes (5% Flat)</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>{taxAmount.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '2px solid #0f172a', fontWeight: '900', color: '#5BD51E', backgroundColor: '#fafbfc' }}>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', textTransform: 'uppercase' }}>Grand Total (Inclusive of All Taxes)</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '18px' }}>PKR {grandTotal.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', fontWeight: '700', color: '#166534' }}>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>Securing Advance Received</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>-{renderInput(advancePaid, setAdvancePaid, 'number', { width: '120px' })}</td>
                    </tr>
                    <tr style={{ fontWeight: '900', fontSize: '15px', color: remainingBalance <= 0 ? '#166534' : '#b91c1c', backgroundColor: '#fcfcfd' }}>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {remainingBalance <= 0 ? 'BALANCE IN FULL (بل مکمل طور پر ادا شدہ)' : 'Net Outstanding Balance Due (باقی رقم واجب الادا)'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '18px' }}>
                        PKR {remainingBalance.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Operations Setup & Logistics View */}
            {activeDocType === 'operations_report' && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                  <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', backgroundColor: '#fafbfc' }}>
                    <h4 style={{ fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', tracking: '0.08em', color: '#0f172a', borderBottom: '1.5px solid #5BD51E', paddingBottom: '6px', marginBottom: '12px' }}>
                      Venue Floor Layout
                    </h4>
                    <p style={{ margin: '8px 0', fontSize: '13px' }}><strong>Target Capacity Limit:</strong> {venue?.capacity || booking.venue_capacity} seats</p>
                    <p style={{ margin: '8px 0', fontSize: '13px' }}><strong>Registered Attendees:</strong> {totalAttendance} guests total</p>
                    <p style={{ margin: '8px 0', fontSize: '13px' }}><strong>Gents Section setup:</strong> {renderInput(gentsCount, setGentsCount, 'number', { width: '80px' })} chairs</p>
                    <p style={{ margin: '8px 0', fontSize: '13px' }}><strong>Ladies Section setup:</strong> {renderInput(ladiesCount, setLadiesCount, 'number', { width: '80px' })} chairs</p>
                    <p style={{ margin: '8px 0', fontSize: '13px' }}><strong>Stage Location:</strong> Central Front Focus</p>
                  </div>
                  
                  <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', backgroundColor: '#fafbfc' }}>
                    <h4 style={{ fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', tracking: '0.08em', color: '#0f172a', borderBottom: '1.5px solid #5BD51E', paddingBottom: '6px', marginBottom: '12px' }}>
                      Catering & Utility Specs
                    </h4>
                    <p style={{ margin: '8px 0', fontSize: '13px' }}><strong>Kitchen Access:</strong> Standard Staff Active</p>
                    <p style={{ margin: '8px 0', fontSize: '13px' }}><strong>Generator Requirement:</strong> {generatorCharge > 0 ? 'Diagnostic Checked Backup Active' : 'No Backup requested'}</p>
                    <p style={{ margin: '8px 0', fontSize: '13px' }}><strong>Power Outage Protocols:</strong> Instant 10-sec switchover</p>
                    <p style={{ margin: '8px 0', fontSize: '13px' }}><strong>Staff Allocation:</strong> 6 Waiters / 2 Kitchen Helps</p>
                  </div>
                </div>

                <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '24px', backgroundColor: '#f8fafc' }}>
                  <h5 style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="#5BD51E" /> Operational Execution Checklist:
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', fontSize: '13px', lineHeight: '1.6' }}>
                    <li style={{ marginBottom: '8px' }}>Floor cleaners must complete sanitization and stage dusting 3 hours before start slot.</li>
                    <li style={{ marginBottom: '8px' }}>Inspect gents & ladies separation curtain structures if double layouts are activated.</li>
                    <li style={{ marginBottom: '8px' }}>Test audio-visual microphones, main ceiling chandelier, and backup gen wiring before guests arrive.</li>
                    <li style={{ marginBottom: '8px' }}>Coordinate dining timing with the kitchen head to ensure hot serving exactly at the scheduled minute.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* DUAL SIGNATURE LINES AT THE BOTTOM */}
            <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-between', padding: '0 20px' }}>
              
              {/* Authorized Officer Signature Column */}
              <div style={{ textAlign: 'center', width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  borderBottom: '1px solid #94a3b8', 
                  width: '100%', 
                  height: '60px', 
                  marginBottom: '8px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'flex-end',
                  position: 'relative'
                }}>
                  {officerSig ? (
                    <img 
                      src={officerSig} 
                      alt="Officer Signature" 
                      style={{ maxHeight: '55px', maxWidth: '100%', objectFit: 'contain' }} 
                    />
                  ) : (
                    <span style={{ fontSize: '10px', color: '#cbd5e1', fontStyle: 'italic', marginBottom: '8px' }}>
                      [ Draw Signature on Right ]
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#334155', margin: 0 }}>Authorized Officer Sign</p>
                <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0' }}>Gateway Management Staff</p>
              </div>
              
              {/* Customer Signature Column */}
              <div style={{ textAlign: 'center', width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  borderBottom: '1px solid #94a3b8', 
                  width: '100%', 
                  height: '60px', 
                  marginBottom: '8px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'flex-end',
                  position: 'relative'
                }}>
                  {customerSig ? (
                    <img 
                      src={customerSig} 
                      alt="Customer Signature" 
                      style={{ maxHeight: '55px', maxWidth: '100%', objectFit: 'contain' }} 
                    />
                  ) : (
                    <span style={{ fontSize: '10px', color: '#cbd5e1', fontStyle: 'italic', marginBottom: '8px' }}>
                      [ Draw Signature on Right ]
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#334155', margin: 0 }}>Customer Acknowledgement</p>
                <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0' }}>Client Contract Holder</p>
              </div>

            </div>

            {/* FOOTER NOTICE */}
            <div style={{ 
              position: 'absolute', 
              bottom: '40px', 
              left: '50px', 
              right: '50px', 
              borderTop: '1px solid #e2e8f0', 
              paddingTop: '16px', 
              textAlign: 'center', 
              fontSize: '11px', 
              color: '#94a3b8' 
            }}>
              This is a computer-generated contract receipt issued by the Hallora SaaS Platform. Hand-drawn digital signatures are verified in real-time.
            </div>

          </div>

        </div>

        {/* Right Side: Sticky Digital Signature Pad & Edit Control Panel */}
        <div id="non-printable-sig-panel" style={{
          width: '320px',
          position: 'sticky',
          top: '100px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          
          {/* Editable Control section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
            <div style={{ backgroundColor: isEditable ? 'rgba(91, 213, 30, 0.15)' : 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Edit size={16} color={isEditable ? '#5BD51E' : '#94a3b8'} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: '900', color: 'white', margin: 0 }}>Editable Mode</h3>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>پرنٹ ایڈیٹ پینل</p>
            </div>
            
            {/* Toggle switch */}
            <button 
              onClick={() => setIsEditable(!isEditable)}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: isEditable ? '#5BD51E' : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: '1px solid ' + (isEditable ? '#5BD51E' : 'rgba(255,255,255,0.1)'),
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isEditable ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Save Changes Button if edited */}
          {isEditable && (
            <button 
              onClick={handleSaveChanges}
              disabled={isSaving}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#166534',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                marginBottom: '20px',
                transition: 'all 0.2s',
                opacity: isSaving ? 0.6 : 1
              }}
              onMouseEnter={(e) => { if(!isSaving) e.currentTarget.style.backgroundColor = '#15803d'; }}
              onMouseLeave={(e) => { if(!isSaving) e.currentTarget.style.backgroundColor = '#166534'; }}
            >
              <Save size={16} /> {isSaving ? 'Saving to Database...' : 'Save to Database'}
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ backgroundColor: 'rgba(91, 213, 30, 0.1)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={16} color="#5BD51E" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '900', color: 'white', margin: 0 }}>Signature Station</h3>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>دستخط کا ڈیجیٹل پینل</p>
            </div>
          </div>
          
          <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '20px' }}>
            Draw directly inside the pads below. The signatures will dynamically sync onto the A4 sheet.
          </p>

          {/* Canvas Signature Pad 1: Officer */}
          <SignaturePad 
            label="1. Authorized Officer" 
            subtitle="انتظامی دستخط"
            onSave={(dataUrl) => setOfficerSig(dataUrl)}
          />

          {/* Canvas Signature Pad 2: Customer */}
          <SignaturePad 
            label="2. Customer Signature" 
            subtitle="گاہک کے دستخط"
            onSave={(dataUrl) => setCustomerSig(dataUrl)}
          />

          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            borderRadius: '10px', 
            backgroundColor: 'rgba(91, 213, 30, 0.05)', 
            border: '1px solid rgba(91, 213, 30, 0.1)',
            fontSize: '10px',
            color: '#5BD51E',
            lineHeight: '1.4',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            ✍️ Touchscreen tablets or mobile screens can be used to sign directly with a finger or stylus.
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrintDocument;
