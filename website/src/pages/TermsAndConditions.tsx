export default function TermsAndConditions() {
  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1.5rem', maxWidth: '800px' }}>
      <div className="glass-panel legal-content">
        <h1>Terms & Conditions</h1>
        <span className="last-updated">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        
        <p>
          Please read these terms and conditions carefully before using Our Service.
        </p>
        
        <h2>1. Interpretation and Definitions</h2>
        <h3>Interpretation</h3>
        <p>
          The words of which the initial letter is capitalized have meanings defined under the following conditions. 
          The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
        </p>
        
        <h3>Definitions</h3>
        <p>For the purposes of these Terms and Conditions:</p>
        <ul>
          <li><strong>Application</strong> means the software program provided by the Company downloaded by You on any electronic device, named Utsav App.</li>
          <li><strong>Application Store</strong> means the digital distribution service operated and developed by Apple Inc. (Apple App Store) or Google Inc. (Google Play Store) in which the Application has been downloaded.</li>
          <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Utsav App.</li>
          <li><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</li>
          <li><strong>Service</strong> refers to the Application.</li>
        </ul>
        
        <h2>2. Acknowledgment</h2>
        <p>
          These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. 
          These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.
        </p>
        <p>
          Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. 
          These Terms and Conditions apply to all visitors, users and others who access or use the Service.
        </p>
        
        <h2>3. User Accounts</h2>
        <p>
          When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. 
          Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.
        </p>
        <p>
          You are responsible for safeguarding the password that You use to access the Service and for any activities or actions under Your password.
        </p>
        
        <h2>4. Content</h2>
        <p>
          Our Service allows You to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. 
          You are responsible for the Content that You post to the Service, including its legality, reliability, and appropriateness.
        </p>
        
        <h2>5. Links to Other Websites</h2>
        <p>
          Our Service may contain links to third-party web sites or services that are not owned or controlled by the Company. 
          The Company has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services.
        </p>
        
        <h2>6. Termination</h2>
        <p>
          We may terminate or suspend Your Account immediately, without prior notice or liability, for any reason whatsoever, 
          including without limitation if You breach these Terms and Conditions.
        </p>
        
        <h2>7. Changes to These Terms and Conditions</h2>
        <p>
          We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. 
          If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. 
          What constitutes a material change will be determined at Our sole discretion.
        </p>
      </div>
    </div>
  );
}
