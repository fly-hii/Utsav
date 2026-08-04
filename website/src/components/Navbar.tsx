import { Link } from 'react-router-dom';
import { Smartphone } from 'lucide-react';

export default function Navbar() {

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--glass-border)',
      zIndex: 1000,
      height: '5rem',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem' }}>
          <div style={{ background: 'var(--primary-color)', padding: '0.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={24} color="white" />
          </div>
          Utsav App
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="desktop-nav">
          <Link to="/privacy-policy" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Terms & Conditions</Link>
          <Link to="/support" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Support</Link>
          <button className="btn btn-primary">Download App</button>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
