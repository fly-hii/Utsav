export default function TermsAndConditions() {
  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1.5rem', maxWidth: '800px' }}>
      <div className="glass-panel legal-content">
        <h1>Terms & Conditions (EULA)</h1>
        <span className="last-updated">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        
        <p>
          These Terms and Conditions ("Terms") and End User License Agreement ("EULA") govern your use of the Utsav Committee App, Utsav User App, and the Utsav website (collectively, the "Service") operated by Utsav App.
          By accessing or using the Service, you agree to be bound by these Terms.
        </p>
        
        <h2>1. User Accounts and Responsibilities</h2>
        <p>
          You are responsible for safeguarding the password and OTPs that you use to access the Service. You agree not to disclose your login credentials to any third party.
          You must provide accurate and complete information when creating an account or registering a committee.
        </p>

        <h2>2. Content & Objectionable Material (EULA)</h2>
        <p>
          The Utsav App allows users to post content, live streams, and comments. We maintain a <strong>zero-tolerance policy for objectionable content and abusive users</strong>. 
          By using our platform, you agree NOT to post, upload, or transmit any content that:
        </p>
        <ul>
          <li>Is defamatory, obscene, pornographic, offensive, or hateful.</li>
          <li>Promotes violence, discrimination, or illegal acts.</li>
          <li>Infringes upon the intellectual property rights of others.</li>
        </ul>
        <p>
          <strong>Content Moderation & Reporting:</strong> Users can flag and report objectionable content or abusive users directly within the app. Our moderation team reviews reports within 24 hours. We reserve the right to immediately remove offending content and permanently ban the user who provided it, without prior notice.
        </p>

        <h2>3. Donations and Financial Transactions</h2>
        <p>
          The Utsav App facilitates the collection of donations for temple and festival committees. 
        </p>
        <ul>
          <li>All donations made through the Utsav App are voluntary contributions to the respective committee.</li>
          <li>Utsav App acts merely as a technology facilitator and is not responsible for the ultimate use of funds by the committee.</li>
          <li><strong>No Refunds:</strong> Because donations are made directly to the registered committees for charitable and religious events, all transactions are final and non-refundable unless explicitly authorized by the committee.</li>
        </ul>

        <h2>4. Live Streaming</h2>
        <p>
          Committees may broadcast live streams of events. The committee is solely responsible for obtaining any necessary broadcasting rights or permissions. Utsav App reserves the right to terminate any live stream that violates our content policies.
        </p>

        <h2>5. Intellectual Property</h2>
        <p>
          The Service and its original content (excluding User-Provided Content), features, and functionality are and will remain the exclusive property of Utsav App and its licensors.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          In no event shall Utsav App, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
        </p>

        <h2>7. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any significant changes.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us through our Support page.
        </p>
      </div>
    </div>
  );
}
