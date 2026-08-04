import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      padding: '4rem 0 2rem 0',
      marginTop: '4rem',
      background: 'var(--surface-color)'
    }}>
      <div className="container">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', marginBottom: '3rem' }}>
          <div style={{ maxWidth: '300px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Utsav App</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              The ultimate platform for managing your events and community activities seamlessly.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '4rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link to="/privacy-policy" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Privacy Policy</Link>
                <Link to="/terms" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Terms of Service</Link>
              </div>
            </div>
            
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Support</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link to="/support" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Contact Us</Link>
                <Link to="/support" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>FAQ</Link>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          borderTop: '1px solid var(--border-color)', 
          paddingTop: '2rem', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem'
        }}>
          <p>&copy; {new Date().getFullYear()} Utsav App. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
