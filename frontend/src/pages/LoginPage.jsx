import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loggedIn = await login({ username: username.trim(), password });
      const role = loggedIn?.role;
      if (role === 'ADMIN' || role === 'MANAGER') {
        navigate('/dashboard');
      } else {
        navigate('/bookings');
      }
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
      <div className="login-card">
        <div className="login-card__brand">
          <span className="login-card__logo">G</span>
          <div>
            <h1 className="login-card__title">Gateway</h1>
            <p className="login-card__subtitle">Marriage Hall Management</p>
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
                Sign in
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginPage;
