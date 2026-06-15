import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calculator,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Wallet,
  BarChart3,
  Package,
  Sparkles,
  CalendarDays,
  Bell,
  X,
  CalendarCheck,
  Plus,
  Snowflake,
} from 'lucide-react';
import AppLoader from '../components/AppLoader';
import { usePermissions } from '../hooks/usePermissions';
import { useAppType } from '../hooks/useAppType';
import { useGhPageVisibility } from '../context/GhPageVisibilityContext';
import { GH_PAGE_KEYS } from '../constants/ghPages';
import AppLogo from './AppLogo';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobile, isMobileOpen, onMobileClose }) => {
  const { isGuestHouse } = useAppType();
  const {
    user,
    loading,
    canAccessExpenses,
    canAccessReports,
    canAccessNotifications,
    canAccessDashboard,
  } = usePermissions();
  const { isPageVisible } = useGhPageVisibility();

  const hallNavItems = [
    { name: 'Bookings', icon: Calendar, path: '/bookings' },
    { name: 'Calendar', icon: CalendarDays, path: '/calendar' },
    { name: 'Customers', icon: Users, path: '/customers' },
    ...(canAccessExpenses ? [{ name: 'Expenses', icon: Wallet, path: '/expenses' }] : []),
    { name: 'Inventory', icon: Package, path: '/inventory' },
    { name: 'Decorations', icon: Sparkles, path: '/decoration-packages' },
    ...(canAccessReports ? [{ name: 'Reports', icon: BarChart3, path: '/reports' }] : []),
    ...(canAccessNotifications ? [{ name: 'Notifications', icon: Bell, path: '/notifications' }] : []),
  ];

  const guestHouseNavItems = [
    { name: 'Book Stay', icon: Plus, path: '/gh/book', pageKey: GH_PAGE_KEYS.BOOK },
    { name: 'Stays', icon: CalendarCheck, path: '/gh/stays', pageKey: GH_PAGE_KEYS.STAYS },
    { name: 'Calendar', icon: CalendarDays, path: '/gh/calendar', pageKey: GH_PAGE_KEYS.CALENDAR },
    { name: 'Guests', icon: Users, path: '/gh/customers', pageKey: GH_PAGE_KEYS.CUSTOMERS },
    { name: 'Add-on Services', icon: Snowflake, path: '/gh/services', pageKey: GH_PAGE_KEYS.SERVICES },
    ...(canAccessExpenses ? [{ name: 'Expenses', icon: Wallet, path: '/gh/expenses', pageKey: GH_PAGE_KEYS.EXPENSES }] : []),
    ...(canAccessReports ? [{ name: 'Reports', icon: BarChart3, path: '/gh/reports', pageKey: GH_PAGE_KEYS.REPORTS }] : []),
    ...(canAccessNotifications ? [{ name: 'Notifications', icon: Bell, path: '/gh/notifications', pageKey: GH_PAGE_KEYS.NOTIFICATIONS }] : []),
  ].filter((item) => !item.pageKey || isPageVisible(item.pageKey));

  const mainNavItems = isGuestHouse ? guestHouseNavItems : hallNavItems;
  const accountantNavItem = isGuestHouse
    ? { name: 'Dashboard', icon: Calculator, path: '/gh/dashboard', pageKey: GH_PAGE_KEYS.DASHBOARD }
    : { name: 'Accountant', icon: Calculator, path: '/dashboard' };
  const brandSubtitle = isGuestHouse ? 'Guest House Management' : 'Marriage Hall Management';

  if (loading || !user) {
    return (
      <aside className="app-sidebar app-sidebar--loading">
        <AppLoader inline className="app-loader--compact" message="Loading menu…" />
      </aside>
    );
  }

  const handleNavClick = () => {
    if (isMobile) onMobileClose?.();
  };

  const sidebarClass = [
    'app-sidebar',
    !isMobile && isCollapsed ? 'app-sidebar--collapsed' : '',
    isMobile && isMobileOpen ? 'app-sidebar--mobile-open' : '',
  ].filter(Boolean).join(' ');

  const navLinkClass = (isActive) => [
    'app-sidebar__nav-link',
    isActive ? 'app-sidebar__nav-link--active' : '',
    isCollapsed && !isMobile ? 'app-sidebar__nav-link--collapsed' : '',
  ].filter(Boolean).join(' ');

  const renderNavLink = (item) => (
    <NavLink
      to={item.path}
      title={item.name}
      onClick={handleNavClick}
      className={({ isActive }) => navLinkClass(isActive)}
    >
      <item.icon size={20} className="app-sidebar__nav-icon" aria-hidden />
      {(!isCollapsed || isMobile) && (
        <span className="app-sidebar__nav-label">{item.name}</span>
      )}
    </NavLink>
  );

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

      <div className={`app-sidebar__brand${isCollapsed && !isMobile ? ' app-sidebar__brand--collapsed' : ''}`}>
        <AppLogo
          size={isCollapsed && !isMobile ? 'xs' : 'sm'}
          tone="light"
          showImage={false}
          showName
          name={isCollapsed && !isMobile ? 'G' : undefined}
          subtitle={(!isCollapsed || isMobile) ? brandSubtitle : undefined}
          className={isCollapsed && !isMobile ? 'app-logo--sidebar-collapsed' : 'app-logo--sidebar'}
        />
      </div>

      <nav className={`app-sidebar__nav custom-scrollbar${isCollapsed && !isMobile ? ' app-sidebar__nav--collapsed' : ''}`}>
        <ul className="app-sidebar__nav-list">
          {mainNavItems.map((item) => (
            <li key={item.name} className="app-sidebar__nav-item">
              {renderNavLink(item)}
            </li>
          ))}
          {canAccessDashboard && (!isGuestHouse || isPageVisible(accountantNavItem.pageKey)) && (
            <li className="app-sidebar__nav-item app-sidebar__nav-item--divider">
              {renderNavLink(accountantNavItem)}
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
