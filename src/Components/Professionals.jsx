import { useState } from 'react';
import '../styles/Professionals.css';

const features = [
  {
    icon: '🤝',
    title: 'Referral Partnerships',
    desc: 'Earn referral fees when your clients choose our services.',
  },
  {
    icon: '📋',
    title: 'Trade Pricing',
    desc: 'Access wholesale material pricing for your projects.',
  },
  {
    icon: '⚡',
    title: 'Priority Scheduling',
    desc: 'Your clients get priority booking and faster turnaround.',
  },
];

export default function Professionals() {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuccess(true);
    e.target.reset();
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <section id="professionals" className="professionals-section">
      <div className="sticky-info">
        <div className="section-label">Trade Network</div>
        <h2 className="section-title" style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
          Are You a <em>Professional?</em>
        </h2>
        <p>
          We maintain a trusted network of contractors, designers, real estate professionals,
          and trades specialists. Join our database for referral opportunities and collaboration.
        </p>
        <div className="feature-list">
          {features.map((f) => (
            <div className="feature-item" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="form-card">
          <div className="form-title">Join Our Network</div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" placeholder="John Smith" required />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" placeholder="john@company.com" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Company / Business</label>
                <input type="text" placeholder="Smith Contracting LLC" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" placeholder="(555) 000-0000" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Profession *</label>
                <select required defaultValue="">
                  <option value="" disabled>Select profession...</option>
                  <option>General Contractor</option>
                  <option>Interior Designer</option>
                  <option>Real Estate Agent</option>
                  <option>Property Manager</option>
                  <option>Architect</option>
                  <option>Plumber</option>
                  <option>Electrician</option>
                  <option>Other Trade</option>
                </select>
              </div>
              <div className="form-group">
                <label>Specialty / Focus Area</label>
                <input type="text" placeholder="e.g. Residential Renovation" />
              </div>
            </div>
            <div className="form-group">
              <label>Message (optional)</label>
              <textarea placeholder="Tell us about your work or how you'd like to collaborate..." />
            </div>
            <button type="submit" className="form-submit">Submit to Network</button>
          </form>
          <div className={`success-banner ${showSuccess ? 'show' : ''}`}>
            ✓ Thank you! We'll be in touch soon about partnership opportunities.
          </div>
        </div>
      </div>
    </section>
  );
}
