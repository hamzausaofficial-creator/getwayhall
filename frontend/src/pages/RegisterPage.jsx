import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Users, Building, User } from 'lucide-react';
import { register } from '../api/auth';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    tenant_name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await register(formData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#f8fafc' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10%' }}>
        <div style={{ maxWidth: '440px', width: '100%' }}>
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>Create your account</h1>
            <p style={{ color: '#64748b', fontSize: '16px' }}>Start your 14-day free trial today.</p>
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label>First Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input name="first_name" type="text" required value={formData.first_name} onChange={handleChange} placeholder="John" style={{ width: '100%', paddingLeft: '44px' }} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input name="last_name" type="text" required value={formData.last_name} onChange={handleChange} placeholder="Doe" style={{ width: '100%' }} />
                </div>
             </div>

            <div className="input-group">
              <label>Business / Hall Name</label>
              <div style={{ position: 'relative' }}>
                <Building size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input name="tenant_name" type="text" required value={formData.tenant_name} onChange={handleChange} placeholder="Grand Ballroom Elite" style={{ width: '100%', paddingLeft: '44px' }} />
              </div>
            </div>

            <div className="input-group">
              <label>Work Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="john@gateway.com" style={{ width: '100%', paddingLeft: '44px' }} />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange} placeholder="••••••••" style={{ width: '100%', paddingLeft: '44px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '10px' }}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '32px', color: '#64748b', fontSize: '14px' }}>
            Already have an account? <Link to="/login" style={{ color: '#5BD51E', fontWeight: '700', textDecoration: 'none' }}>Log in</Link>
          </p>
        </div>
      </div>
      
      <div style={{ flex: 1, backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', padding: '0 5%' }}>
        <div style={{ maxWidth: '480px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '24px', lineHeight: '1.2' }}>The complete operating system for venue owners.</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {[
              { icon: ShieldCheck, text: 'Enterprise-grade security for your customer data.' },
              { icon: Users, text: 'Collaborate with your entire staff in real-time.' },
              { icon: ArrowRight, text: 'Scale from one hall to a global network of venues.' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: 'rgba(91, 213, 30, 0.2)', padding: '10px', borderRadius: '12px' }}>
                  <item.icon size={24} color="#5BD51E" />
                </div>
                <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: '1.5' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
