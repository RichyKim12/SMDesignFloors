import { useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import './PrivacyModal.css';

export default function PrivacyModal({ isOpen, onClose }) {
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) {
    return <div className="privacy-modal-overlay" aria-hidden="true" />;
  }

  return (
    <div
      className={`privacy-modal-overlay ${isOpen ? 'visible' : ''}`}
      onClick={onClose}
    >
      <FocusTrap active={isOpen}>
        <div
          ref={modalRef}
          className="privacy-modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="privacy-modal-close"
            onClick={onClose}
            aria-label="Close privacy policy"
          >
            ✕
          </button>

          <p className="privacy-eyebrow">SM Design Floors</p>
          <h2 id="privacy-modal-title" className="privacy-title">
            Privacy Policy
          </h2>
          <p className="privacy-updated">Effective Date: August 12, 2026</p>

          <div className="privacy-modal-body">
            <section className="privacy-section">
              <h3>1. Information We Collect</h3>
              <p>
                When you register for a contractor account through <strong>ProServices</strong>, submit a contact form, or sign in to our client dashboard, we collect personal and professional details provided directly to us:
              </p>
              <ul>
                <li><strong>Contact Data:</strong> Full name, email address, phone number, and physical mailing/service address.</li>
                <li><strong>Professional Details:</strong> Company name, years of experience, trade specialties, availability, website URL, and portfolio/resume file attachments.</li>
                <li><strong>Credentials:</strong> Authentication data managed securely through Supabase Auth. We never store raw passwords.</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h3>2. How We Use Your Information</h3>
              <p>We use the collected information strictly to:</p>
              <ul>
                <li>Match contractors and trade partners with relevant flooring and remodeling projects.</li>
                <li>Process and verify trade account applications.</li>
                <li>Authenticate user access to contractor and admin dashboards.</li>
                <li>Send administrative notices, account verification emails, and system updates.</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h3>3. Data Storage &amp; Security</h3>
              <p>
                Your information is stored in secure database infrastructure managed by Supabase with Row Level Security (RLS) policies enforced. We implement rate limiting, client-side sanitization, and encrypted data transfer (HTTPS/TLS) across all forms.
              </p>
            </section>

            <section className="privacy-section">
              <h3>4. Information Sharing &amp; Third Parties</h3>
              <p>
                <strong>We do not sell, rent, or trade your personal information.</strong> Data is shared only with core infrastructure providers (e.g., database hosts, transactional email services) necessary to operate our platform under confidentiality agreements.
              </p>
            </section>

            <section className="privacy-section">
              <h3>5. Your Rights &amp; Control</h3>
              <p>
                You may request access to, correction of, or permanent deletion of your account data at any time by contacting us at <a href="mailto:privacy@smdesignfloors.com">privacy@smdesignfloors.com</a>.
              </p>
            </section>
          </div>

          <div className="privacy-modal-footer">
            <button className="privacy-modal-btn" onClick={onClose} autoFocus>
              I Understand
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}