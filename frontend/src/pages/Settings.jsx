import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Globe,
  Save,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Download,
  Plus
} from 'lucide-react';
import client from '../api/client';
import { changePassword, updateMe } from '../api/auth';
import { getTenant, updateTenant, getUserSettings, updateUserSettings } from '../api/core';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const formatDateTime = (value) => {
  if (!value) return 'Never';
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const parseApiError = (err) => {
  const data = err.response?.data;
  if (!data) return 'Something went wrong. Please try again.';
  if (typeof data.detail === 'string') return data.detail;
  const firstKey = Object.keys(data)[0];
  const val = data[firstKey];
  if (Array.isArray(val)) return val[0];
  if (typeof val === 'string') return val;
  return 'Something went wrong. Please try again.';
};

const Settings = () => {
  const { theme, setThemeMode } = useTheme();
  const [activeTab, setActiveTab] = useState('Profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userData, setUserData] = useState(null);
  const [tenantData, setTenantData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '' });
  const [tenantForm, setTenantForm] = useState({ name: '', phone: '', address: '' });
  const [notifSettings, setNotifSettings] = useState({
    notify_new_bookings: true,
    notify_payments: true,
    notify_weekly_reports: true,
    notify_staff_activity: true,
    sms_to_customers: false,
    whatsapp_to_customers: false,
  });
  const [systemSettings, setSystemSettings] = useState({
    timezone: 'Asia/Karachi',
    language: 'en',
    theme: 'light',
  });

  const loadSettings = async () => {
    try {
      const [userRes, tenantRes, prefsRes] = await Promise.all([
        client.get('/auth/me/'),
        getTenant().catch(() => null),
        getUserSettings().catch(() => null),
      ]);
      setUserData(userRes.data);
      setProfileForm({
        first_name: userRes.data.first_name || '',
        last_name: userRes.data.last_name || '',
      });
      if (tenantRes) {
        setTenantData(tenantRes);
        setTenantForm({
          name: tenantRes.name || '',
          phone: tenantRes.phone || '',
          address: tenantRes.address || '',
        });
      }
      if (prefsRes) {
        setNotifSettings({
          notify_new_bookings: prefsRes.notify_new_bookings ?? true,
          notify_payments: prefsRes.notify_payments ?? true,
          notify_weekly_reports: prefsRes.notify_weekly_reports ?? true,
          notify_staff_activity: prefsRes.notify_staff_activity ?? true,
          sms_to_customers: prefsRes.sms_to_customers ?? false,
          whatsapp_to_customers: prefsRes.whatsapp_to_customers ?? false,
        });
        const savedTheme = prefsRes.theme || 'light';
        setSystemSettings({
          timezone: prefsRes.timezone || 'Asia/Karachi',
          language: prefsRes.language || 'en',
          theme: savedTheme,
        });
        setThemeMode(savedTheme);
      }
    } catch (err) {
      console.error('Failed to fetch settings data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const refreshUser = async () => {
    const userRes = await client.get('/auth/me/');
    setUserData(userRes.data);
  };

  const handleChangePassword = async () => {
    const { current_password, new_password, confirm_password } = passwordForm;

    if (!current_password || !new_password || !confirm_password) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (new_password.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (new_password !== confirm_password) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setIsSaving(true);
    try {
      await changePassword({ current_password, new_password, confirm_password });
      toast.success('Password updated successfully.');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      await refreshUser();
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await updateMe(profileForm);
      setUserData(updated);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVenue = async () => {
    setIsSaving(true);
    try {
      const updated = await updateTenant(tenantForm);
      setTenantData(updated);
      toast.success('Venue information saved.');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await updateUserSettings(notifSettings);
      toast.success('Notification preferences saved.');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSystem = async () => {
    setIsSaving(true);
    try {
      await updateUserSettings({ ...systemSettings, theme });
      toast.success('System preferences saved.');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (activeTab === 'Security') handleChangePassword();
    else if (activeTab === 'Profile') handleSaveProfile();
    else if (activeTab === 'Venue Info') handleSaveVenue();
    else if (activeTab === 'Notifications') handleSaveNotifications();
    else if (activeTab === 'System') handleSaveSystem();
  };

  const showSaveButton = ['Profile', 'Venue Info', 'Notifications', 'Security', 'System'].includes(activeTab);
  const saveLabel =
    activeTab === 'Security' ? (isSaving ? 'Updating…' : 'Update Password') : (isSaving ? 'Saving…' : 'Save Changes');

  const tabs = [
    { name: 'Profile', icon: User },
    { name: 'Venue Info', icon: Building2 },
    { name: 'Notifications', icon: Bell },
    { name: 'Security', icon: Shield },
    { name: 'System', icon: Globe },
  ];

  const InputGroup = ({ label, children, description }) => (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>{label}</label>
      {children}
      {description && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{description}</p>}
    </div>
  );

  const Toggle = ({ active, onClick }) => (
    <div 
      onClick={onClick}
      style={{ 
        width: '44px', 
        height: '24px', 
        backgroundColor: active ? 'var(--primary)' : '#e2e8f0', 
        borderRadius: '12px', 
        position: 'relative', 
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
    >
      <div style={{ 
        position: 'absolute', 
        top: '2px', 
        left: active ? '22px' : '2px', 
        width: '20px', 
        height: '20px', 
        backgroundColor: 'white', 
        borderRadius: '50%', 
        transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}></div>
    </div>
  );

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading settings...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Settings</h2>
        <p style={{ color: 'var(--text-muted)' }}>Configure your application and account preferences.</p>
      </div>

      <div className="settings-layout">
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tabs.map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activeTab === tab.name ? 'var(--primary-light)' : 'transparent',
                color: activeTab === tab.name ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.name ? '700' : '500',
                fontSize: '14px',
                textAlign: 'left'
              }}
            >
              <tab.icon size={18} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="card" style={{ padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700' }}>{activeTab} Settings</h3>
            {showSaveButton && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={isSaving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
              >
                <Save size={16} /> {saveLabel}
              </button>
            )}
          </div>

          <div style={{ maxWidth: '650px' }}>
            {activeTab === 'Profile' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', padding: '24px', backgroundColor: 'var(--background)', borderRadius: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '24px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={48} color="var(--primary)" />
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: '700' }}>{userData?.first_name} {userData?.last_name}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{userData?.role} at {tenantData?.name}</p>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <span style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid var(--border)' }}>{userData?.role}</span>
                      <span style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid var(--border)' }}>Active</span>
                    </div>
                  </div>
                </div>

                <InputGroup label="Username">
                  <input type="text" value={userData?.username || ''} style={{ width: '100%' }} readOnly />
                </InputGroup>
                <div className="form-grid-2" style={{ gap: '20px' }}>
                  <InputGroup label="First Name">
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </InputGroup>
                  <InputGroup label="Last Name">
                    <input
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </InputGroup>
                </div>
                <InputGroup label="Email Address">
                  <input type="email" value={userData?.email || ''} style={{ width: '100%' }} readOnly />
                </InputGroup>
              </div>
            )}

            {activeTab === 'Venue Info' && (
              <div className="animate-fade-in">
                <InputGroup label="Venue Official Name">
                  <input
                    type="text"
                    value={tenantForm.name}
                    onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </InputGroup>
                <InputGroup label="Phone">
                  <input
                    type="text"
                    value={tenantForm.phone}
                    onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                    style={{ width: '100%' }}
                    placeholder="03xx-xxxxxxx"
                  />
                </InputGroup>
                <InputGroup label="Address">
                  <textarea
                    value={tenantForm.address}
                    onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })}
                    style={{ width: '100%', minHeight: '80px' }}
                    placeholder="Hall address for contracts & receipts"
                  />
                </InputGroup>
                <InputGroup label="Subdomain">
                  <input type="text" value={tenantData?.subdomain || ''} style={{ width: '100%' }} readOnly />
                </InputGroup>
                <InputGroup label="Current Plan">
                  <input type="text" value={tenantData?.plan_type || ''} style={{ width: '100%' }} readOnly />
                </InputGroup>
              </div>
            )}

            {activeTab === 'Notifications' && (
              <div className="animate-fade-in">
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>In-app bell alerts</h4>
                {[
                  { key: 'notify_new_bookings', title: 'New Bookings', desc: 'Show new reservations in the notification bell.' },
                  { key: 'notify_payments', title: 'Payment Updates', desc: 'Show when payments are recorded.' },
                  { key: 'notify_weekly_reports', title: 'Upcoming Events', desc: 'Show events in the next 7 days.' },
                  { key: 'notify_staff_activity', title: 'Payment Due Reminders', desc: 'Show bookings with balance still due (lena).' },
                ].map((item, i) => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600' }}>{item.title}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                    <Toggle
                      active={notifSettings[item.key]}
                      onClick={() => setNotifSettings({ ...notifSettings, [item.key]: !notifSettings[item.key] })}
                    />
                  </div>
                ))}
                <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '28px 0 16px' }}>Customer SMS / WhatsApp</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Sends only when the customer has a phone number on file. No phone validation required.
                </p>
                {[
                  { key: 'sms_to_customers', title: 'SMS to customer', desc: 'Text message on booking confirm & payment.' },
                  { key: 'whatsapp_to_customers', title: 'WhatsApp to customer', desc: 'WhatsApp message (Twilio) on same events.' },
                ].map((item) => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600' }}>{item.title}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                    <Toggle
                      active={notifSettings[item.key]}
                      onClick={() => setNotifSettings({ ...notifSettings, [item.key]: !notifSettings[item.key] })}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Security' && (
              <div className="animate-fade-in">
                <div
                  style={{
                    padding: '20px',
                    backgroundColor: 'var(--background)',
                    borderRadius: '12px',
                    marginBottom: '28px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>Account overview</h4>
                  <div className="form-grid-2" style={{ gap: '12px', fontSize: '14px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Username</p>
                      <p style={{ fontWeight: '600', marginTop: '4px' }}>{userData?.username || '—'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Email</p>
                      <p style={{ fontWeight: '600', marginTop: '4px' }}>{userData?.email || '—'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Last login</p>
                      <p style={{ fontWeight: '600', marginTop: '4px' }}>{formatDateTime(userData?.last_login)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Member since</p>
                      <p style={{ fontWeight: '600', marginTop: '4px' }}>{formatDateTime(userData?.date_joined)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Status</p>
                      <p style={{ fontWeight: '700', marginTop: '4px', color: userData?.is_active ? '#166534' : '#991b1b' }}>
                        {userData?.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Role</p>
                      <p style={{ fontWeight: '600', marginTop: '4px' }}>{userData?.role || '—'}</p>
                    </div>
                  </div>
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Change password</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  Enter your current password, then choose a new one (minimum 8 characters). Changes apply immediately.
                </p>

                <InputGroup label="Current password" description="Required to verify it is you.">
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      style={{ width: '100%', paddingRight: '44px' }}
                      placeholder="Current password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'transparent', color: 'var(--text-muted)' }}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </InputGroup>

                <div className="form-grid-2" style={{ gap: '20px' }}>
                  <InputGroup label="New password">
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        style={{ width: '100%', paddingRight: '44px' }}
                        placeholder="At least 8 characters"
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'transparent', color: 'var(--text-muted)' }}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </InputGroup>
                  <InputGroup label="Confirm new password">
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        style={{ width: '100%', paddingRight: '44px' }}
                        placeholder="Repeat new password"
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'transparent', color: 'var(--text-muted)' }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </InputGroup>
                </div>

                {passwordForm.new_password.length > 0 && (
                  <p
                    style={{
                      fontSize: '12px',
                      marginTop: '8px',
                      color: passwordForm.new_password.length >= 8 ? '#166534' : '#b45309',
                      fontWeight: '600',
                    }}
                  >
                    {passwordForm.new_password.length >= 8
                      ? '✓ Password length OK'
                      : `${8 - passwordForm.new_password.length} more character(s) needed`}
                  </p>
                )}

                {passwordForm.confirm_password.length > 0 && (
                  <p
                    style={{
                      fontSize: '12px',
                      marginTop: '6px',
                      color:
                        passwordForm.new_password === passwordForm.confirm_password
                          ? '#166534'
                          : '#dc2626',
                      fontWeight: '600',
                    }}
                  >
                    {passwordForm.new_password === passwordForm.confirm_password
                      ? '✓ Passwords match'
                      : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'System' && (
              <div className="animate-fade-in">
                <InputGroup label="Appearance" description="Switch between light and dark mode across the app.">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <ThemeToggle className="theme-toggle--with-label" showLabel />
                    <select
                      style={{ flex: 1, minWidth: '160px' }}
                      value={theme}
                      onChange={(e) => {
                        setThemeMode(e.target.value);
                        setSystemSettings((s) => ({ ...s, theme: e.target.value }));
                      }}
                    >
                      <option value="light">Light theme</option>
                      <option value="dark">Dark theme</option>
                    </select>
                  </div>
                </InputGroup>
                <InputGroup label="Interface Language">
                  <select
                    style={{ width: '100%' }}
                    value={systemSettings.language}
                    onChange={(e) => setSystemSettings({ ...systemSettings, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="ur">Urdu</option>
                  </select>
                </InputGroup>
                <InputGroup label="Timezone">
                  <select
                    style={{ width: '100%' }}
                    value={systemSettings.timezone}
                    onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                  >
                    <option value="Asia/Karachi">(GMT+05:00) Islamabad, Karachi</option>
                    <option value="Asia/Dubai">(GMT+04:00) Dubai</option>
                    <option value="UTC">(GMT+00:00) UTC</option>
                  </select>
                </InputGroup>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
