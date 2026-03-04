import { useState } from 'react';
import '../styles/Contact.css';

const contactDetails = [
  { icon: '📍', title: 'Address', text: '5437 Mapledale Plaza\nWoodbridge, VA 22193' },
  { icon: '📞', title: 'Phone', text: '(703) 580-1222' },
  { icon: '🌐', title: 'Website', text: 'www.smdesignfloors.com' },
  { icon: '🗺️', title: 'Service Area', text: 'Proudly serving Woodbridge and surrounding Northern Virginia communities.' },
  { icon: '🕐', title: 'Business Hours', text: 'Monday – Saturday: 10:00 AM – 6:00 PM\nSunday: Closed' },
];

export default function Contact() {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuccess(true);
    e.target.reset();
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <section id="contact" className="contact-section">
      <div>
        <div className="form-card">
          <div className="form-title">Request a Quote</div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Your Name *</label>
                <input type="text" placeholder="Jane Doe" required />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" placeholder="jane@example.com" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" placeholder="(555) 000-0000" />
              </div>
              <div className="form-group">
                <label>Service Needed *</label>
                <select required defaultValue="">
                  <option value="" disabled>Select a service...</option>
                  <option>Hardwood Flooring</option>
                  <option>Tile / Stone Flooring</option>
                  <option>Laminate / LVP Flooring</option>
                  <option>Bathroom Remodel</option>
                  <option>Shower / Tub Tile</option>
                  <option>Kitchen Remodel</option>
                  <option>Kitchen Backsplash</option>
                  <option>Full Project Consultation</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Estimated Budget</label>
                <select defaultValue="">
                  <option value="">Select range...</option>
                  <option>Under $2,000</option>
                  <option>$2,000 – $5,000</option>
                  <option>$5,000 – $10,000</option>
                  <option>$10,000 – $25,000</option>
                  <option>$25,000+</option>
                </select>
              </div>
              <div className="form-group">
                <label>Desired Timeline</label>
                <select defaultValue="">
                  <option value="">Select timeline...</option>
                  <option>ASAP</option>
                  <option>Within 1 month</option>
                  <option>1–3 months</option>
                  <option>3–6 months</option>
                  <option>Flexible / Planning stage</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Project Description *</label>
              <textarea
                required
                style={{ minHeight: '120px' }}
                placeholder="Tell us about your project — the space, square footage, any specific materials or styles you have in mind..."
              />
            </div>
            <button type="submit" className="form-submit">Send My Request</button>
          </form>
          <div className={`success-banner ${showSuccess ? 'show' : ''}`}>
            ✓ Request received! We'll reach out within 24 hours to schedule your free consultation.
          </div>
        </div>
      </div>

      <div className="contact-sticky">
        <div className="section-label">Reach Us</div>
        <h2 className="section-title" style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
          Let's Start Your <em>Project</em>
        </h2>
        <p>
          Free estimates and consultations for all residential and commercial projects. We serve
          the greater metro area with a turnaround quote in 24 hours.
        </p>
        <div className="contact-detail">
          {contactDetails.map((item) => (
            <div className="contact-item" key={item.title}>
              <div className="contact-icon">{item.icon}</div>
              <div>
                <h4>{item.title}</h4>
                <p style={{ whiteSpace: 'pre-line' }}>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
