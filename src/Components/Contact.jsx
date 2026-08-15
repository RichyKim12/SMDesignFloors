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

const MAX_FILES = 5;
const SERVICES_NEEDED = [
  'Hardwood Flooring',
  'Tile / Stone Flooring',
  'Laminate / LVP Flooring',
  'Bathroom Remodel',
  'Kitchen Remodel',
  'Other',
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['Morning', 'Afternoon'];
const CONTACT_DETAILS = [
  { title: 'Phone', body: '(703) 580-1222' },
  { title: 'Service Area', body: 'Proudly Serving Northern Virginia, Maryland, and Greater Washington DC Area' },
  { title: 'Business Hours', body: <>Monday – Saturday: 10:00 AM – 6:00 PM<br />Sunday: Closed</> },
];

function formatPhone(val) {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function Contact() {
  const uid = useId();
  const fid = (name) => `${uid}-${name}`;
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [phone, setPhone] = useState('');
  const fileInputRef = useRef(null);
  const errorRef = useRef(null);

  function showErr(msg) {
    setErrorMsg(msg);
    setShowError(true);
    setShowSuccess(false);
    setLoading(false);
    setTimeout(() => errorRef.current?.focus(), 50);
  }

  const toggleService = (v) => {
    if (!SERVICES_NEEDED.includes(v)) return;
    setSelectedServices(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  };

  const toggleSlot = (day, time) => {
    if (!DAYS.includes(day) || !TIMES.includes(time)) return;
    const slot = `${day} ${time}`;
    setAvailability(prev => prev.includes(slot) ? prev.filter(x => x !== slot) : [...prev, slot]);
  };

  const isActive = (day, time) => availability.includes(`${day} ${time}`);

  // ── Multi-file validation handler ──────────────────────────────
  async function handleFilesAdded(fileList) {
    if (!fileList || fileList.length === 0) return;

    const incoming = Array.from(fileList);
    if (uploadedFiles.length + incoming.length > MAX_FILES) {
      showErr(`You can upload a maximum of ${MAX_FILES} files.`);
      return;
    }

    const validFiles = [];
    for (const file of incoming) {
      const mimeCheck = validateFile(file, 'floorplan');
      if (!mimeCheck.valid) {
        showErr(mimeCheck.message);
        return;
      }
      const magicOk = await verifyFileMagic(file);
      if (!magicOk) {
        showErr(`${file.name} does not appear to be a valid file. Please upload genuine documents or images.`);
        return;
      }
      validFiles.push(file);
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    setShowError(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeFile(indexToRemove) {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  }

  // ── Concurrent upload helper ──────────────────────────────────
  async function uploadFiles(submissionId, files) {
    if (!files || files.length === 0) return;

    const uploadPromises = files.map(async (file) => {
      const safeName = sanitizeFileName(file.name);
      const ext = safeName.split('.').pop().replace(/[^a-z0-9]/gi, '').slice(0, 10);
      const path = `contact/${submissionId}/attachment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('submissions-files')
        .upload(path, file);

      if (uploadError) {
        console.error(`Upload error for ${safeName}:`, uploadError);
        return;
      }

      await supabase.from('contact_submission_files').insert([{
        submission_id: submissionId,
        file_name: safeName,
        file_path: path,
        file_type: 'attachment',
      }]);
    });

    await Promise.all(uploadPromises);
  }

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowError(false);
    setShowSuccess(false);

    const rate = checkRateLimit();
    if (!rate.allowed) {
      showErr(`Too many attempts. Please wait ${formatRetryTime(rate.retryAfterMs)} before trying again.`);
      return;
    }

    setLoading(true);
    const form = e.target;

    const name = sanitizeText(form.name.value, { maxLength: 80 });
    const email = sanitizeEmail(form.email.value);
    const cleanPhone = sanitizePhone(phone);
    const budget = sanitizeText(form.budget.value, { maxLength: 60 });
    const timeline = sanitizeText(form.timeline.value, { maxLength: 60 });
    const projectDesc = sanitizeNotes(form.project_desc.value, { maxLength: 2000 });

    if (!name) { showErr('Please enter your name.'); return; }
    if (!email) { showErr('Please enter a valid email address.'); return; }
    if (!projectDesc) { showErr('Please describe your project.'); return; }

    const submissionId = crypto.randomUUID();
    const { error } = await supabase
      .from('contact_submissions')
      .insert([{
        id: submissionId,
        name,
        email,
        phone: cleanPhone || null,
        budget: budget || null,
        timeline: timeline || null,
        services: selectedServices,
        availability,
        project_desc: projectDesc,
      }]);

    if (error) {
      console.error(error);
      showErr('Something went wrong. Please try again or call us directly.');
      return;
    }

    await uploadFiles(submissionId, uploadedFiles);

    setLoading(false);
    setShowSuccess(true);
    setSelectedServices([]);
    setAvailability([]);
    setUploadedFiles([]);
    setPhone('');
    form.reset();
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <section id="contact">
      <div>
        <div className="form-card">
          <div className="form-title">Request a Quote</div>

          {showError && (
            <div
              ref={errorRef}
              className="form-error-banner"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
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
                Project Files & Floor Plans <span className="form-legend-hint">(optional, up to 5)</span>
              </legend>
              <div className="upload-field">
                <div
                  className="upload-zone"
                  role="button"
                  tabIndex={0}
                  aria-label="Upload files"
                  aria-describedby={fid('file-hint')}
                  onClick={() => fileInputRef.current.click()}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".png,.pdf,.jpeg,.jpg,.doc,.docx"
                    style={{ display: 'none' }}
                    aria-hidden="true"
                    tabIndex={-1}
                    onChange={e => handleFilesAdded(e.target.files)}
                  />
                  <div className="upload-hint">Click or press Enter to add files ({uploadedFiles.length}/{MAX_FILES})</div>
                  <div id={fid('file-hint')} className="upload-meta">PNG, PDF, JPEG, DOCX · Max 10 MB per file</div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="uploaded-file-list" style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {uploadedFiles.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="file-pill">
                        <span className="file-pill-name">{file.name}</span>
                        <button
                          type="button"
                          className="file-remove-btn"
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          aria-label={`Remove ${file.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}