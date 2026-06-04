import { Link } from 'react-router-dom';

const NotFound = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
    <div>
      <h1 style={{ fontSize: '72px', fontWeight: '900', color: 'var(--primary)', margin: 0 }}>404</h1>
      <p style={{ fontSize: '18px', color: 'var(--text-muted)', margin: '16px 0 24px' }}>Page not found</p>
      <Link to="/dashboard" className="btn-primary" style={{ display: 'inline-block', padding: '12px 24px' }}>
        Go to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFound;
