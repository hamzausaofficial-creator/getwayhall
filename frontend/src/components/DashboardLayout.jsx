import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

const DashboardLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) markAllRead();
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isCollapsed ? '80px 1fr' : '240px 1fr',
      minHeight: '100vh',
      transition: 'grid-template-columns 0.3s ease'
    }}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main style={{ backgroundColor: 'var(--background)', overflowY: 'auto' }}>
        <header style={{
          height: 'var(--header-height)',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search bookings, customers..."
                style={{ width: '100%', paddingLeft: '40px', backgroundColor: '#f1f5f9', border: 'none' }}
              />
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button onClick={handleBellClick} style={{ backgroundColor: 'transparent', position: 'relative' }}>
                <Bell size={20} color="var(--text-muted)" />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    minWidth: '16px', height: '16px',
                    backgroundColor: 'var(--primary)', borderRadius: '8px',
                    border: '2px solid white', fontSize: '9px', fontWeight: '700',
                    color: 'white', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: '0 3px'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="animate-fade-in" style={{
                  position: 'absolute', top: '44px', right: 0, width: '340px',
                  backgroundColor: 'white', borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  border: '1px solid var(--border)', zIndex: 9999, overflow: 'hidden'
                }}>
                  {/* Header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Notifications</h4>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                      🟢 Live
                    </span>
                  </div>

                  {/* Notification List */}
                  <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                        <p style={{ fontSize: '13px' }}>No recent activity</p>
                      </div>
                    ) : (
                      notifications.map((n, i) => (
                        <div
                          key={n.id}
                          style={{
                            padding: '13px 20px',
                            borderBottom: i === notifications.length - 1 ? 'none' : '1px solid var(--border)',
                            cursor: 'pointer', transition: 'background 0.2s',
                            display: 'flex', gap: '12px', alignItems: 'flex-start'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{n.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '2px' }}>{n.title}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.desc}</p>
                            <p style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '600' }}>{n.timeAgo}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '10px', textAlign: 'center', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Refreshes every 30 seconds</p>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div 
              onClick={() => navigate('/dashboard/profile')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                paddingLeft: '24px', 
                borderLeft: '1px solid var(--border)',
                cursor: 'pointer'
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '14px', fontWeight: '600' }}>{user?.first_name} {user?.last_name}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.role}</p>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {user?.email && localStorage.getItem(`profile_pic_${user.email}`) ? (
                  <img 
                    src={localStorage.getItem(`profile_pic_${user.email}`)} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <User size={20} color="var(--primary)" />
                )}
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: '32px', maxWidth: 'var(--container-max)', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
