import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  MoreVertical,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: ''
  });

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await client.get('/customers/');
      setCustomers(response.data.results || response.data || []);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setCurrentCustomer(customer);
      setIsEditing(true);
    } else {
      setCurrentCustomer({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: ''
      });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await client.put(`/customers/${currentCustomer.id}/`, currentCustomer);
        toast.success('Customer updated');
      } else {
        await client.post('/customers/', currentCustomer);
        toast.success('Customer added');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this customer?')) {
      try {
        await client.delete(`/customers/${id}/`);
        toast.success('Customer deleted');
        fetchCustomers();
      } catch (err) {
        toast.error('Failed to delete');
      }
    }
  };

  return (
    <>
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Customer CRM</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage your leads and loyal customers in one place.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={18} /> Add Customer
        </button>
      </div>

      <div className="card" style={{ marginBottom: '32px', padding: '16px 24px', display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            style={{ width: '100%', paddingLeft: '40px', backgroundColor: 'var(--background)' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700' }}>Customer</th>
              <th style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700' }}>Contact</th>
              <th style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700' }}>Registered</th>
              <th style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-row">
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                      {customer.first_name[0]}{customer.last_name[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '14px' }}>{customer.first_name} {customer.last_name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {String(customer.id).substring(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <Mail size={14} /> {customer.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <Phone size={14} /> {customer.phone}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-muted)' }}>
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => handleOpenModal(customer)} style={{ color: 'var(--secondary)', backgroundColor: 'transparent' }}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(customer.id)} style={{ color: '#ef4444', backgroundColor: 'transparent' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && !isLoading && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No customers found.</div>
        )}
      </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>{isEditing ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button onClick={() => setShowModal(false)} style={{ backgroundColor: 'transparent', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label>First Name</label>
                  <input required value={currentCustomer.first_name} onChange={(e) => setCurrentCustomer({ ...currentCustomer, first_name: e.target.value })} placeholder="John" />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input required value={currentCustomer.last_name} onChange={(e) => setCurrentCustomer({ ...currentCustomer, last_name: e.target.value })} placeholder="Doe" />
                </div>
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" required value={currentCustomer.email} onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })} placeholder="john@example.com" />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input required value={currentCustomer.phone} onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })} placeholder="0300 1234567" />
              </div>
              <div className="input-group">
                <label>Address</label>
                <textarea value={currentCustomer.address} onChange={(e) => setCurrentCustomer({ ...currentCustomer, address: e.target.value })} rows="2" style={{ width: '100%' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                {isEditing ? 'Update Customer' : 'Add Customer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerManagement;
