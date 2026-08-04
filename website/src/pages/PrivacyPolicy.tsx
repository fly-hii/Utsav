export default function PrivacyPolicy() {
  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1.5rem', maxWidth: '800px' }}>
      <div className="glass-panel legal-content">
        <h1>Privacy Policy</h1>
        <span className="last-updated">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        
        <p>
          Welcome to Utsav App. We respect your privacy and are committed to protecting your personal data. 
          This privacy policy will inform you as to how we look after your personal data when you visit our 
          website or use our mobile applications (iOS and Android) and tell you about your privacy rights.
        </p>
        
        <h2>1. The Data We Collect About You</h2>
        <p>
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
        </p>
        <ul>
          <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
          <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
          <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
          <li><strong>Profile Data</strong> includes your username and password, interests, preferences, feedback and survey responses.</li>
          <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
        </ul>
        
        <h2>2. How We Use Your Personal Data</h2>
        <p>
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
        </p>
        <ul>
          <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
          <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
          <li>Where we need to comply with a legal obligation.</li>
        </ul>
        
        <h2>3. Data Security</h2>
        <p>
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
          used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data 
          to those employees, agents, contractors and other third parties who have a business need to know.
        </p>
        
        <h2>4. Data Retention</h2>
        <p>
          We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, 
          including for the purposes of satisfying any legal, regulatory, tax, accounting or reporting requirements.
        </p>
        
        <h2>5. Your Legal Rights</h2>
        <p>
          Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
        </p>
        <ul>
          <li>Request access to your personal data.</li>
          <li>Request correction of your personal data.</li>
          <li>Request erasure of your personal data.</li>
          <li>Object to processing of your personal data.</li>
          <li>Request restriction of processing your personal data.</li>
        </ul>
        
        <h2>6. Contact Us</h2>
        <p>
          If you have any questions about this privacy policy or our privacy practices, please contact us via our Support page.
        </p>
      </div>
    </div>
  );
}
