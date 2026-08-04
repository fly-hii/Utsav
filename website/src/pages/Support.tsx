import { Mail, MessageCircle, FileQuestion } from 'lucide-react';
import { useState } from 'react';

export default function Support() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1.5rem', maxWidth: '1000px' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>How can we help?</h1>
        <p style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          We're here to help and answer any question you might have. We look forward to hearing from you.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
            <Mail size={32} />
          </div>
          <h3 style={{ marginBottom: '0.5rem' }}>Email Us</h3>
          <p style={{ marginBottom: '1.5rem' }}>Email us for general queries, including marketing and partnership opportunities.</p>
          <a href="mailto:support@utsavapp.com" style={{ fontWeight: 600 }}>support@utsavapp.com</a>
        </div>
        
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
            <MessageCircle size={32} />
          </div>
          <h3 style={{ marginBottom: '0.5rem' }}>Live Chat</h3>
          <p style={{ marginBottom: '1.5rem' }}>Our friendly team is here to help you via our in-app support chat.</p>
          <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Available 24/7 in-app</span>
        </div>
        
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
            <FileQuestion size={32} />
          </div>
          <h3 style={{ marginBottom: '0.5rem' }}>FAQ</h3>
          <p style={{ marginBottom: '1.5rem' }}>Find answers to common questions about setting up and using the app.</p>
          <a href="#faq" style={{ fontWeight: 600 }}>Read FAQs</a>
        </div>
      </div>

      <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Send us a message</h2>
        
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '1rem', color: '#4ade80' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Message Sent!</h3>
            <p style={{ margin: 0 }}>Thank you for reaching out. We'll get back to you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Name</label>
                <input 
                  required
                  type="text" 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }} 
                  placeholder="Your name"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
                <input 
                  required
                  type="email" 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }} 
                  placeholder="Your email"
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Subject</label>
              <select style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', appearance: 'none' }}>
                <option>Account Issue</option>
                <option>Billing Question</option>
                <option>Feature Request</option>
                <option>Bug Report</option>
                <option>Other</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Message</label>
              <textarea 
                required
                rows={5}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', resize: 'vertical' }} 
                placeholder="How can we help you?"
              ></textarea>
            </div>
            
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
