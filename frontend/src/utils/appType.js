export const APP_MARRIAGE_HALL = 'MARRIAGE_HALL';
export const APP_GUEST_HOUSE = 'GUEST_HOUSE';

export function normalizeAppType(value) {
  const v = String(value || APP_MARRIAGE_HALL).toUpperCase();
  return v === APP_GUEST_HOUSE ? APP_GUEST_HOUSE : APP_MARRIAGE_HALL;
}

export function isGuestHouseApp(appType) {
  return normalizeAppType(appType) === APP_GUEST_HOUSE;
}

export function isMarriageHallApp(appType) {
  return normalizeAppType(appType) === APP_MARRIAGE_HALL;
}

/** Default landing route after login */
export function getDefaultHomePath(user) {
  const appType = normalizeAppType(user?.app_type);
  const role = String(user?.role || '').toUpperCase();
  if (appType === APP_GUEST_HOUSE) {
    return role === 'STAFF' ? '/gh/stays' : '/gh/dashboard';
  }
  if (role === 'ADMIN' || role === 'MANAGER') return '/dashboard';
  return '/bookings';
}

export function getAppLoginPortal(pathname = '') {
  if (pathname.includes('portal=guesthouse') || pathname.includes('portal=gh')) {
    return APP_GUEST_HOUSE;
  }
  if (pathname.includes('portal=hall') || pathname.includes('portal=marriage')) {
    return APP_MARRIAGE_HALL;
  }
  return null;
}

const PORTAL_STORAGE_KEY = 'login_portal_choice';

/** Guess portal from username prefix while typing (Guest House staff accounts). */
export function guessPortalFromUsername(username) {
  const value = String(username || '').trim().toLowerCase();
  if (!value) return null;
  if (/^gh[_-]/.test(value) || value.includes('guesthouse') || value.includes('guest_house')) {
    return APP_GUEST_HOUSE;
  }
  return null;
}

export function readStoredLoginPortal() {
  try {
    const stored = sessionStorage.getItem(PORTAL_STORAGE_KEY);
    if (stored === APP_GUEST_HOUSE || stored === APP_MARRIAGE_HALL) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function storeLoginPortal(portal) {
  const normalized = normalizeAppType(portal);
  try {
    sessionStorage.setItem(PORTAL_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
  return normalized;
}

export function portalLabel(portal) {
  return normalizeAppType(portal) === APP_GUEST_HOUSE
    ? 'Guest House'
    : 'Marriage Hall';
}
