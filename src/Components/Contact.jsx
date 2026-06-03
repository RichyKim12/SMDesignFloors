import { useState, useRef, useId } from 'react';
import './Contact.css';
import { supabase } from '../lib/supabase';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeNotes,
  sanitizeFileName,
  validateFile,
  verifyFileMagic,
  checkRateLimit,
  formatRetryTime,
} from '../lib/formSecurity';

const SERVICES_NEEDED = [
  'Hardwood Flooring',
  'Tile / Stone Flooring',
  'Laminate / LVP Flooring',
  'Bathroom Remodel',
  'Kitchen Remodel',
  'Other',
];

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['Morning', 'Afternoon'];

const CONTACT_DETAILS = [
  { title: 'Phone', body: '(703) 580-1222' },
  { title: 'Service Area', body: 'Proudly Serving Northern Virginia, Maryland, and Greater Washington DC Area' },
  { title: 'Business Hours', body: <>Monday – Saturday: 10:00 AM – 6:00 PM<br />Sunday: Closed</> },
];

// ── Phone formatter (UI only — sanitizePhone runs on submit) ──
function formatPhone(val) {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function Contact() {
  const uid = useId();
  const fid = (name) => `${uid}-${name}`; // stable unique IDs for ADA

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError]     = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [loading, setLoading]         = useState(false);

  const [selectedServices, setSelectedServices] = useState([]);
  const [availability, setAvailability]         = useState([]);
  const [floorplanFile, setFloorplanFile]       = useState(null);
  const [phone, setPhone]                       = useState('');

  const floorplanRef = useRef(null);
  const errorRef     = useRef(null);

  // ── Helpers ──────────────────────────────────────────────────

  function showErr(msg) {
    setErrorMsg(msg);
    setShowError(true);
    setShowSuccess(false);
    setLoading(false);
    setTimeout(() => errorRef.current?.focus(), 50);
  }

  const toggleService = (v) => {
    if (!SERVICES_NEEDED.includes(v)) return; // whitelist guard
    setSelectedServices(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  };

  const toggleSlot = (day, time) => {
    if (!DAYS.includes(day) || !TIMES.includes(time)) return; // whitelist guard
    const slot = `${day} ${time}`;
    setAvailability(prev => prev.includes(slot) ? prev.filter(x => x !== slot) : [...prev, slot]);
  };

  const isActive = (day, time) => availability.includes(`${day} ${time}`);

  // ── File handler — MIME + magic-byte verified ─────────────────
  async function handleFileChange(file) {
    if (!file) { setFloorplanFile(null); return; }

    const mimeCheck = validateFile(file, 'floorplan');
    if (!mimeCheck.valid) {
      showErr(mimeCheck.message);
      return;
    }

    const magicOk = await verifyFileMagic(file);
    if (!magicOk) {
      showErr(
        `${file.name} does not appear to be a valid file. ` +
        `Please upload a genuine PNG, PDF, or JPG.`
      );
      return;
    }

    setFloorplanFile(file);
    setShowError(false);
  }

  // ── Upload helper ─────────────────────────────────────────────
  async function uploadFile(submissionId, file, fileType) {
    if (!file) return;
    const safeName = sanitizeFileName(file.name);
    const ext      = safeName.split('.').pop().replace(/[^a-z0-9]/gi, '').slice(0, 10);
    const path     = `contact/${submissionId}/${fileType}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('submissions-files')
      .upload(path, file);

    if (uploadError) { console.error('File upload error:', uploadError); return; }

    await supabase.from('contact_submission_files').insert([{
      submission_id: submissionId,
      file_name:     safeName,
      file_path:     path,
      file_type:     fileType,
    }]);
  }

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowError(false);
    setShowSuccess(false);

    // Rate limit
    // const rate = checkRateLimit();
    // if (!rate.allowed) {
    //   showErr(`Too many attempts. Please wait ${formatRetryTime(rate.retryAfterMs)} before trying again.`);
    //   return;
    // }

    setLoading(true);
    const form = e.target;

    // Sanitize all fields
    const name        = sanitizeText(form.name.value,         { maxLength: 80   });
    const email       = sanitizeEmail(form.email.value);
    const cleanPhone  = sanitizePhone(phone);
    const budget      = sanitizeText(form.budget.value,       { maxLength: 60   });
    const timeline    = sanitizeText(form.timeline.value,     { maxLength: 60   });
    const projectDesc = sanitizeNotes(form.project_desc.value, { maxLength: 2000 });

    // Basic required field check
    if (!name) { showErr('Please enter your name.'); return; }
    if (!email) { showErr('Please enter a valid email address.'); return; }
    if (!projectDesc) { showErr('Please describe your project.'); return; }

    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([{
        name,
        email,
        phone:        cleanPhone   || null,
        budget:       budget       || null,
        timeline:     timeline     || null,
        services:     selectedServices,  // whitelist-validated
        availability,                    // built from whitelist constants
        project_desc: projectDesc,
      }])
      .select()
      .single();

    if (error) {
      console.error(error);
      showErr('Something went wrong. Please try again or call us directly.');
      return;
    }

    await uploadFile(data.id, floorplanFile, 'floorplan');

    setLoading(false);
    setShowSuccess(true);
    setSelectedServices([]);
    setAvailability([]);
    setFloorplanFile(null);
    setPhone('');
    form.reset();
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <section id="contact">
      <div>
        <div className="form-card">
          <div className="form-title">Request a Quote</div>

          {/* Error banner */}
          {showError && (
            <div
              ref={errorRef}
              className="form-error-banner"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate aria-label="Quote request form">

            <fieldset className="form-fieldset">
              <legend className="form-legend">Your Details</legend>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={fid('name')}>
                    Your Name <span aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </label>
                  <input
                    id={fid('name')}
                    name="name"
                    type="text"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    required
                    maxLength={80}
                    aria-required="true"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={fid('email')}>
                    Email Address <span aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </label>
                  <input
                    id={fid('email')}
                    name="email"
                    type="email"
                    placeholder="jane@example.com"
                    autoComplete="email"
                    required
                    maxLength={254}
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={fid('phone')}>Phone Number</label>
                  <input
                    id={fid('phone')}
                    name="phone"
                    type="tel"
                    placeholder="(555) 000-0000"
                    autoComplete="tel"
                    inputMode="tel"
                    value={phone}
                    maxLength={14}
                    aria-describedby={fid('phone-hint')}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                  />
                  <span id={fid('phone-hint')} className="field-hint">Format: (555) 000-0000</span>
                </div>
              </div>
            </fieldset>

            <fieldset className="form-fieldset">
              <legend className="form-legend">Project Details</legend>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={fid('budget')}>Estimated Budget</label>
                  <select id={fid('budget')} name="budget">
                    <option value="">Select range...</option>
                    <option>Under $2,000</option>
                    <option>$2,000 – $5,000</option>
                    <option>$5,000 – $10,000</option>
                    <option>$10,000 – $25,000</option>
                    <option>$25,000+</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor={fid('timeline')}>Desired Timeline</label>
                  <select id={fid('timeline')} name="timeline">
                    <option value="">Select timeline...</option>
                    <option>ASAP</option>
                    <option>Within 1 month</option>
                    <option>1–3 months</option>
                    <option>3–6 months</option>
                    <option>Flexible / Planning stage</option>
                  </select>
                </div>
              </div>

              <fieldset className="form-fieldset">
                <legend className="form-legend">
                  Service Needed <span aria-hidden="true">*</span>
                  <span className="sr-only">(required, select all that apply)</span>
                  <span className="form-legend-hint"> — select all that apply</span>
                </legend>
                <div className="service-grid" role="group" aria-required="true">
                  {SERVICES_NEEDED.map(svc => (
                    <label key={svc} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(svc)}
                        onChange={() => toggleService(svc)}
                      />
                      {svc}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="form-group">
                <label htmlFor={fid('project_desc')}>
                  Project Description <span aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </label>
                <textarea
                  id={fid('project_desc')}
                  name="project_desc"
                  required
                  aria-required="true"
                  maxLength={2000}
                  placeholder="Tell us about your project – the space, square footage, materials, style, etc..."
                  aria-describedby={fid('desc-hint')}
                />
                <span id={fid('desc-hint')} className="field-hint">Max 2000 characters</span>
              </div>
            </fieldset>

            <fieldset className="form-fieldset">
              <legend className="form-legend">
                Availability to be contacted
                <span className="form-legend-hint"> — select all that apply</span>
              </legend>
              <div className="availability-table-wrapper">
                <table className="availability-table">
                  <thead>
                    <tr>
                      <th scope="col"><span className="sr-only">Time of day</span></th>
                      {DAYS.map(day => <th key={day} scope="col">{day}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {TIMES.map(time => (
                      <tr key={time}>
                        <th scope="row" className="time-label">{time}</th>
                        {DAYS.map(day => (
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
            </fieldset>

            <fieldset className="form-fieldset">
              <legend className="form-legend">
                Floor Plan <span className="form-legend-hint">(optional)</span>
              </legend>
              <div className="upload-field">
                <div
                  className="upload-zone"
                  role="button"
                  tabIndex={0}
                  aria-label="Upload floor plan"
                  aria-describedby={fid('floorplan-hint')}
                  onClick={() => floorplanRef.current.click()}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && floorplanRef.current.click()}
                >
                  <input
                    ref={floorplanRef}
                    type="file"
                    accept=".png,.pdf,.jpeg,.jpg"
                    style={{ display: 'none' }}
                    aria-hidden="true"
                    tabIndex={-1}
                    onChange={e => handleFileChange(e.target.files[0] || null)}
                  />
                  {floorplanFile
                    ? <div className="upload-filename">{floorplanFile.name}</div>
                    : <div className="upload-hint">Click or press Enter to upload</div>
                  }
                  <div id={fid('floorplan-hint')} className="upload-meta">PNG, PDF, JPEG · max 10 MB</div>
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              className="form-submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Sending...' : 'Send My Request'}
            </button>
          </form>

          {/* Success banner */}
          <div
            className={`success-banner ${showSuccess ? 'show' : ''}`}
            role="status"
            aria-live="polite"
          >
            ✓ Request received! We'll reach out within 24 hours.
          </div>
        </div>
      </div>

      <div className="sticky-info">
        <div className="section-label">Reach Us</div>
        <h2 className="section-title">Let's Start Your <em>Project</em></h2>
        <p className="section-desc">
          Free estimates and consultations for all residential and commercial
          projects. We provide quotes within 24 hours.
        </p>
        <div className="contact-detail">
          {CONTACT_DETAILS.map(c => (
            <div key={c.title} className="contact-item">
              <h4>{c.title}</h4>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}