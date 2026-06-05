import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, User, Menu } from 'lucide-react';
import SearchInput from './SearchInput';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { useIsMobile } from '../hooks/useMediaQuery';
import { globalSearch } from '../api/core';
import { guestHouseSearch } from '../api/guesthouse';
import { useAppType } from '../hooks/useAppType';
import { GhPageVisibilityProvider } from '../context/GhPageVisibilityContext';

const DashboardLayout = () => {
  const { user } = useAuth();
  const { isGuestHouse } = useAppType();
  const profilePath = isGuestHouse ? '/gh/profile' : '/profile';
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        const data = isGuestHouse
          ? await guestHouseSearch(searchQuery.trim())
          : await globalSearch(searchQuery.trim());
        setSearchResults(data);
        setSearchOpen(true);
      } catch {
        setSearchResults(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, isGuestHouse]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) setMobileMenuOpen(false);
  }, [isMobile]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) markAllRead();
  };

  const closeSearch = () => {
    setSearchQuery('');
    setSearchOpen(false);
    setMobileSearchOpen(false);
  };

  const hasSearchHits = searchResults && (
    (searchResults.bookings?.length > 0)
    || (searchResults.stays?.length > 0)
    || (searchResults.customers?.length > 0)
    || (searchResults.venues?.length > 0)
    || (searchResults.rooms?.length > 0)
    || (searchResults.payments?.length > 0)
    || (searchResults.inventory?.length > 0)
  );

  const handleNotificationClick = (n) => {
    setShowNotifications(false);
    if (n.route) {
      navigate(n.route, n.routeState ? { state: n.routeState } : undefined);
      return;
    }
    if (n.type === 'payment' || n.type === 'payment_due') {
      const payPath = isGuestHouse ? '/gh/payments' : '/payments';
      const stateKey = isGuestHouse ? 'preselectedStayId' : 'preselectedBookingId';
      navigate(payPath, n.bookingId || n.stayId ? {
        state: { [stateKey]: n.bookingId || n.stayId, autoOpenRecord: true },
      } : undefined);
    } else if (n.type === 'inventory') {
      navigate('/inventory');
    } else if (n.stayId) {
      navigate(`/gh/stays/${n.stayId}`);
    } else if (n.bookingId) {
      navigate(isGuestHouse ? `/gh/stays/${n.bookingId}` : '/bookings', isGuestHouse ? undefined : { state: { editBookingId: n.bookingId } });
    } else if (n.customerId) {
      navigate(isGuestHouse ? '/gh/customers' : '/customers', { state: { selectedCustomerId: n.customerId } });
    }
  };

  const shellClass = [
    'dashboard-shell',
    !isMobile && isCollapsed ? 'dashboard-shell--collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <GhPageVisibilityProvider enabled={isGuestHouse}>
    <div className={shellClass}>
      <div
        className={`sidebar-backdrop ${mobileMenuOpen ? 'sidebar-backdrop--visible' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />
      <Sidebar
        isCollapsed={isMobile ? false : isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobile={isMobile}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header__left">
            {isMobile && (
              <button
                type="button"
                className="btn-menu-mobile"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            )}
            {isMobile && (
              <button
                type="button"
                className="btn-menu-mobile"
                onClick={() => setMobileSearchOpen((v) => !v)}
                aria-label="Search"
              >
                <Search size={20} />
              </button>
            )}
            <div
              className={`dashboard-header__search ${isMobile ? '' : ''}`}
              style={{
                display: isMobile && !mobileSearchOpen ? 'none' : 'block',
                flex: isMobile ? 1 : undefined,
                minWidth: isMobile ? 0 : undefined,
              }}
            >
              <SearchInput
                variant="header"
                placeholder={isGuestHouse ? 'Search stays, guests, rooms...' : 'Search bookings, customers...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults && setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              />
              {searchOpen && searchResults && (
                <div
                  className="surface-dropdown"
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                    backgroundColor: 'var(--surface)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border)', zIndex: 9999, maxHeight: '320px', overflowY: 'auto',
                  }}
                >
                  {hasSearchHits ? (
                    <>
                      {searchResults.stays?.map((s) => (
                        <button
                          key={`s-${s.id}`}
                          type="button"
                          onMouseDown={() => {
                            navigate(`/gh/stays/${s.id}`);
                            closeSearch();
                          }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                        >
                          <p style={{ fontSize: '13px', fontWeight: '700' }}>{s.booking_ref}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stay · {s.customer_name} · Room {s.room_number}</p>
                        </button>
                      ))}
                      {searchResults.rooms?.map((r) => (
                        <button
                          key={`r-${r.id}`}
                          type="button"
                          onMouseDown={() => {
                            navigate('/gh/rooms');
                            closeSearch();
                          }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                        >
                          <p style={{ fontSize: '13px', fontWeight: '700' }}>Room {r.room_number}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Room</p>
                        </button>
                      ))}
                      {searchResults.bookings?.map((b) => (
                        <button
                          key={`b-${b.id}`}
                          type="button"
                          onMouseDown={() => {
                            navigate('/bookings', { state: { editBookingId: b.id } });
                            closeSearch();
                          }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                        >
                          <p style={{ fontSize: '13px', fontWeight: '700' }}>{b.event_name}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Booking · {b.booking_id} · {b.customer_name}</p>
                        </button>
                      ))}
                      {searchResults.customers?.map((c) => (
                        <button
                          key={`c-${c.id}`}
                          type="button"
                          onMouseDown={() => {
                            navigate(isGuestHouse ? '/gh/customers' : '/customers', { state: { selectedCustomerId: c.id } });
                            closeSearch();
                          }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                        >
                          <p style={{ fontSize: '13px', fontWeight: '700' }}>{c.name}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Customer · {c.phone || '—'}</p>
                        </button>
                      ))}
                      {searchResults.venues?.map((v) => (
                        <button
                          key={`v-${v.id}`}
                          type="button"
                          onMouseDown={() => {
                            navigate('/halls');
                            closeSearch();
                          }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                        >
                          <p style={{ fontSize: '13px', fontWeight: '700' }}>{v.name}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hall · {v.location}</p>
                        </button>
                      ))}
                      {searchResults.payments?.map((p) => (
                        <button
                          key={`p-${p.id}`}
                          type="button"
                          onMouseDown={() => {
                            navigate('/payments', {
                              state: { preselectedBookingId: p.booking_id, autoOpenRecord: true, bookingEventName: p.event_name },
                            });
                            closeSearch();
                          }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                        >
                          <p style={{ fontSize: '13px', fontWeight: '700' }}>Rs {Number(p.amount).toLocaleString()}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Payment · {p.event_name}</p>
                        </button>
                      ))}
                      {searchResults.inventory?.map((item) => (
                        <button
                          key={`i-${item.id}`}
                          type="button"
                          onMouseDown={() => {
                            navigate('/inventory');
                            closeSearch();
                          }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                          <p style={{ fontSize: '13px', fontWeight: '700' }}>{item.name}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Inventory · {item.quantity} in stock</p>
                        </button>
                      ))}
                    </>
                  ) : (
                    <p style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>No results</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-header__actions">
            <ThemeToggle />
            <div className="dashboard-header__bell-wrap">
              <button
                type="button"
                className="dashboard-header__icon-btn"
                onClick={handleBellClick}
                aria-label="Notifications"
              >
                <Bell size={20} color="currentColor" />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    minWidth: '16px', height: '16px',
                    backgroundColor: 'var(--primary)', borderRadius: '8px',
                    border: '2px solid var(--surface)', fontSize: '9px', fontWeight: '700',
                    color: 'white', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: '0 3px'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="animate-fade-in surface-dropdown" style={{
                  position: 'absolute', top: '44px', right: 0, width: 'min(340px, calc(100vw - 32px))',
                  backgroundColor: 'var(--surface)', borderRadius: '16px',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border)', zIndex: 9999, overflow: 'hidden'
                }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Notifications</h4>
                    <span className="surface-muted-chip" style={{ fontSize: '10px', color: 'var(--text-muted)', backgroundColor: 'var(--surface-elevated)', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                      Live
                    </span>
                  </div>
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
                          role="button"
                          tabIndex={0}
                          onClick={() => handleNotificationClick(n)}
                          onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(n)}
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
                  <div className="surface-footer-bar" style={{ padding: '10px', textAlign: 'center', backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(isGuestHouse ? '/gh/notifications' : '/notifications');
                      }}
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: 'var(--primary)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 8px',
                      }}
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              className="dashboard-header__profile"
              onClick={() => navigate(profilePath)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(profilePath)}
              role="button"
              tabIndex={0}
            >
              <div className="dashboard-header__profile-text hide-mobile">
                <p style={{ fontSize: '14px', fontWeight: '600' }}>{user?.first_name} {user?.last_name}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.role}</p>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {user?.avatar ? (
                  <img
                    src={user.avatar}
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

        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
    </GhPageVisibilityProvider>
  );
};

export default DashboardLayout;
