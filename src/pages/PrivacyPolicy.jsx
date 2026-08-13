import { useEffect } from 'react';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy | SM Design Floors';
  }, []);

  return (
    <div className="privacy-container">
      <div className="privacy-card">
        <p className="privacy-eyebrow">SM Design Floors</p>
        <h1 className="privacy-title">Privacy Policy</h1>
        <p className="privacy-updated">Effective Date: August 12, 2026</p>

        <section className="privacy-section">
          <h2>1. Information We Collect</h2>
          <p>
            When you register for a contractor account through <strong>ProServices</strong>, submit a contact form, or sign in to our client dashboard, we collect personal and professional details you provide directly to us:
          </p>
          <ul>
            <li><strong>Personal Contact Information:</strong> Full name, email address, phone number, and physical mailing/service address.</li>
            <li><strong>Professional &amp; Business Information:</strong> Business/company name, years of experience, trade specialties, availability, website URL, and portfolio/resume file attachments.</li>
            <li><strong>Account Credentials:</strong> Authentication data managed securely through our auth provider (Supabase Auth). We never store raw passwords.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>2. How We Use Your Information</h2>
          <p>We use the information collected to operate and improve our services, specifically to:</p>
          <ul>
            <li>Match contractors and trade partners with relevant flooring and remodeling projects.</li>
            <li>Process and verify trade account applications.</li>
            <li>Authenticate user access to contractor and admin dashboards.</li>
            <li>Send administrative communications, account verification links, and system updates.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. Data Storage &amp; Security</h2>
          <p>
            Your information is stored in secure database infrastructure provided by Supabase with Row Level Security (RLS) policies enforced. We implement rate limiting, client-side input sanitization, and encrypted data transfer (HTTPS/TLS) across all forms.
          </p>
        </section>

        <section className="privacy-section">
          <h2>4. Information Sharing &amp; Third Parties</h2>
          <p>
            <strong>We do not sell, rent, or trade your personal or business information to third parties.</strong> We only share data with service providers necessary to deliver our application services (e.g., database hosts, email delivery services) under strict confidentiality terms.
          </p>
        </section>

        <section className="privacy-section">
          <h2>5. Your Rights &amp; Data Control</h2>
          <p>You have the right to access, correct, or delete your account information at any time. To request data deletion or account removal, please contact us directly at <a href="mailto:privacy@smdesignfloors.com">privacy@smdesignfloors.com</a>.</p>
        </section>

        <section className="privacy-section">
          <h2>6. Contact Us</h2>
          <p>If you have questions regarding this Privacy Policy, please reach out via our contact page or email us directly.</p>
        </section>
      </div>
    </div>
  );
}