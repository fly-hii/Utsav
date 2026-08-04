import { ArrowRight, ShieldCheck, Download, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={{ 
        padding: '8rem 0 6rem', 
        textAlign: 'center',
        background: 'radial-gradient(circle at top, var(--surface-hover) 0%, var(--bg-color) 60%)'
      }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '2rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--primary-color)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', display: 'inline-block' }}></span>
            Now available on iOS & Android
          </div>
          
          <h1 style={{ maxWidth: '800px', margin: '0 auto 1.5rem', fontSize: '4rem' }}>
            Elevate your community experience with <span style={{ color: 'var(--primary-color)' }}>Utsav App</span>
          </h1>
          
          <p style={{ maxWidth: '600px', margin: '0 auto 3rem', fontSize: '1.25rem' }}>
            The all-in-one platform to connect, manage, and engage with your committee and members seamlessly.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              <Download size={20} />
              App Store
            </button>
            <button className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              <Download size={20} />
              Google Play
            </button>
          </div>
        </div>
      </section>

      {/* Features/Trust Section */}
      <section style={{ padding: '5rem 0', background: 'var(--surface-color)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="glass-panel" style={{ textAlign: 'center' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '64px', height: '64px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary-color)' }}>
                <ShieldCheck size={32} />
              </div>
              <h3 style={{ marginBottom: '1rem' }}>Secure & Private</h3>
              <p>Your data is encrypted and secure. We strictly adhere to standard privacy protocols to keep your information safe.</p>
              <Link to="/privacy-policy" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                Read Privacy Policy <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="glass-panel" style={{ textAlign: 'center' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '64px', height: '64px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary-color)' }}>
                <Smartphone size={32} />
              </div>
              <h3 style={{ marginBottom: '1rem' }}>Cross Platform</h3>
              <p>Available on both iOS and Android. Our separate User and Committee apps ensure tailored experiences for everyone.</p>
              <Link to="/support" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                Get Support <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
