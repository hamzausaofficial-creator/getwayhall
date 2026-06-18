const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const AUTH_FLAG_KEY = 'isAuthenticated';
const ROLE_KEY = 'user_role';
const APP_TYPE_KEY = 'user_app_type';

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function isAccessTokenValid(token = getAccessToken()) {
  if (!token) return false;
  try {
    const [, payloadPart] = token.split('.');
    if (!payloadPart) return false;
    const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload?.exp) return false;
    return payload.exp * 1000 > Date.now() + 5000;
  } catch {
    return false;
  }
}

export function hasAuthSession() {
  return isAccessTokenValid() || Boolean(getRefreshToken());
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(AUTH_FLAG_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(APP_TYPE_KEY);
  } catch {
    /* ignore */
  }
}

export function persistAuthSession({ access, refresh, role, appType }) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(AUTH_FLAG_KEY, 'true');
  if (role) localStorage.setItem(ROLE_KEY, role);
  if (appType) localStorage.setItem(APP_TYPE_KEY, appType);
}
