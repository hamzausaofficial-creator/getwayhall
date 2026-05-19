import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
      await login({ email: username, password }); // Backend uses email
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    height: '56px',
    backgroundColor: '#f1f5f9',
    border: '2px solid transparent',
    borderRadius: '12px',
    padding: '0 52px',
    fontSize: '15px',
    color: '#0f172a',
    transition: 'all 0.3s ease',
    outline: 'none',
    boxSizing: 'border-box',
    display: 'block'
  };

  const iconStyle = {
    position: 'absolute',
    left: '18px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
    pointerEvents: 'none',
    zIndex: 10
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#f8fafc',
    }}>
      {/* Left Branding Panel */}
      <div style={{
        flex: 1,
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontSize: '56px', fontWeight: '800', marginBottom: '24px', letterSpacing: '-0.02em' }}>
            Gateway <span style={{ color: '#5BD51E' }}>Marriage</span><br />Hall
          </h1>
          <p style={{ fontSize: '20px', color: '#94a3b8', lineHeight: '1.6', maxWidth: '520px', marginBottom: '60px' }}>
            The all-in-one platform for professional venue managers. Manage bookings, customers, and payments with ease.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {[
              { title: 'Secure Access', desc: 'Enterprise-grade encryption for all your data.' },
              { title: 'Real-time Sync', desc: 'Your schedule stays updated across all devices.' },
              { title: 'AI Analytics', desc: 'Predictive insights for venue utilization.' }
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <ShieldCheck size={24} color="#5BD51E" />
                </div>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{f.title}</h4>
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <div style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Welcome Back</h2>
            <p style={{ color: '#64748b', fontSize: '16px' }}>Enter your credentials to access your dashboard.</p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '24px',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '100%',
            alignItems: 'stretch'
          }}>
            {/* Username Field */}
            <div style={{ width: '100%', display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', height: '24px' }}>
                <label style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Email</label>
                <div style={{ width: '100px' }}></div>
              </div>
              <div style={{ position: 'relative', width: '100%' }}>
                <Users size={20} style={iconStyle} />
                <input
                  type="text"
                  required
                  placeholder="admin@gateway.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#5BD51E';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(91, 213, 30, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'transparent';
                    e.target.style.backgroundColor = '#f1f5f9';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ width: '100%', display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', height: '24px' }}>
                <label style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Password</label>
                <button type="button" style={{ fontSize: '13px', color: '#5BD51E', fontWeight: '700', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>Forgot Password?</button>
              </div>
              <div style={{ position: 'relative', width: '100%' }}>
                <Lock size={20} style={iconStyle} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#5BD51E';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(91, 213, 30, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'transparent';
                    e.target.style.backgroundColor = '#f1f5f9';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '18px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'transparent',
                    color: '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="checkbox" id="remember" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="remember" style={{ fontSize: '14px', color: '#64748b', cursor: 'pointer', fontWeight: '500' }}>Keep me signed in</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: '56px',
                backgroundColor: '#5BD51E',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(91, 213, 30, 0.3)'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4bc015'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#5BD51E'}
            >
              {isLoading ? 'Signing in...' : (
                <>
                  Sign In <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '15px', color: '#64748b' }}>
              Don't have an account? <button style={{ color: '#5BD51E', fontWeight: '800', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>Contact Sales</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
