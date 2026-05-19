import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Receipt,
  BadgeCheck,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Bookings', icon: Calendar, path: '/dashboard/bookings' },
    { name: 'Calendar', icon: Calendar, path: '/dashboard/calendar' },
    { name: 'Halls', icon: Building2, path: '/dashboard/halls' },
    { name: 'Customers', icon: Users, path: '/dashboard/customers' },
    { name: 'Payments', icon: CreditCard, path: '/dashboard/payments' },
    { name: 'Expenses', icon: Receipt, path: '/dashboard/expenses' },
    { name: 'Staff', icon: BadgeCheck, path: '/dashboard/staff' },
    { name: 'Reports', icon: BarChart3, path: '/dashboard/reports' },
  ];

  const handleSignOut = () => {
    logout();
  };

  return (
    <aside style={{
      width: isCollapsed ? '88px' : '240px',
      backgroundColor: 'var(--secondary)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      padding: isCollapsed ? '24px 12px' : '24px 16px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      transition: 'width 0.3s ease, padding 0.3s ease',
      overflow: 'visible',
      zIndex: 50
    }}>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'absolute',
          right: '-14px',
          top: '40px',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid white',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: '0',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div style={{ marginBottom: '40px', padding: isCollapsed ? '0' : '0 8px', display: 'flex', flexDirection: 'column', alignItems: isCollapsed ? 'center' : 'flex-start' }}>
        <h1 style={{
          fontSize: isCollapsed ? '20px' : '24px',
          fontWeight: '700',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          G{isCollapsed ? '' : 'ateway'}
        </h1>
        {!isCollapsed && <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>Marriage Hall Management</p>}
      </div>

      <nav style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: isCollapsed ? '0' : '4px',
        marginRight: isCollapsed ? '0' : '-8px'
      }} className="custom-scrollbar">
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', alignItems: isCollapsed ? 'center' : 'stretch' }}>
          {navItems.map((item) => (
            <li key={item.name} style={{ marginBottom: '4px', width: '100%' }}>
              <NavLink
                to={item.path}
                title={isCollapsed ? item.name : ''}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'white' : '#94a3b8',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  fontWeight: '500',
                  gap: isCollapsed ? '0' : '12px'
                })}
              >
                <item.icon size={20} />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '24px' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', alignItems: isCollapsed ? 'center' : 'stretch' }}>
          <li style={{ marginBottom: '8px', width: '100%' }}>
            <NavLink to="/dashboard/settings" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: '12px',
              color: '#94a3b8',
              gap: isCollapsed ? '0' : '12px',
              fontSize: '14px'
            }}>
              <Settings size={20} />
              {!isCollapsed && <span>Settings</span>}
            </NavLink>
          </li>
          <li>
            <button
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: '12px',
                color: '#ef4444',
                backgroundColor: 'transparent',
                gap: isCollapsed ? '0' : '12px',
                fontSize: '14px',
                width: '100%',
                cursor: 'pointer'
              }}
            >
              <LogOut size={20} />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
