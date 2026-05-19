import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  CreditCard,
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
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('Profile');
  const [showPassword, setShowPassword] = useState(false);
  const [userData, setUserData] = useState(null);
  const [tenantData, setTenantData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, tenantRes] = await Promise.all([
          client.get('/auth/me/'),
          client.get('/core/tenant/')
        ]);
        setUserData(userRes.data);
        setTenantData(tenantRes.data);
      } catch (err) {
        console.error('Failed to fetch settings data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const tabs = [
    { name: 'Profile', icon: User },
    { name: 'Venue Info', icon: Building2 },
    { name: 'Notifications', icon: Bell },
    { name: 'Security', icon: Shield },
    { name: 'Billing', icon: CreditCard },
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

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '40px' }}>
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
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <Save size={16} /> Save Changes
            </button>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InputGroup label="First Name">
                    <input type="text" defaultValue={userData?.first_name} style={{ width: '100%' }} />
                  </InputGroup>
                  <InputGroup label="Last Name">
                    <input type="text" defaultValue={userData?.last_name} style={{ width: '100%' }} />
                  </InputGroup>
                </div>
                <InputGroup label="Email Address">
                  <input type="email" defaultValue={userData?.email} style={{ width: '100%' }} readOnly />
                </InputGroup>
              </div>
            )}

            {activeTab === 'Venue Info' && (
              <div className="animate-fade-in">
                <InputGroup label="Venue Official Name">
                  <input type="text" defaultValue={tenantData?.name} style={{ width: '100%' }} />
                </InputGroup>
                <InputGroup label="Subdomain">
                  <input type="text" defaultValue={tenantData?.subdomain} style={{ width: '100%' }} readOnly />
                </InputGroup>
                <InputGroup label="Current Plan">
                  <input type="text" defaultValue={tenantData?.plan_type} style={{ width: '100%' }} readOnly />
                </InputGroup>
              </div>
            )}

            {activeTab === 'Notifications' && (
              <div className="animate-fade-in">
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px' }}>Email Notifications</h4>
                {[
                  { title: 'New Bookings', desc: 'Get notified when a customer makes a reservation.' },
                  { title: 'Payment Updates', desc: 'Receive alerts for completed or failed transactions.' },
                  { title: 'Weekly Reports', desc: 'A summary of your venue performance every Monday.' },
                  { title: 'Staff Activity', desc: 'Updates on team changes and permission updates.' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i === 3 ? 'none' : '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600' }}>{item.title}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                    <Toggle active={i < 3} onClick={() => {}} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Security' && (
              <div className="animate-fade-in">
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px' }}>Change Password</h4>
                <InputGroup label="Current Password">
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? "text" : "password"} style={{ width: '100%', paddingRight: '40px' }} placeholder="••••••••" />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'transparent', color: 'var(--text-muted)' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </InputGroup>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <InputGroup label="New Password">
                    <input type="password" style={{ width: '100%' }} placeholder="••••••••" />
                  </InputGroup>
                  <InputGroup label="Confirm Password">
                    <input type="password" style={{ width: '100%' }} placeholder="••••••••" />
                  </InputGroup>
                </div>
              </div>
            )}

            {activeTab === 'Billing' && (
              <div className="animate-fade-in">
                <div className="premium-card" style={{ marginBottom: '32px', backgroundColor: 'var(--secondary)', color: 'white', padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '14px', opacity: 0.8 }}>Current Plan</p>
                      <h3 style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px' }}>{tenantData?.plan_type}</h3>
                      <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>Active since {new Date(tenantData?.created_at).toLocaleDateString()}</p>
                    </div>
                    <span style={{ padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Active</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'System' && (
              <div className="animate-fade-in">
                <InputGroup label="Interface Language">
                  <select style={{ width: '100%' }}>
                    <option>English (US)</option>
                    <option>Urdu (PK)</option>
                  </select>
                </InputGroup>
                <InputGroup label="Timezone">
                  <select style={{ width: '100%' }}>
                    <option>(GMT+05:00) Islamabad, Karachi</option>
                    <option>(GMT+00:00) London</option>
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
