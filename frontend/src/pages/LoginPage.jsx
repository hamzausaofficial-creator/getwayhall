import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import AppLogo from '../components/AppLogo';
import {
  APP_GUEST_HOUSE,
  APP_MARRIAGE_HALL,
  getDefaultHomePath,
  getAppLoginPortal,
  normalizeAppType,
} from '../utils/appType';

const PORTAL_STORAGE_KEY = 'login_portal_choice';

function readStoredPortal() {
  try {
    const stored = sessionStorage.getItem(PORTAL_STORAGE_KEY);
    if (stored === APP_GUEST_HOUSE || stored === APP_MARRIAGE_HALL) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

function fieldErrorMessage(value) {
  if (!value) return '';
  if (Array.isArray(value)) return String(value[0] || '');
  return String(value);
}

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const portalParam = getAppLoginPortal(`?portal=${searchParams.get('portal') || ''}`);
  const [portal, setPortal] = useState(portalParam ?? readStoredPortal() ?? APP_MARRIAGE_HALL);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { login, clearSession } = useAuth();

  const isHall = portal === APP_MARRIAGE_HALL;

  const clearFieldErrors = () => {
    setError('');
    setUsernameError('');
    setPasswordError('');
  };

  /** Secret toggle: click "Gateway" to switch Guest House ↔ Marriage Hall */
  const toggleSecretPortal = () => {
    setPortal((current) => {
      const next = current === APP_MARRIAGE_HALL ? APP_GUEST_HOUSE : APP_MARRIAGE_HALL;
      try {
        sessionStorage.setItem(PORTAL_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
    clearFieldErrors();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearFieldErrors();

    try {
      const loggedIn = await login({ username: username.trim(), password });
      const userApp = normalizeAppType(loggedIn?.app_type);

      if (userApp !== portal) {
        clearSession();
        setError(
          userApp === APP_GUEST_HOUSE
            ? 'This account is for Guest House. Click Gateway above to switch portal, then sign in again.'
            : 'This account is for Marriage Hall. Click Gateway above to switch portal, then sign in again.',
        );
        return;
      }

      navigate(getDefaultHomePath(loggedIn));
    } catch (err) {
      const data = err.response?.data;
      const usernameMsg = fieldErrorMessage(data?.username);
      const passwordMsg = fieldErrorMessage(data?.password);

      if (usernameMsg) {
        setUsernameError(usernameMsg);
      } else if (passwordMsg) {
        setPasswordError(passwordMsg);
      } else {
        setError(
          fieldErrorMessage(data?.detail)
            || fieldErrorMessage(data?.non_field_errors)
            || 'Unable to sign in. Please check your details and try again.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <ThemeToggle className="theme-toggle--floating" />
      <div className="login-card login-card--wide">
        <div className="login-card__brand">
          <AppLogo size="sm" tone="dark" className="login-card__logo-mark" />
          <div>
            <button
              type="button"
              className="login-card__title login-card__title--secret"
              onClick={toggleSecretPortal}
              aria-label="Gateway"
            >
              Gateway
            </button>
            <p className="login-card__subtitle">
              {isHall ? 'Marriage Hall Management' : 'Guest House Management'}
            </p>
          </div>
        </div>

        {error && <div className="login-card__error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field">
            <label htmlFor="login-username">Username</label>
            <div className={`login-field__wrap${usernameError ? ' login-field__wrap--error' : ''}`}>
              <User size={18} className="login-field__icon" />
              <input
                id="login-username"
                type="text"
                required
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (usernameError) setUsernameError('');
                  if (error) setError('');
                }}
                aria-invalid={!!usernameError}
                aria-describedby={usernameError ? 'login-username-error' : undefined}
              />
            </div>
            {usernameError && (
              <p id="login-username-error" className="login-field__error" role="alert">
                {usernameError}
              </p>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className={`login-field__wrap${passwordError ? ' login-field__wrap--error' : ''}`}>
              <Lock size={18} className="login-field__icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                  if (error) setError('');
                }}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                className="login-field__toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && (
              <p id="login-password-error" className="login-field__error" role="alert">
                {passwordError}
              </p>
            )}
          </div>

          <button type="submit" className="login-submit" disabled={isLoading}>
            {isLoading ? 'Signing in…' : (
              <>
                Sign in to {isHall ? 'Marriage Hall' : 'Guest House'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="login-card__hint">
          <Link to="/">Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
