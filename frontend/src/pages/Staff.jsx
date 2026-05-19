import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, X, Trash2 } from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  ADMIN:   { bg: '#fef3c7', color: '#92400e' },
  MANAGER: { bg: '#dbeafe', color: '#1e40af' },
  STAFF:   { bg: '#dcfce7', color: '#166534' },
};

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', role: 'STAFF',
  });

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await client.get('/auth/staff/');
      setStaff(response.data.results || response.data || []);
    } catch (err) {
      toast.error('Failed to fetch staff');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await client.post('/auth/staff/', formData);
      toast.success('Staff added! Default password: staff123');
      setShowModal(false);
      setFormData({ first_name: '', last_name: '', email: '', role: 'STAFF' });
      fetchStaff();
    } catch (err) {
      const msg = err.response?.data?.email?.[0] || 'Failed to add staff';
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove this staff member?')) {
      try {
        await client.delete(`/auth/staff/${id}/`);
        toast.success('Staff member removed');
        fetchStaff();
      } catch (err) {
        toast.error('Failed to remove staff');
      }
    }
  };

  return (
    <>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Staff Management</h2>
            <p style={{ color: 'var(--text-muted)' }}>Manage your team and their access levels.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} /> Add Staff Member
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading staff...</div>
        ) : staff.length === 0 ? (
          <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <UserPlus size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '16px', fontWeight: '600' }}>No staff members yet</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Click "Add Staff Member" to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {staff.map(member => {
              const roleStyle = ROLE_COLORS[member.role] || ROLE_COLORS.STAFF;
              const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}` || member.email[0].toUpperCase();
              return (
                <div key={member.id} className="premium-card" style={{ position: 'relative' }}>
                  <button
                    onClick={() => handleDelete(member.id)}
                    style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'transparent', color: '#ef4444' }}
                  >
                    <Trash2 size={18} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                      backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '700', fontSize: '18px'
                    }}>
                      {initials}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700' }}>{member.first_name} {member.last_name}</h3>
                      <span style={{
                        display: 'inline-block', marginTop: '4px',
                        padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                        backgroundColor: roleStyle.bg, color: roleStyle.color
                      }}>
                        {member.role}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Mail size={14} /> {member.email}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Add Staff Member</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Default login password: <strong>staff123</strong>
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ backgroundColor: 'transparent', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label>First Name</label>
                  <input required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} placeholder="Jane" />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} placeholder="Smith" />
                </div>
              </div>
              <div className="input-group">
                <label>Work Email</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jane@gateway.com" />
              </div>
              <div className="input-group">
                <label>Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                Create Staff Account
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Staff;
