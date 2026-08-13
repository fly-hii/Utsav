export default function ChildSafetyStandards() {
  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1.5rem', maxWidth: '800px' }}>
      <div className="glass-panel legal-content">
        <h1>Child Safety Standards</h1>
        <span className="last-updated">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        
        <p>
          At <strong>Utsav App</strong>, we are committed to providing a safe and secure environment for all our users. We have a zero-tolerance policy towards any content or behavior that harms or exploits children.
        </p>
        
        <h2>1. Prohibition of Child Sexual Abuse and Exploitation (CSAE)</h2>
        <p>
          Utsav App strictly prohibits any form of Child Sexual Abuse and Exploitation (CSAE). This includes, but is not limited to:
        </p>
        <ul>
          <li>Sharing, creating, or promoting content that depicts the sexual abuse or exploitation of minors.</li>
          <li>Grooming or any predatory behavior targeting children.</li>
          <li>Sharing non-consensual sexual content involving minors.</li>
          <li>Any activity that endangers the physical or emotional well-being of a child.</li>
        </ul>
        <p>
          Any user found violating these standards will have their account immediately suspended and permanently banned. We will also report such incidents to the relevant law enforcement authorities and child protection organizations as required by law.
        </p>

        <h2>2. Reporting Child Safety Issues</h2>
        <p>
          We take child safety incredibly seriously and rely on our community to help us keep Utsav App safe. If you encounter any content or behavior that violates our Child Safety Standards, please report it immediately.
        </p>

        <h2>3. Contact Team for Child Safety</h2>
        <p>
          For any child safety concerns, reports of CSAE, or related inquiries, please contact our dedicated Child Safety Team:
        </p>
        <ul>
          <li><strong>Email:</strong> safety@utsavapp.com</li>
          <li><strong>Contact Person:</strong> Child Safety and Compliance Officer</li>
        </ul>
        <p>
          You can also reach out through our <a href="/support" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>Support page</a> for urgent assistance.
        </p>

        <h2>4. Commitment to Review</h2>
        <p>
          We continually review and update our policies and moderation tools to ensure they effectively combat child exploitation and maintain a safe platform.
        </p>
      </div>
    </div>
  );
}
