import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft } from 'lucide-react';
import AppLogo from '../AppLogo';
import { BRAND_GUEST_HOUSE } from '../../constants/brand';

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden; }
  .gh-print-doc, .gh-print-doc * { visibility: visible; }
  .gh-print-doc {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    max-width: 100%;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }
  .print-hide { display: none !important; }
}
`;

export default function GhPrintShell({ title, subtitle, children, autoPrint = true, backTo }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!autoPrint || !children) return undefined;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [autoPrint, children]);

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '24px' }}>
      <style>{PRINT_STYLES}</style>

      <div
        className="print-hide"
        style={{
          maxWidth: '900px',
          margin: '0 auto 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--secondary)' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ChevronLeft size={16} /> Back
          </button>
          <button type="button" className="btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      <div
        className="gh-print-doc print-page-a5"
        style={{
          margin: '0 auto',
          padding: '16px 18px',
          background: '#fff',
          color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function GhPrintHeader({ docType }) {
  return (
    <header className="gh-print-header">
      <AppLogo
        size="sm"
        tone="dark"
        showName
        name={BRAND_GUEST_HOUSE}
        className="app-logo--print"
        nameClassName="app-logo__print-title"
      />
      {docType ? <p className="gh-print-header__type">{docType}</p> : null}
    </header>
  );
}

export function GhPrintFooter() {
  return (
    <footer className="gh-print-footer">
      <p>This is a computer-generated document. Printed {new Date().toLocaleString()}.</p>
      <p>Thank you for staying with us.</p>
    </footer>
  );
}
