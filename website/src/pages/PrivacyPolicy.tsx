export default function PrivacyPolicy() {
  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1.5rem', maxWidth: '800px' }}>
      <div className="glass-panel legal-content">
        <h1>Privacy Policy</h1>
        <span className="last-updated">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        
        <p>
          Welcome to Utsav App (comprising the Utsav Committee App and the Utsav User App). We respect your privacy and are committed to protecting your personal data. 
          This privacy policy will inform you as to how we look after your personal data when you visit our 
          website or use our mobile applications (iOS and Android) and tell you about your privacy rights in compliance with Apple App Store and Google Play Store guidelines.
        </p>
        
        <h2>1. The Data We Collect About You</h2>
        <p>
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
        </p>
        <ul>
          <li><strong>Identity Data:</strong> includes first name, last name, profile picture, and committee/temple details.</li>
          <li><strong>Contact Data:</strong> includes your telephone number (verified via OTP) and address information.</li>
          <li><strong>Location Data (GPS):</strong> For the Committee App, we collect precise GPS coordinates strictly during committee registration to verify the physical location of the temple or event. This data is not tracked continuously in the background.</li>
          <li><strong>Media & Files:</strong> We collect photos, videos, and PDF documents uploaded by you for committee verification, event creation, and member profiles.</li>
          <li><strong>Financial & Transaction Data:</strong> We track donation history and committee expenses within the app for transparency. Note: Payment processing is handled securely by certified third-party gateways; we do not store full credit card details.</li>
          <li><strong>Technical & Usage Data:</strong> includes device information, IP address, operating system, and how you interact with the app.</li>
        </ul>
        
        <h2>2. How We Use Your Personal Data</h2>
        <p>
          We will only use your personal data when the law allows us to. Most commonly, we use it to:
        </p>
        <ul>
          <li>Register you as a new user or committee member.</li>
          <li>Facilitate the creation and tracking of local festivals, events, and live streams.</li>
          <li>Process donations and maintain transparent financial ledgers for committees.</li>
          <li>Provide customer support and ensure the security of our platforms.</li>
        </ul>
        
        <h2>3. Data Deletion and Account Removal (App Store / Google Play Compliance)</h2>
        <p>
          You have the right to request the deletion of your account and associated personal data at any time. 
          <strong>To delete your account:</strong>
        </p>
        <ul>
          <li>Navigate to the "Settings" or "Profile" tab within the Utsav App (User or Committee).</li>
          <li>Select "Delete Account".</li>
          <li>Confirm the deletion. All personal data, session history, and media uploaded by you (that is not part of an immutable committee financial ledger) will be permanently deleted from our active servers within 30 days.</li>
        </ul>
        <p>Alternatively, you may request data deletion by contacting us directly via our Support page.</p>

        <h2>4. Data Security & Third Parties</h2>
        <p>
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
          used, or accessed in an unauthorized way. We may share limited data with secure third-party service providers (like OTP SMS providers, map services, and payment gateways) strictly for app functionality.
        </p>
        
        <h2>5. Your Legal Rights</h2>
        <p>
          Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or restriction of processing.
        </p>
        
        <h2>6. Contact Us</h2>
        <p>
          If you have any questions about this privacy policy or our privacy practices, please contact us via our Support page.
        </p>
      </div>
    </div>
  );
}
