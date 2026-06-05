import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calculator,
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
  BarChart3,
  Package,
  Sparkles,
  CalendarDays,
  Bell,
  X,
  UserCircle,
  BedDouble,
  CalendarCheck,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAppType } from '../hooks/useAppType';
import { useGhPageVisibility } from '../context/GhPageVisibilityContext';
import { GH_PAGE_KEYS } from '../constants/ghPages';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobile, isMobileOpen, onMobileClose }) => {
  const { logout } = useAuth();
  const { isGuestHouse } = useAppType();
  const {
    user,
    loading,
    role,
    isStaff,
    canAccessExpenses,
    canAccessReports,
    canAccessNotifications,
    canAccessStaff,
    canAccessSettings,
    canAccessDashboard,
  } = usePermissions();
  const { isPageVisible } = useGhPageVisibility();

  const hallNavItems = [
    { name: 'Bookings', icon: Calendar, path: '/bookings' },
    { name: 'Calendar', icon: CalendarDays, path: '/calendar' },
    { name: 'Halls', icon: Building2, path: '/halls' },
    { name: 'Customers', icon: Users, path: '/customers' },
    { name: 'Payments', icon: CreditCard, path: '/payments' },
    ...(canAccessExpenses ? [{ name: 'Expenses', icon: Receipt, path: '/expenses' }] : []),
    ...(canAccessStaff ? [{ name: 'Staff', icon: BadgeCheck, path: '/staff' }] : []),
    { name: 'Inventory', icon: Package, path: '/inventory' },
    { name: 'Decoration Packages', icon: Sparkles, path: '/decoration-packages' },
    ...(canAccessReports ? [{ name: 'Reports', icon: BarChart3, path: '/reports' }] : []),
    ...(canAccessNotifications ? [{ name: 'Notifications', icon: Bell, path: '/notifications' }] : []),
  ];

  const guestHouseNavItems = [
    { name: 'Book Stay', icon: Plus, path: '/gh/book', pageKey: GH_PAGE_KEYS.BOOK },
    { name: 'Stays', icon: CalendarCheck, path: '/gh/stays', pageKey: GH_PAGE_KEYS.STAYS },
    { name: 'Calendar', icon: CalendarDays, path: '/gh/calendar', pageKey: GH_PAGE_KEYS.CALENDAR },
    { name: 'Rooms', icon: BedDouble, path: '/gh/rooms', pageKey: GH_PAGE_KEYS.ROOMS },
    { name: 'Customers', icon: Users, path: '/gh/customers', pageKey: GH_PAGE_KEYS.CUSTOMERS },
    { name: 'Payments', icon: CreditCard, path: '/gh/payments', pageKey: GH_PAGE_KEYS.PAYMENTS },
    ...(canAccessExpenses ? [{ name: 'Expenses', icon: Receipt, path: '/gh/expenses', pageKey: GH_PAGE_KEYS.EXPENSES }] : []),
    ...(canAccessStaff ? [{ name: 'Staff', icon: BadgeCheck, path: '/gh/staff', pageKey: GH_PAGE_KEYS.STAFF }] : []),
    ...(canAccessReports ? [{ name: 'Reports', icon: BarChart3, path: '/gh/reports', pageKey: GH_PAGE_KEYS.REPORTS }] : []),
    ...(canAccessNotifications ? [{ name: 'Notifications', icon: Bell, path: '/gh/notifications', pageKey: GH_PAGE_KEYS.NOTIFICATIONS }] : []),
  ].filter((item) => !item.pageKey || isPageVisible(item.pageKey));

  const mainNavItems = isGuestHouse ? guestHouseNavItems : hallNavItems;
  const accountantNavItem = isGuestHouse
    ? { name: 'Dashboard', icon: Calculator, path: '/gh/dashboard', pageKey: GH_PAGE_KEYS.DASHBOARD }
    : { name: 'Accountant', icon: Calculator, path: '/dashboard' };

  const profilePath = isGuestHouse ? '/gh/profile' : '/profile';
  const settingsPath = isGuestHouse ? '/gh/settings' : '/settings';
  const brandSubtitle = isGuestHouse ? 'Guest House Management' : 'Marriage Hall Management';

  if (loading || !user) {
    return (
      <aside className="app-sidebar" style={{ padding: '24px', color: '#94a3b8', fontSize: '13px' }}>
        Loading menu…
      </aside>
    );
  }

  const handleSignOut = () => {
    logout();
    onMobileClose?.();
  };

  const handleNavClick = () => {
    if (isMobile) onMobileClose?.();
  };

  const sidebarClass = [
    'app-sidebar',
    !isMobile && isCollapsed ? 'app-sidebar--collapsed' : '',
    isMobile && isMobileOpen ? 'app-sidebar--mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClass}>
      {!isMobile && (
        <button
          type="button"
          className="app-sidebar__collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}

      {isMobile && (
        <button
          type="button"
          onClick={onMobileClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '16px',
            background: 'transparent',
            color: '#94a3b8',
            padding: '4px',
          }}
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      )}

      <div style={{ marginBottom: '40px', padding: isCollapsed && !isMobile ? '0' : '0 8px', display: 'flex', flexDirection: 'column', alignItems: isCollapsed && !isMobile ? 'center' : 'flex-start' }}>
        <h1 style={{
          fontSize: isCollapsed && !isMobile ? '36px' : '24px',
          fontWeight: '700',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          G{isCollapsed && !isMobile ? '' : 'ateway'}
        </h1>
        {(!isCollapsed || isMobile) && (
          <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
            {brandSubtitle}
            {role && (
              <span
                style={{
                  display: 'inline-block',
                  marginLeft: '8px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: isStaff ? 'rgba(91,213,30,0.2)' : 'rgba(255,255,255,0.1)',
                  color: isStaff ? '#86efac' : '#cbd5e1',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontSize: '9px',
                }}
              >
                {role}
              </span>
            )}
          </p>
        )}
      </div>

      <nav style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: isCollapsed && !isMobile ? '0' : '4px',
        marginRight: isCollapsed && !isMobile ? '0' : '-8px'
      }} className="custom-scrollbar">
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: isCollapsed && !isMobile ? '16px' : '4px', alignItems: isCollapsed && !isMobile ? 'center' : 'stretch' }}>
          {mainNavItems.map((item) => (
            <li key={item.name} style={{ width: isCollapsed && !isMobile ? 'auto' : '100%', display: 'flex', justifyContent: 'center' }}>
              <NavLink
                to={item.path}
                title={isCollapsed && !isMobile ? item.name : ''}
                onClick={handleNavClick}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
                  padding: '12px',
                  width: isCollapsed && !isMobile ? '44px' : '100%',
                  height: isCollapsed && !isMobile ? '44px' : 'auto',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'white' : '#94a3b8',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  fontWeight: '500',
                  gap: isCollapsed && !isMobile ? '0' : '12px'
                })}
              >
                <item.icon size={20} />
                {(!isCollapsed || isMobile) && <span>{item.name}</span>}
              </NavLink>
            </li>
          ))}
          {canAccessDashboard && (!isGuestHouse || isPageVisible(accountantNavItem.pageKey)) && (
          <li
            style={{
              width: isCollapsed && !isMobile ? 'auto' : '100%',
              display: 'flex',
              justifyContent: 'center',
              marginTop: isCollapsed && !isMobile ? '8px' : '12px',
              paddingTop: isCollapsed && !isMobile ? '0' : '12px',
              borderTop: isCollapsed && !isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <NavLink
              to={accountantNavItem.path}
              title={isCollapsed && !isMobile ? accountantNavItem.name : ''}
              onClick={handleNavClick}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
                padding: '12px',
                width: isCollapsed && !isMobile ? '44px' : '100%',
                height: isCollapsed && !isMobile ? '44px' : 'auto',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'white' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                fontWeight: '500',
                gap: isCollapsed && !isMobile ? '0' : '12px'
              })}
            >
              <accountantNavItem.icon size={20} />
              {(!isCollapsed || isMobile) && <span>{accountantNavItem.name}</span>}
            </NavLink>
          </li>
          )}
        </ul>
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '24px' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: isCollapsed && !isMobile ? '16px' : '8px', alignItems: isCollapsed && !isMobile ? 'center' : 'stretch' }}>
          {(!isGuestHouse || isPageVisible(GH_PAGE_KEYS.PROFILE)) && (
          <li style={{ width: isCollapsed && !isMobile ? 'auto' : '100%', display: 'flex', justifyContent: 'center' }}>
            <NavLink to={profilePath} onClick={handleNavClick} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
              padding: '12px',
              width: isCollapsed && !isMobile ? '44px' : '100%',
              height: isCollapsed && !isMobile ? '44px' : 'auto',
              borderRadius: 'var(--radius-md)',
              color: '#94a3b8',
              gap: isCollapsed && !isMobile ? '0' : '12px',
              fontSize: '14px',
            }}>
              <UserCircle size={20} />
              {(!isCollapsed || isMobile) && <span>Profile</span>}
            </NavLink>
          </li>
          )}
          {canAccessSettings && (!isGuestHouse || isPageVisible(GH_PAGE_KEYS.SETTINGS)) && (
          <li style={{ width: isCollapsed && !isMobile ? 'auto' : '100%', display: 'flex', justifyContent: 'center' }}>
            <NavLink to={settingsPath} onClick={handleNavClick} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
              padding: '12px',
              width: isCollapsed && !isMobile ? '44px' : '100%',
              height: isCollapsed && !isMobile ? '44px' : 'auto',
              borderRadius: 'var(--radius-md)',
              color: '#94a3b8',
              gap: isCollapsed && !isMobile ? '0' : '12px',
              fontSize: '14px'
            }}>
              <Settings size={20} />
              {(!isCollapsed || isMobile) && <span>Settings</span>}
            </NavLink>
          </li>
          )}
          <li style={{ width: isCollapsed && !isMobile ? 'auto' : '100%', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
                padding: '12px',
                width: isCollapsed && !isMobile ? '44px' : '100%',
                height: isCollapsed && !isMobile ? '44px' : 'auto',
                borderRadius: 'var(--radius-md)',
                color: '#ef4444',
                backgroundColor: 'transparent',
                gap: isCollapsed && !isMobile ? '0' : '12px',
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              <LogOut size={20} />
              {(!isCollapsed || isMobile) && <span>Sign Out</span>}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
