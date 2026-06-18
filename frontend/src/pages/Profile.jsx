import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadAvatar } from '../api/auth';
import { User, Mail, Shield, Building, Edit3, Camera, Save, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTenant } from '../api/core';
import { resolveMediaUrl } from '../utils/media';

const Profile = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const [tenantName, setTenantName] = useState('');
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setProfileImage(resolveMediaUrl(user.avatar));
    }
  }, [user]);

  useEffect(() => {
    getTenant()
      .then((t) => setTenantName(t.name || ''))
      .catch(() => setTenantName(user?.tenant?.name || ''));
  }, [user]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setProfileImage(previewUrl);
    try {
      await uploadAvatar(file);
      const refreshed = await refreshUser();
      setProfileImage(resolveMediaUrl(refreshed.avatar));
      toast.success('Profile photo updated.');
    } catch {
      setProfileImage(resolveMediaUrl(user?.avatar));
      toast.error('Failed to upload photo');
    } finally {
      URL.revokeObjectURL(previewUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required.');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
      });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
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

  const fields = [
    { label: 'First Name', value: firstName || '-', icon: User },
    { label: 'Last Name', value: lastName || '-', icon: User },
    { label: 'Email Address', value: email || '-', icon: Mail },
    { label: 'Organization', value: tenantName || user?.tenant?.name || 'Your venue', icon: Building },
  ];

  return (
    <div className="profile-page animate-fade-in">
      <div className="profile-page__header">
        <p className="profile-page__subtitle">
          Manage your personal credentials, profile picture, and access controls.
        </p>
      </div>

      <div className="profile-card">
        <div className="profile-card__banner">
          <button
            type="button"
            className="profile-card__avatar"
            onClick={handlePhotoClick}
            aria-label="Change profile photo"
          >
            <div className="profile-img-container">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="profile-img-container__photo" />
              ) : (
                <div className="profile-card__avatar-placeholder">
                  {firstName ? firstName[0].toUpperCase() : 'A'}
                </div>
              )}
              <div className="profile-img-hover" aria-hidden>
                <Camera size={20} />
              </div>
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept="image/*"
            onChange={handlePhotoChange}
          />

          {!isEditing ? (
            <button
              type="button"
              className="profile-card__edit-btn"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 size={16} color="var(--primary)" /> Edit Profile
            </button>
          ) : (
            <button
              type="button"
              className="profile-card__edit-btn profile-card__edit-btn--cancel"
              onClick={handleCancel}
            >
              <X size={16} /> Cancel
            </button>
          )}
        </div>

        <div className="profile-card__body">
          <div className="profile-card__identity">
            <h3 className="profile-card__name">
              {firstName} {lastName}
            </h3>
            <span className="profile-card__role">
              <Shield size={12} /> {user?.role || 'Staff'}
            </span>
          </div>

          {!isEditing ? (
            <div className="profile-grid">
              {fields.map(({ label, value, icon: Icon }) => (
                <div key={label} className="profile-field-card">
                  <div className="profile-field-card__icon">
                    <Icon size={20} color="var(--primary)" />
                  </div>
                  <div className="profile-field-card__content">
                    <p className="profile-field-card__label">{label}</p>
                    <p className="profile-field-card__value">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form className="profile-form" onSubmit={handleSave}>
              <div className="profile-form__grid">
                <div>
                  <label className="profile-form__label" htmlFor="profile-first-name">
                    First Name
                  </label>
                  <input
                    id="profile-first-name"
                    type="text"
                    className="profile-form__input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <label className="profile-form__label" htmlFor="profile-last-name">
                    Last Name
                  </label>
                  <input
                    id="profile-last-name"
                    type="text"
                    className="profile-form__input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="profile-form__label" htmlFor="profile-email">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="profile-form__input"
                  value={email}
                  readOnly
                  disabled
                />
              </div>
              <div className="profile-form__actions">
                <button
                  type="button"
                  className="profile-form__btn profile-form__btn--secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-form__btn profile-form__btn--primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                      Saving…
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
