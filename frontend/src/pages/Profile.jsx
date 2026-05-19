import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Building, Edit3, Settings, Camera, Save, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef(null);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize fields on mount or user change
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      
      // Load custom profile photo from localStorage
      const savedImage = localStorage.getItem(`profile_pic_${user.email}`);
      if (savedImage) {
        setProfileImage(savedImage);
      } else {
        setProfileImage('');
      }
    }
  }, [user]);

  // Handle Photo upload
  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileImage(base64String);
        localStorage.setItem(`profile_pic_${user.email}`, base64String);
        toast.success('Profile photo updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error('First Name, Last Name, and Email are required.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        email: email
      });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
    }
    setIsEditing(false);
  };

  // Styles
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '24px',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
    transition: 'all 0.3s ease'
  };

  const inputStyle = {
    width: '100%',
    height: '50px',
    backgroundColor: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    padding: '0 16px',
    fontSize: '15px',
    color: '#0f172a',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '8px',
    display: 'block'
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 0' }}>
      {/* Title block */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
            My Profile
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: 0 }}>
            Manage your personal credentials, digital profile picture, and access controls.
          </p>
        </div>
      </div>

      <div style={cardStyle}>
        {/* Banner with absolute positioned Avatar */}
        <div style={{ height: '140px', backgroundColor: 'var(--primary-light)', position: 'relative' }}>
          {/* Avatar Area */}
          <div style={{
            position: 'absolute',
            bottom: '-50px',
            left: '40px',
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            backgroundColor: 'white',
            border: '5px solid white',
            boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            overflow: 'hidden'
          }} onClick={handlePhotoClick}>
            
            {profileImage ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }} className="profile-img-container">
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  color: 'white'
                }} className="profile-img-hover">
                  <Camera size={20} />
                </div>
              </div>
            ) : (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                backgroundColor: '#f1f5f9', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative'
              }} className="profile-img-container">
                <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary)' }}>
                  {firstName ? firstName[0].toUpperCase() : 'A'}
                </span>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  color: 'white'
                }} className="profile-img-hover">
                  <Camera size={20} />
                </div>
              </div>
            )}
            
            {/* Hidden Input File */}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handlePhotoChange} 
            />
          </div>

          {/* Edit / Cancel Toggle Button on Banner */}
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '24px',
                backgroundColor: 'white',
                border: '1px solid var(--border)',
                padding: '10px 18px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '700',
                color: '#0f172a',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.04)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'none';
                e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
              }}
            >
              <Edit3 size={16} color="var(--primary)" /> Edit Profile
            </button>
          ) : (
            <button 
              onClick={handleCancel}
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '24px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                padding: '10px 18px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '700',
                color: '#b91c1c',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <X size={16} /> Cancel
            </button>
          )}
        </div>

        {/* CSS inject for hover state of profile picture */}
        <style dangerouslySetInnerHTML={{__html: `
          .profile-img-container:hover .profile-img-hover {
            opacity: 1 !important;
          }
        `}} />

        {/* Content Area */}
        <div style={{ padding: '70px 40px 40px 40px' }}>
          
          {/* User Full Name Header */}
          <div style={{ marginBottom: '40px', borderBottom: '1px solid #f1f5f9', paddingBottom: '24px' }}>
            <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
              {firstName} {lastName}
            </h3>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '12px', 
              fontWeight: '800', 
              backgroundColor: 'rgba(91, 213, 30, 0.1)', 
              color: 'var(--primary)', 
              padding: '6px 12px', 
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <Shield size={12} /> {user?.role || 'Administrator'}
            </span>
          </div>

          {!isEditing ? (
            /* Visual Display Cards */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifycontent: 'center', border: '1px solid #e2e8f0', flexShrink: 0, justifyContent: 'center' }}>
                  <User size={20} color="var(--primary)" />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>First Name</p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{firstName || '-'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifycontent: 'center', border: '1px solid #e2e8f0', flexShrink: 0, justifyContent: 'center' }}>
                  <User size={20} color="var(--primary)" />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Last Name</p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{lastName || '-'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifycontent: 'center', border: '1px solid #e2e8f0', flexShrink: 0, justifyContent: 'center' }}>
                  <Mail size={20} color="var(--primary)" />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Email Address</p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{email || '-'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifycontent: 'center', border: '1px solid #e2e8f0', flexShrink: 0, justifyContent: 'center' }}>
                  <Building size={20} color="var(--primary)" />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Organization</p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Gateway Marriage Hall</p>
                </div>
              </div>
            </div>
          ) : (
            /* Editing Form Panel */
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* First Name Input */}
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    style={inputStyle}
                    required
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary)';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 4px rgba(91, 213, 30, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = '#f8fafc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Last Name Input */}
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    style={inputStyle}
                    required
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary)';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = '0 0 0 4px rgba(91, 213, 30, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = '#f8fafc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Email Address Input */}
              <div>
                <label style={labelStyle}>Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  style={inputStyle}
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(91, 213, 30, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.backgroundColor = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Bottom Buttons Container */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={handleCancel}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    border: '1.5px solid #e2e8f0',
                    color: '#64748b',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </button>

                <button 
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--primary)',
                    border: 'none',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(91, 213, 30, 0.25)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if(!isSaving) e.target.style.backgroundColor = 'var(--primary-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if(!isSaving) e.target.style.backgroundColor = 'var(--primary)';
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader size={16} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
