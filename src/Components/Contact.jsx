import { useState } from 'react';
import './Contact.css';

const SERVICES_NEEDED = [
  'Hardwood Flooring',
  'Tile / Stone Flooring',
  'Laminate / LVP Flooring',
  'Bathroom Remodel',
  'Shower / Tub Tile',
  'Kitchen Remodel',
  'Full Project Consultation',
  'Other',
];

const CONTACT_DETAILS = [
  { icon: '📍', title: 'Address',       body: <>5437 Mapledale Plaza<br />Woodbridge, VA 22193</> },
  { icon: '📞', title: 'Phone',         body: '(703) 580-1222' },
  { icon: '🗺️', title: 'Service Area', body: 'Proudly serving Woodbridge and surrounding Northern Virginia communities.' },
  { icon: '🕐', title: 'Business Hours',body: <>Monday – Saturday: 10:00 AM – 6:00 PM<br />Sunday: Closed</> },
];

export default function Contact() {
  const [showSuccess, setShowSuccess]       = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);

  const toggleService = (v) =>
    setSelectedServices((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuccess(true);
    setSelectedServices([]);
    e.target.reset();
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <section id="contact">
      {/* ── Left: form ── */}
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Estimated Budget</label>
                <select>
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
                <select>
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
              <label>
                Service Needed *{' '}
                <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>(select all that apply)</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', padding: 16, border: '1.5px solid var(--cream-dark)', background: 'var(--cream)' }}>
                {SERVICES_NEEDED.map((svc) => (
                  <label key={svc} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.87rem', letterSpacing: 0, textTransform: 'none', color: 'var(--text)', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      name="service"
                      value={svc}
                      checked={selectedServices.includes(svc)}
                      onChange={() => toggleService(svc)}
                    />
                    {svc}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Project Description *</label>
              <textarea
                required
                style={{ minHeight: 120 }}
                placeholder="Tell us about your project – the space, square footage, any specific materials or styles you have in mind..."
              />
            </div>

            <button type="submit" className="form-submit">Send My Request</button>
          </form>

          <div className={`success-banner ${showSuccess ? 'show' : ''}`}>
            ✓ Request received! We'll reach out within 24 hours to schedule your free consultation.
          </div>
        </div>
      </div>

      {/* ── Right: info ── */}
      <div className="sticky-info">
        <div className="section-label">Reach Us</div>
        <h2 className="section-title" style={{ fontSize: '2.4rem', marginBottom: 16 }}>
          Let's Start Your <em>Project</em>
        </h2>
        <p style={{ color: 'var(--mid)', fontSize: '0.9rem', lineHeight: 1.75, fontWeight: 300 }}>
          Free estimates and consultations for all residential and commercial projects.
          We serve the greater metro area with a turnaround quote in 24 hours.
        </p>
        <div className="contact-detail">
          {CONTACT_DETAILS.map((c) => (
            <div key={c.title} className="contact-item">
              <div className="contact-icon">{c.icon}</div>
              <div><h4>{c.title}</h4><p>{c.body}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}