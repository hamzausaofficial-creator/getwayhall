import React, { useState, useEffect } from 'react';
import SearchInput from '../components/SearchInput';
import {
  Plus,
  MapPin,
  Users,
  DollarSign,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon
} from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';
import { usePermissions } from '../hooks/usePermissions';

const HallManagement = () => {
  const { canManage } = usePermissions();
  const [halls, setHalls] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentHall, setCurrentHall] = useState({
    name: '',
    location: '',
    capacity: '',
    price_per_day: '',
    description: '',
    status: 'ACTIVE',
    image: null
  });

  const fetchHalls = async () => {
    setIsLoading(true);
    try {
      const response = await client.get('/venues/');
      setHalls(response.data.results || response.data || []);
    } catch (err) {
      toast.error('Failed to load halls');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHalls();
  }, []);

  const handleOpenModal = (hall = null) => {
    if (!canManage) {
      toast.error('You do not have permission to modify halls.');
      return;
    }
    if (hall) {
      setCurrentHall({ ...hall, image: null }); // Don't try to submit the URL as a file
      setIsEditing(true);
    } else {
      setCurrentHall({
        name: '',
        location: '',
        capacity: '',
        price_per_day: '',
        description: '',
        status: 'ACTIVE',
        image: null
      });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', currentHall.name);
      formData.append('location', currentHall.location);
      formData.append('capacity', currentHall.capacity);
      formData.append('price_per_day', currentHall.price_per_day);
      formData.append('description', currentHall.description);
      formData.append('status', currentHall.status);
      
      if (currentHall.image instanceof File) {
        formData.append('image', currentHall.image);
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (isEditing) {
        await client.put(`/venues/${currentHall.id}/`, formData, config);
        toast.success('Hall updated successfully');
      } else {
        await client.post('/venues/', formData, config);
        toast.success('Hall added successfully');
      }
      setShowModal(false);
      fetchHalls();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed');
    }
  };

  const filteredHalls = halls.filter((hall) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (hall.name || '').toLowerCase().includes(q) ||
      (hall.location || '').toLowerCase().includes(q) ||
      (hall.description || '').toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id) => {
    if (!canManage) return;
    if (window.confirm('Are you sure you want to delete this hall?')) {
      try {
        await client.delete(`/venues/${id}/`);
        toast.success('Hall deleted');
        fetchHalls();
      } catch (err) {
        toast.error('Failed to delete hall');
      }
    }
  };

  return (
    <>
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Hall Management</h2>
          <p style={{ color: 'var(--text-muted)' }}>Overview of all your available venues and halls.</p>
        </div>
        {canManage && (
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Add New Hall
        </button>
        )}
      </div>

      <div className="search-toolbar">
        <SearchInput
          variant="inset"
          placeholder="Search halls by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading halls...</div>
      ) : (
        <div className="halls-grid">
          {filteredHalls.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {searchQuery ? 'No halls match your search.' : 'No halls yet.'}
            </div>
          ) : filteredHalls.map(hall => (
            <div key={hall.id} className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: '180px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', position: 'relative' }}>
                {hall.image ? (
                  <img src={hall.image} alt={hall.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon size={48} />
                )}
                {canManage && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleOpenModal(hall)} style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'white', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(hall.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'white', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                )}
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{hall.name}</h3>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700',
                    backgroundColor: hall.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                    color: hall.status === 'ACTIVE' ? '#166534' : '#64748b'
                  }}>
                    {hall.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <MapPin size={14} /> {hall.location}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Users size={14} /> {hall.capacity} Guests
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '20px' }}>
                    <span style={{ fontSize: '55%', fontWeight: '600', opacity: 0.6 }}>Rs</span> {parseFloat(hall.price_per_day).toLocaleString()}<span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}> /day</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>{isEditing ? 'Edit Hall' : 'Add New Hall'}</h3>
              <button onClick={() => setShowModal(false)} style={{ backgroundColor: 'transparent', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label>Hall Name</label>
                <input
                  type="text"
                  required
                  value={currentHall.name}
                  onChange={(e) => setCurrentHall({ ...currentHall, name: e.target.value })}
                  placeholder="e.g. Grand Ballroom"
                />
              </div>
              <div className="input-group">
                <label>Location</label>
                <input
                  type="text"
                  required
                  value={currentHall.location}
                  onChange={(e) => setCurrentHall({ ...currentHall, location: e.target.value })}
                  placeholder="e.g. 1st Floor"
                />
              </div>
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Capacity</label>
                  <input
                    type="number"
                    required
                    value={currentHall.capacity}
                    onChange={(e) => setCurrentHall({ ...currentHall, capacity: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div className="input-group">
                  <label>Price Per Day (PKR)</label>
                  <input
                    type="number"
                    required
                    value={currentHall.price_per_day}
                    onChange={(e) => setCurrentHall({ ...currentHall, price_per_day: e.target.value })}
                    placeholder="2500"
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={currentHall.description}
                  onChange={(e) => setCurrentHall({ ...currentHall, description: e.target.value })}
                  placeholder="Tell us about this hall..."
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>
              <div className="input-group">
                <label>Status</label>
                <select
                  value={currentHall.status}
                  onChange={(e) => setCurrentHall({ ...currentHall, status: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="ACTIVE">Active — available for bookings</option>
                  <option value="INACTIVE">Inactive — hidden from new bookings</option>
                </select>
              </div>
              <div className="input-group">
                <label>Hall Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCurrentHall({ ...currentHall, image: e.target.files[0] })}
                  style={{ padding: '8px 0' }}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                {isEditing ? 'Update Hall' : 'Add Hall'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default HallManagement;
