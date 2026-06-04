import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  APP_GUEST_HOUSE,
  APP_MARRIAGE_HALL,
  getDefaultHomePath,
  getAppLoginPortal,
  normalizeAppType,
} from '../utils/appType';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const portalParam = getAppLoginPortal(`?portal=${searchParams.get('portal') || ''}`);
  const [portal, setPortal] = useState(portalParam ?? APP_MARRIAGE_HALL);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const isHall = portal === APP_MARRIAGE_HALL;

  /** Secret toggle: click "Gateway" to switch Guest House ↔ Marriage Hall */
  const toggleSecretPortal = () => {
    setPortal((p) => (p === APP_MARRIAGE_HALL ? APP_GUEST_HOUSE : APP_MARRIAGE_HALL));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loggedIn = await login({ username: username.trim(), password });
      const userApp = normalizeAppType(loggedIn?.app_type);

      if (userApp !== portal) {
        const wrong =
          userApp === APP_GUEST_HOUSE
            ? 'This account is for Guest House. Switch to Guest House login.'
            : 'This account is for Marriage Hall. Switch to Marriage Hall login.';
        setError(wrong);
        setPortal(userApp);
        return;
      }

      navigate(getDefaultHomePath(loggedIn));
    } catch (err) {
      setError(
        err.response?.data?.detail
          || err.response?.data?.non_field_errors?.[0]
          || 'Invalid username or password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <ThemeToggle className="theme-toggle--floating" />
      <div className="login-card login-card--wide">
        <div className="login-card__brand">
          <span className={`login-card__logo${!isHall ? ' login-card__logo--gh' : ''}`}>
            {isHall ? 'G' : 'GH'}
          </span>
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
            <div className="login-field__wrap">
              <User size={18} className="login-field__icon" />
              <input
                id="login-username"
                type="text"
                required
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="login-field__wrap">
              <Lock size={18} className="login-field__icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
