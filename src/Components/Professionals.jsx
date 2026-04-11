import { useState, useRef } from 'react';
import './Professionals.css';

const FEATURES = [
  { title: 'Referral Partnerships', desc: 'Earn referral fees when your clients choose our services.' },
  { title: 'Trade Pricing',         desc: 'Access wholesale material pricing for your projects.' },
  { title: 'Priority Scheduling',   desc: 'Your clients get priority booking and faster turnaround.' },
];

const PROFESSIONS = [
  'General Contractor',
  'Hardwood Flooring',
  'Plumbing',
  'Bathroom Remodel',
  'Electrician',
  'Other Trade',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['Morning', 'Afternoon'];

export default function Professionals() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedProfs, setSelectedProfs] = useState([]);
  const [fileName, setFileName] = useState('');
  const [availability, setAvailability] = useState([]);
  const [certFile, setCertFile] = useState('');
  const [insuranceFile, setInsuranceFile] = useState('');

  const fileInputRef = useRef(null);
  const certFileRef = useRef(null);
  const insuranceFileRef = useRef(null);

  const toggleProf = (v) =>
    setSelectedProfs((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  const toggleSlot = (day, time) => {
    const slot = `${day} ${time}`;
    setAvailability((prev) =>
      prev.includes(slot) ? prev.filter((x) => x !== slot) : [...prev, slot]
    );
  };

  const isActive = (day, time) => availability.includes(`${day} ${time}`);

  const handleFile = (e) => setFileName(e.target.files[0]?.name || '');
  const handleCertFile = (e) => setCertFile(e.target.files[0]?.name || '');
  const handleInsuranceFile = (e) => setInsuranceFile(e.target.files[0]?.name || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuccess(true);
    setSelectedProfs([]);
    setFileName('');
    setCertFile('');
    setInsuranceFile('');
    setAvailability([]);
    e.target.reset();
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <section id="professionals">
      {/* ── Left: info ── */}
      <div className="sticky-info">
        <div className="section-label">Trade Network</div>
        <h2 className="section-title" style={{ fontSize: '2.4rem', marginBottom: 16 }}>
          Connect With Our <em>Network Today</em>
        </h2>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', fontWeight: 400, color: 'var(--tan-dark)', marginBottom: 16, letterSpacing: '0.04em' }}>
          Join ProServices
        </p>
        <p style={{ color: 'var(--mid)', fontSize: '0.9rem', lineHeight: 1.75, fontWeight: 300, maxWidth: 380 }}>
          ProServices is our dedicated contractor registration platform designed to connect skilled
          professionals with new project opportunities. Contractors can submit their business
          information, areas of expertise, service locations, licensing details, and contact
          information to become part of our trusted network.
          <br /><br />
          Whether you specialize in flooring, plumbing, electrical work, remodeling, or other trade
          services, ProServices makes it easy to get registered and stay connected. Once enrolled,
          our team can quickly reach out when projects matching your skills become available.
          <br /><br />
          Join ProServices today and grow your business with new opportunities.
        </p>
        <div className="feature-list">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-item">
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: form ── */}
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

            <div className="form-group">
              <label>
                Profession * <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>(select all that apply)</span>
              </label>
              <div className="profession-grid">
                {PROFESSIONS.map((prof) => (
                  <label key={prof} className="checkbox-item">
                    <input
                      type="checkbox"
                      name="profession"
                      value={prof}
                      checked={selectedProfs.includes(prof)}
                      onChange={() => toggleProf(prof)}
                    />
                    {prof}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Specialty / Focus Area</label>
                <input type="text" placeholder="e.g. Residential Renovation" />
              </div>
              <div className="form-group">
                <label>City &amp; State</label>
                <input type="text" placeholder="e.g. Woodbridge, VA" />
              </div>
            </div>

            {/* ── Availability Toggle Pills ── */}
            <div className="form-group">
              <label>
                Availability to be contacted{' '}
                <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>(select all that apply)</span>
              </label>
              <div className="availability-table-wrapper">
                <table className="availability-table">
                  <thead>
                    <tr>
                      <th></th>
                      {DAYS.map((day) => (
                        <th key={day}>{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIMES.map((time) => (
                      <tr key={time}>
                        <td className="time-label">{time}</td>
                        {DAYS.map((day) => (
                          <td key={day}>
                            <button
                              type="button"
                              className={`pill-btn${isActive(day, time) ? ' pill-btn--active' : ''}`}
                              onClick={() => toggleSlot(day, time)}
                              aria-pressed={isActive(day, time)}
                              aria-label={`${day} ${time}`}
                            >
                              {time === 'Morning' ? 'AM' : 'PM'}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Document Uploads ── */}
            <div className="form-group">
              <label>Documents</label>
              <div className="upload-grid">

                <div className="upload-field">
                  <div className="upload-field-label">Resume / Portfolio</div>
                  <div className="upload-zone" onClick={() => fileInputRef.current.click()}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="resume"
                      accept=".pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={handleFile}
                    />
                    {fileName
                      ? <div className="upload-filename">{fileName}</div>
                      : <div className="upload-hint">Click to upload</div>
                    }
                    <div className="upload-meta">PDF, DOC, DOCX · 10MB</div>
                  </div>
                </div>

                <div className="upload-field">
                  <div className="upload-field-label">Certificates / License</div>
                  <div className="upload-zone" onClick={() => certFileRef.current.click()}>
                    <input
                      ref={certFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={handleCertFile}
                    />
                    {certFile
                      ? <div className="upload-filename">{certFile}</div>
                      : <div className="upload-hint">Click to upload</div>
                    }
                    <div className="upload-meta">PDF, JPG, JPEG · 10MB</div>
                  </div>
                </div>

                <div className="upload-field">
                  <div className="upload-field-label">Current Insurance</div>
                  <div className="upload-zone" onClick={() => insuranceFileRef.current.click()}>
                    <input
                      ref={insuranceFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={handleInsuranceFile}
                    />
                    {insuranceFile
                      ? <div className="upload-filename">{insuranceFile}</div>
                      : <div className="upload-hint">Click to upload</div>
                    }
                    <div className="upload-meta">PDF, JPG, JPEG · 10MB</div>
                  </div>
                </div>

              </div>
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
