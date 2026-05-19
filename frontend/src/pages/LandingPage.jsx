import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Calendar, 
  Users, 
  BarChart3, 
  ShieldCheck, 
  Star, 
  ChevronRight,
  Menu,
  X,
  Play,
  CheckCircle2,
  Clock,
  Briefcase,
  HelpCircle,
  Plus,
  Minus,
  Quote
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroImage = "/hero.png";
  const dashboardPreview = "C:\\Users\\Al Rehman Laptop\\.gemini\\antigravity\\brain\\25b9a93e-4da3-4588-9914-d6942dccdf61\\hallora_dashboard_preview_1778926603933.png";

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div style={{ backgroundColor: '#f7f9fb', color: '#191c1e', fontFamily: 'Inter, sans-serif' }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8%',
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
        borderBottom: isScrolled ? '1px solid #e2e8f0' : 'none',
        zIndex: 1000,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#191c1e' }}>
          Gateway <span style={{ color: '#5BD51E' }}>Marriage Hall</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {['Features', 'Solutions', 'Pricing', 'Resources'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{ fontWeight: '600', color: '#594139', fontSize: '15px' }}>{item}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => navigate('/dashboard')}
              style={{ padding: '10px 24px', fontWeight: '700', backgroundColor: 'transparent', color: '#191c1e', border: 'none', cursor: 'pointer' }}
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              style={{ 
                padding: '12px 28px', 
                borderRadius: '50px', 
                backgroundColor: '#5BD51E', 
                color: 'white', 
                border: 'none', 
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(91, 213, 30, 0.3)'
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        padding: '160px 8% 100px 8%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ 
          backgroundColor: '#e5fcd7', 
          color: '#1d6b05', 
          padding: '8px 20px', 
          borderRadius: '50px', 
          fontSize: '14px', 
          fontWeight: '700',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          Trusted by 200+ Premier Venues Globally
        </div>
        
        <h1 style={{ 
          fontSize: '64px', 
          fontWeight: '800', 
          lineHeight: '1.1', 
          maxWidth: '1000px', 
          marginBottom: '32px',
          color: '#191c1e',
          letterSpacing: '-0.02em'
        }}>
          Manage Your Marriage Hall Business <span style={{ color: '#5BD51E' }}>Smarter</span>
        </h1>
        
        <p style={{ 
          fontSize: '20px', 
          color: '#594139', 
          maxWidth: '800px', 
          lineHeight: '1.6', 
          marginBottom: '48px' 
        }}>
          Automate bookings, track revenue in real-time, and coordinate your staff with the all-in-one platform designed specifically for luxury venue owners.
        </p>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '80px' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              padding: '20px 48px', 
              fontSize: '18px', 
              borderRadius: '50px', 
              backgroundColor: '#5BD51E', 
              color: 'white', 
              border: 'none', 
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 20px 40px rgba(91, 213, 30, 0.25)'
            }}
          >
            Start Free Trial <ArrowRight size={22} />
          </button>
          <button style={{ 
            padding: '20px 48px', 
            fontSize: '18px', 
            borderRadius: '50px', 
            backgroundColor: 'white', 
            color: '#191c1e', 
            border: '1px solid #e2e8f0', 
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            Watch Demo
          </button>
        </div>

        {/* Dashboard/Hero Visual */}
        <div style={{ 
          width: '100%', 
          maxWidth: '1200px'
        }}>
          <img src={heroImage} alt="Luxury Venue" style={{ width: '100%', display: 'block' }} />
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '100px 8%', backgroundColor: '#0f172a', color: 'white' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', textAlign: 'center' }}>
          {[
            { label: 'Client Satisfaction', value: '98%' },
            { label: 'Events Managed', value: '12k+' },
            { label: 'Priority Support', value: '24/7' },
            { label: 'Revenue Tracked', value: 'Rs 40M+' }
          ].map((s, i) => (
            <div key={i}>
              <h3 style={{ fontSize: '48px', fontWeight: '800', color: '#5BD51E', marginBottom: '8px' }}>{s.value}</h3>
              <p style={{ fontSize: '16px', color: '#94a3b8', fontWeight: '600' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '120px 8%', backgroundColor: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '24px' }}>Everything You Need</h2>
          <p style={{ fontSize: '18px', color: '#594139', maxWidth: '700px', margin: '0 auto' }}>
            Stop juggling spreadsheets and manual notes. Gateway Marriage Hall provides the precision tools to manage your wedding venue with zero friction.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '60px' }}>
          {[
            { 
              title: 'Automated Bookings', 
              icon: Calendar, 
              desc: 'Intelligent scheduling that prevents double bookings and manages deposits automatically. Send professional contracts and secure payments in minutes.' 
            },
            { 
              title: 'Revenue Analytics', 
              icon: BarChart3, 
              desc: "Deep insights into your venue's financial health with real-time forecasting and expense tracking." 
            },
            { 
              title: 'Staff Management', 
              icon: Users, 
              desc: 'Assign tasks to vendors and staff members. Real-time updates on setup progress for every event.' 
            },
            { 
              title: 'Crystal Clear Reporting', 
              icon: Briefcase, 
              desc: 'Generated automated monthly reports for taxes, inventory, and hall maintenance schedules with one click.' 
            }
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '32px' }}>
              <div style={{ 
                minWidth: '64px', 
                height: '64px', 
                backgroundColor: '#e5fcd7', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#5BD51E'
              }}>
                <f.icon size={32} />
              </div>
              <div>
                <h4 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>{f.title}</h4>
                <p style={{ fontSize: '16px', color: '#594139', lineHeight: '1.6' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '120px 8%', backgroundColor: '#f7f9fb' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '24px' }}>Flexible Plans</h2>
          <p style={{ fontSize: '18px', color: '#594139' }}>Choose the plan that fits your venue's growth stage.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
          {[
            { 
              name: 'Starter', 
              price: '14,999', 
              desc: 'Perfect for single venue owners just getting started.',
              features: ['Up to 50 bookings / month', 'Basic Revenue Tracking', '2 Staff Accounts']
            },
            { 
              name: 'Pro', 
              price: '34,999', 
              desc: 'For growing businesses with multiple halls.',
              features: ['Unlimited Bookings', 'Advanced Analytics & AI Forecasting', 'Unlimited Staff Accounts', 'Vendor Portal Access'],
              popular: true
            },
            { 
              name: 'Enterprise', 
              price: 'Custom', 
              desc: 'Custom solutions for large venue networks.',
              features: ['Dedicated Success Manager', 'Custom API Integrations', 'White-label Guest Portal', 'Multi-location Management']
            }
          ].map((p, i) => (
            <div key={i} style={{ 
              backgroundColor: 'white', 
              padding: '48px', 
              borderRadius: '24px', 
              border: p.popular ? '2px solid #5BD51E' : '1px solid #e2e8f0',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {p.popular && (
                <div style={{ 
                  position: 'absolute', 
                  top: '24px', 
                  right: '24px', 
                  backgroundColor: '#e5fcd7', 
                  color: '#5BD51E', 
                  padding: '4px 12px', 
                  borderRadius: '50px', 
                  fontSize: '12px', 
                  fontWeight: '800' 
                }}>
                  MOST POPULAR
                </div>
              )}
              <h3 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px' }}>{p.name}</h3>
              <p style={{ color: '#594139', marginBottom: '32px', fontSize: '15px' }}>{p.desc}</p>
              <div style={{ marginBottom: '40px' }}>
                <span style={{ fontSize: '48px', fontWeight: '900' }}>{p.price === 'Custom' ? 'Custom' : <><span style={{ fontSize: '50%', fontWeight: '600', opacity: 0.6 }}>Rs</span> {p.price}</>}</span>
                {p.price !== 'Custom' && <span style={{ color: '#594139', fontSize: '16px' }}>/mo</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px', flex: 1 }}>
                {p.features.map((f, fi) => (
                  <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={20} color="#10b981" />
                    <span style={{ fontSize: '15px', color: '#191c1e' }}>{f}</span>
                  </div>
                ))}
              </div>
              <button style={{ 
                width: '100%', 
                padding: '16px', 
                borderRadius: '12px', 
                backgroundColor: p.popular ? '#5BD51E' : '#191c1e', 
                color: 'white', 
                fontWeight: '700', 
                border: 'none',
                cursor: 'pointer'
              }}>
                Get Started Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial Section */}
      <section style={{ padding: '120px 8%', backgroundColor: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Quote size={64} color="#e5fcd7" style={{ marginBottom: '32px' }} />
          <h2 style={{ fontSize: '32px', fontWeight: '700', lineHeight: '1.4', marginBottom: '40px', color: '#191c1e' }}>
            "Gateway Marriage Hall has completely transformed how we handle wedding season. We've seen a 30% increase in revenue simply by automating our follow-ups and managing availability more precisely."
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', marginBottom: '16px' }}></div>
            <h5 style={{ fontSize: '18px', fontWeight: '800' }}>Jameson Sterling</h5>
            <p style={{ color: '#594139', fontSize: '14px' }}>Owner, Sterling Grand Halls</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="resources" style={{ padding: '120px 8%', backgroundColor: '#f7f9fb' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '24px' }}>Frequently Asked Questions</h2>
        </div>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { 
              q: 'Can I migrate my existing data?', 
              a: 'Yes! Our concierge team helps you import all your current bookings, customer lists, and financial records from Excel or other platforms for free during your trial.' 
            },
            { 
              q: 'Does it support multiple hall locations?', 
              a: 'Our Pro and Enterprise plans are designed specifically for businesses with multiple venues, offering a unified dashboard with location-specific reporting.' 
            },
            { 
              q: 'How secure is my customer data?', 
              a: 'We use bank-grade AES-256 encryption and follow strict GDPR compliance to ensure your data and your clients\' privacy are always protected.' 
            }
          ].map((faq, i) => (
            <div key={i} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <button 
                onClick={() => toggleFaq(i)}
                style={{ 
                  width: '100%', 
                  padding: '24px 32px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  backgroundColor: 'white', 
                  border: 'none', 
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: '700' }}>{faq.q}</span>
                {activeFaq === i ? <Minus size={20} color="#5BD51E" /> : <Plus size={20} color="#5BD51E" />}
              </button>
              {activeFaq === i && (
                <div style={{ padding: '0 32px 24px 32px', color: '#594139', lineHeight: '1.6' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '120px 8%', textAlign: 'center', backgroundColor: 'white' }}>
        <h2 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '32px' }}>Ready to Scale Your Venue?</h2>
        <p style={{ fontSize: '20px', color: '#594139', marginBottom: '48px' }}>
          Join hundreds of premier halls that trust Gateway Marriage Hall to power their business. No credit card required to start.
        </p>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{ 
            padding: '20px 60px', 
            fontSize: '20px', 
            borderRadius: '50px', 
            backgroundColor: '#5BD51E', 
            color: 'white', 
            border: 'none', 
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 20px 40px rgba(91, 213, 30, 0.3)'
          }}
        >
          Get Started for Free
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: '80px 8% 40px 8%', backgroundColor: '#f7f9fb', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '60px', marginBottom: '80px' }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#191c1e', marginBottom: '24px' }}>
              Gateway <span style={{ color: '#5BD51E' }}>Marriage Hall</span>
            </div>
            <p style={{ color: '#594139', lineHeight: '1.6', maxWidth: '300px' }}>
              Elevating venue management through precision and elegance. The premier operating system for the wedding industry.
            </p>
          </div>
          <div>
            <h5 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px' }}>Product</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {['Booking Engine', 'Revenue Dashboard', 'Staff Scheduling', 'Integrations'].map(l => (
                <a key={l} href="#" style={{ color: '#594139', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
          <div>
            <h5 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px' }}>Company</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {['About Us', 'Careers', 'Press Kit', 'Contact'].map(l => (
                <a key={l} href="#" style={{ color: '#594139', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
          <div>
            <h5 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px' }}>Support</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {['Help Center', 'Privacy Policy', 'Terms of Service', 'Cookie Settings'].map(l => (
                <a key={l} href="#" style={{ color: '#594139', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '14px' }}>
          <span>© 2024 Gateway Marriage Hall. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span>Privacy</span>
            <span>Terms</span>
            <span>Cookies</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
