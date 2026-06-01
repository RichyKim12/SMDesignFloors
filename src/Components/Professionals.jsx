import { useState, useRef, useId } from 'react';
import './Professionals.css';
import { supabase } from '../lib/supabase';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeNotes,
  sanitizeFileName,
  validateForm,
  validateFile,
  verifyFileMagic,
  checkRateLimit,
  formatRetryTime,
  normalizeAuthError,
} from '../lib/formSecurity';

// ─── Whitelisted static data ───────────────────────────────────
// Defined here (not fetched) so the profession list cannot be
// tampered with via a network response.

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

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['Morning', 'Afternoon'];

// ─── Phone formatter (UI only — sanitizePhone runs on submit) ──
function formatPhone(val) {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// ─── Password strength (local — never sent anywhere) ───────────
function calcStrength(pw) {
  let score = 0;
  if (pw.length >= 8)          score++;
  if (pw.length >= 12)         score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#c84a4a', '#c8953a', '#c8b43a', '#3a9c6b'];

// ─── Component ────────────────────────────────────────────────
export default function Professionals() {
  const uid = useId();
  const fid = (name) => `${uid}-${name}`; // stable, unique field IDs for ADA

  const [showVerification, setShowVerification] = useState(false);
  const [showError, setShowError]               = useState(false);
  const [errorMsg, setErrorMsg]                 = useState('');
  const [fieldError, setFieldError]             = useState('');
  const [loading, setLoading]                   = useState(false);

  const [selectedProfs, setSelectedProfs]       = useState([]);
  const [availability, setAvailability]         = useState([]);
  const [resumeFile, setResumeFile]             = useState(null);
  const [certFile, setCertFile]                 = useState(null);
  const [insuranceFile, setInsuranceFile]       = useState(null);
  const [password, setPassword]                 = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [phone, setPhone]                       = useState('');
  const [pwStrength, setPwStrength]             = useState(0);

  const fileInputRef     = useRef(null);
  const certFileRef      = useRef(null);
  const insuranceFileRef = useRef(null);
  const errorRef         = useRef(null);

  // ── Helpers ─────────────────────────────────────────────────

  function showErr(msg, field = '') {
    setErrorMsg(msg);
    setFieldError(field);
    setShowError(true);
    setLoading(false);
    // Move focus to error banner so screen readers announce it immediately
    setTimeout(() => errorRef.current?.focus(), 50);
  }

  const toggleProf = (v) => {
    // Only allow values from the known whitelist — ignores anything else
    if (!PROFESSIONS.includes(v)) return;
    setSelectedProfs(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  };

  const toggleSlot = (day, time) => {
    if (!DAYS.includes(day) || !TIMES.includes(time)) return; // whitelist guard
    const slot = `${day} ${time}`;
    setAvailability(prev => prev.includes(slot) ? prev.filter(x => x !== slot) : [...prev, slot]);
  };

  const isActive = (day, time) => availability.includes(`${day} ${time}`);

  // ── File handler ─────────────────────────────────────────────
  // Two-stage: MIME type check first, then magic-byte verification.
  // Both must pass before we accept the file.

  async function handleFileChange(setter, file, fileType) {
    if (!file) { setter(null); return; }

    // Stage 1: MIME type + size
    const mimeCheck = validateFile(file, fileType);
    if (!mimeCheck.valid) {
      showErr(mimeCheck.message);
      return;
    }

    // Stage 2: magic bytes — catches renamed executables / polyglots
    const magicOk = await verifyFileMagic(file);
    if (!magicOk) {
      showErr(
        `${file.name} does not appear to be a valid document. ` +
        `Please upload a genuine PDF, JPG, DOC, or DOCX file.`
      );
      return;
    }

    setter(file);
    setShowError(false);
  }

  // ── Upload helper ─────────────────────────────────────────────
  // sanitizeFileName prevents path traversal before building the
  // storage path. The file is stored under a UUID-based prefix so
  // even a crafted name can never escape the bucket folder.

  async function uploadFile(submissionId, file, fileType) {
    if (!file) return;
    const safeName = sanitizeFileName(file.name);
    const ext      = safeName.split('.').pop().replace(/[^a-z0-9]/gi, '').slice(0, 10);
    const path     = `professional/${submissionId}/${fileType}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('submissions-files')
      .upload(path, file);

    if (uploadError) { console.error(`Upload error (${fileType}):`, uploadError); return; }

    await supabase
      .from('professional_submission_files')
      .insert([{
        submission_id: submissionId,
        file_name:     safeName,          // sanitized before DB insert
        file_path:     path,
        file_type:     fileType,
      }]);
  }

  // ── Submit ───────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault();
    setShowError(false);
    setFieldError('');

    // ── GATE 1: client-side rate limit ────────────────────────
    // Blocks flooding before any network call is made.
    const rate = checkRateLimit();
    if (!rate.allowed) {
      showErr(`Too many attempts. Please wait ${formatRetryTime(rate.retryAfterMs)} before trying again.`);
      return;
    }

    setLoading(true);
    const form = e.target;

    // ── GATE 2: sanitize every field ─────────────────────────
    // Strip XSS payloads, SQL injection chars, null bytes, and
    // oversized content before any validation or network call.
    const name        = sanitizeText(form.name.value,         { maxLength: 80   });
    const email       = sanitizeEmail(form.email.value);
    const business    = sanitizeText(form.business.value,     { maxLength: 120  });
    const yearsExp    = sanitizeText(form.years_exp.value,    { maxLength: 120  });
    const serviceArea = sanitizeText(form.service_area.value, { maxLength: 120  });
    const website     = sanitizeUrl(form.website?.value  || '');
    const notes       = sanitizeNotes(form.notes?.value  || '', { maxLength: 1000 });
    const cleanPhone  = sanitizePhone(phone);

    // ── GATE 3: whitelist-based validation ────────────────────
    // Validates sanitized values. Also whitelist-checks profession
    // values so tampered checkbox values from DevTools are rejected.
    const validation = validateForm({
      name, email,
      phone:           cleanPhone,
      password,
      confirmPassword,
      selectedProfs,
      website,
    });

    if (!validation.valid) {
      showErr(validation.message, validation.field);
      return;
    }

    // ── GATE 4: create auth account ───────────────────────────
    // normalizeAuthError prevents email enumeration — the same
    // generic message is shown whether the email is taken or the
    // request fails for any other reason.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (authError) {
      showErr(normalizeAuthError(authError), 'email');
      return;
    }

    const userId = authData?.user?.id;
    if (!userId) {
      // Same generic message — don't reveal why userId is missing
      showErr('Unable to create account. Please check your details and try again.', 'email');
      return;
    }

    // ── GATE 5: insert sanitized data only ────────────────────
    // Every value going into Supabase has been sanitized above.
    // The profession array only contains whitelisted strings.
    // The availability array only contains "Day Time" strings
    // built from whitelisted DAYS and TIMES constants.
    const { data, error } = await supabase
      .from('professional_submissions')
      .insert([{
        user_id:      userId,
        name,
        business:     business     || null,
        email,
        phone:        cleanPhone   || null,
        professions:  selectedProfs,   // whitelist-validated
        availability,                  // built from whitelist constants
        years_exp:    yearsExp     || null,
        service_area: serviceArea  || null,
        website:      website      || null,
        notes:        notes        || null,
      }])
      .select()
      .single();

    if (error) {
      // Don't expose raw DB error messages to the UI
      console.error('Submission error:', error.message);
      showErr('Something went wrong saving your application. Please try again.');
      return;
    }

    // ── File uploads (sanitized paths, magic-verified content) ─
    await Promise.all([
      uploadFile(data.id, resumeFile,    'resume'),
      uploadFile(data.id, certFile,      'certificate'),
      uploadFile(data.id, insuranceFile, 'insurance'),
    ]);

    // ── Profile upsert ────────────────────────────────────────
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, role: 'contractor', full_name: name, email });

    if (profileError) console.error('Profile upsert error:', profileError);

    // ── Reset ─────────────────────────────────────────────────
    setLoading(false);
    setShowVerification(true);
    setSelectedProfs([]);
    setAvailability([]);
    setResumeFile(null);
    setCertFile(null);
    setInsuranceFile(null);
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setPwStrength(0);
    form.reset();
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <section id="professionals" aria-label="Contractor registration">

      {/* Success modal */}
      {showVerification && (
        <div
          className="modal-overlay visible"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setShowVerification(false)}
        >
          <div className="verification-modal" onClick={e => e.stopPropagation()}>
            <div className="verification-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 id="modal-title" className="verification-title">Application Submitted</h3>
            <p className="verification-body">
              Your contractor account has been created and your application submitted.
              Our team will review your profile and be in touch soon.
            </p>
            <p className="verification-sub">
              You can sign in using the button at the top of the page.
            </p>
            <button className="verification-btn" onClick={() => setShowVerification(false)} autoFocus>
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Left: info panel */}
      <div className="sticky-info" aria-label="About ProServices">
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
          Whether you specialise in flooring, plumbing, electrical work, remodeling, or other trade
          services, ProServices makes it easy to get registered and stay connected. Once enrolled,
          our team can quickly reach out when projects matching your skills become available.
        </p>
        <div className="feature-list">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-item">
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div>
        <div className="form-card">
          <div className="form-title">Join Our Network</div>

          <div className="account-notice" role="note">
            <p>
              Completing this form creates an <strong>SM Design Floors contractor account</strong> linked
              to your email. Your information is stored securely and used only to match you with
              relevant projects. You may request deletion at any time.{' '}
              <a href="/privacy" className="form-legal-link">Privacy Policy</a>.
            </p>
          </div>

          {/* Error banner — role=alert makes screen readers announce it immediately */}
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

          <form onSubmit={handleSubmit} noValidate aria-label="Contractor registration form">

            {/* Personal info */}
            <fieldset className="form-fieldset">
              <legend className="form-legend">Personal Information</legend>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={fid('name')}>
                    Full Name <span aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </label>
                  <input
                    id={fid('name')}
                    name="name"
                    type="text"
                    placeholder="John Smith"
                    autoComplete="name"
                    required
                    maxLength={80}
                    aria-required="true"
                    aria-invalid={fieldError === 'name' ? 'true' : undefined}
                    aria-describedby={fieldError === 'name' ? fid('name-err') : undefined}
                  />
                  {fieldError === 'name' && (
                    <span id={fid('name-err')} className="field-error" role="alert">{errorMsg}</span>
                  )}
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
                    placeholder="john@company.com"
                    autoComplete="email"
                    required
                    maxLength={254}
                    aria-required="true"
                    aria-invalid={fieldError === 'email' ? 'true' : undefined}
                    aria-describedby={fieldError === 'email' ? fid('email-err') : undefined}
                  />
                  {fieldError === 'email' && (
                    <span id={fid('email-err')} className="field-error" role="alert">{errorMsg}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={fid('business')}>Company / Business</label>
                  <input
                    id={fid('business')}
                    name="business"
                    type="text"
                    placeholder="Smith Contracting LLC"
                    autoComplete="organization"
                    maxLength={120}
                  />
                </div>

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
                    aria-invalid={fieldError === 'phone' ? 'true' : undefined}
                    aria-describedby={`${fid('phone-hint')}${fieldError === 'phone' ? ` ${fid('phone-err')}` : ''}`}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                  />
                  <span id={fid('phone-hint')} className="field-hint">Format: (555) 000-0000</span>
                  {fieldError === 'phone' && (
                    <span id={fid('phone-err')} className="field-error" role="alert">{errorMsg}</span>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Profession — whitelist-validated on submit */}
            <fieldset className="form-fieldset">
              <legend className="form-legend">
                Profession <span aria-hidden="true">*</span>
                <span className="sr-only">(required, select all that apply)</span>
                <span className="form-legend-hint"> — select all that apply</span>
              </legend>
              <div
                className="profession-grid"
                role="group"
                aria-required="true"
                aria-invalid={fieldError === 'profession' ? 'true' : undefined}
              >
                {PROFESSIONS.map(prof => (
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
              {fieldError === 'profession' && (
                <span className="field-error" role="alert">{errorMsg}</span>
              )}
            </fieldset>

            {/* Experience & location */}
            <fieldset className="form-fieldset">
              <legend className="form-legend">Experience &amp; Location</legend>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={fid('years_exp')}>Specialty / Focus Area</label>
                  <input
                    id={fid('years_exp')}
                    name="years_exp"
                    type="text"
                    placeholder="e.g. Residential Renovation"
                    maxLength={120}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={fid('service_area')}>City &amp; State</label>
                  <input
                    id={fid('service_area')}
                    name="service_area"
                    type="text"
                    placeholder="e.g. Woodbridge, VA"
                    autoComplete="address-level2"
                    maxLength={120}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor={fid('website')}>Website</label>
                <input
                  id={fid('website')}
                  name="website"
                  type="url"
                  placeholder="https://yourcompany.com"
                  autoComplete="url"
                  maxLength={2048}
                  aria-invalid={fieldError === 'website' ? 'true' : undefined}
                  aria-describedby={fid('website-hint')}
                />
                <span id={fid('website-hint')} className="field-hint">Must start with https://</span>
              </div>
            </fieldset>

            {/* Availability — built from whitelisted constants, never from user input */}
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

            {/* Documents — magic-byte verified before state is set */}
            <fieldset className="form-fieldset">
              <legend className="form-legend">Documents <span className="form-legend-hint">(optional)</span></legend>
              <div className="upload-grid">
                {[
                  { label: 'Resume / Portfolio',     ref: fileInputRef,     state: resumeFile,    setter: setResumeFile,    type: 'resume',      accept: '.pdf,.doc,.docx', hint: 'PDF, DOC, DOCX — max 10 MB' },
                  { label: 'Certificates / License', ref: certFileRef,      state: certFile,      setter: setCertFile,      type: 'certificate', accept: '.pdf,.jpg,.jpeg', hint: 'PDF, JPG — max 10 MB' },
                  { label: 'Current Insurance',      ref: insuranceFileRef, state: insuranceFile, setter: setInsuranceFile, type: 'insurance',   accept: '.pdf,.jpg,.jpeg', hint: 'PDF, JPG — max 10 MB' },
                ].map(({ label, ref, state, setter, type, accept, hint }) => {
                  const btnId = fid(`upload-${type}`);
                  return (
                    <div key={type} className="upload-field">
                      <div className="upload-field-label" id={btnId}>{label}</div>
                      <div
                        className="upload-zone"
                        role="button"
                        tabIndex={0}
                        aria-labelledby={btnId}
                        aria-describedby={`${btnId}-hint`}
                        onClick={() => ref.current.click()}
                        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && ref.current.click()}
                      >
                        <input
                          ref={ref}
                          type="file"
                          accept={accept}
                          style={{ display: 'none' }}
                          aria-hidden="true"
                          tabIndex={-1}
                          onChange={e => handleFileChange(setter, e.target.files[0] || null, type)}
                        />
                        {state
                          ? <div className="upload-filename">{state.name}</div>
                          : <div className="upload-hint">Click or press Enter to upload</div>
                        }
                        <div id={`${btnId}-hint`} className="upload-meta">{hint}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            {/* Password */}
            <fieldset className="form-fieldset password-section">
              <legend className="form-legend password-section-label">Create Your Account Password</legend>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={fid('password')}>
                    Password <span aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </label>
                  <input
                    id={fid('password')}
                    type="password"
                    placeholder="Min 8 characters"
                    value={password}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    aria-required="true"
                    aria-invalid={fieldError === 'password' ? 'true' : undefined}
                    aria-describedby={`${fid('pw-hint')}${fieldError === 'password' ? ` ${fid('pw-err')}` : ''}`}
                    onChange={e => {
                      setPassword(e.target.value);
                      setPwStrength(calcStrength(e.target.value));
                    }}
                  />
                  <span id={fid('pw-hint')} className="field-hint">
                    Min 8 characters, 1 uppercase, 1 number
                  </span>

                  {password.length > 0 && (
                    <div className="pw-strength" aria-live="polite" aria-atomic="true">
                      <div className="pw-strength-bar">
                        {[1, 2, 3, 4].map(n => (
                          <div
                            key={n}
                            className="pw-strength-segment"
                            style={{ background: n <= pwStrength ? STRENGTH_COLORS[pwStrength] : '#e8e0d4' }}
                          />
                        ))}
                      </div>
                      <span className="pw-strength-label" style={{ color: STRENGTH_COLORS[pwStrength] }}>
                        {STRENGTH_LABELS[pwStrength]}
                      </span>
                    </div>
                  )}

                  {fieldError === 'password' && (
                    <span id={fid('pw-err')} className="field-error" role="alert">{errorMsg}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor={fid('confirm-password')}>
                    Confirm Password <span aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </label>
                  <input
                    id={fid('confirm-password')}
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    autoComplete="new-password"
                    required
                    aria-required="true"
                    aria-invalid={fieldError === 'confirmPassword' ? 'true' : undefined}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                  {fieldError === 'confirmPassword' && (
                    <span className="field-error" role="alert">{errorMsg}</span>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor={fid('notes')}>Additional Notes</label>
              <textarea
                id={fid('notes')}
                name="notes"
                placeholder="Anything else you would like us to know..."
                rows={4}
                maxLength={1000}
                aria-describedby={fid('notes-hint')}
              />
              <span id={fid('notes-hint')} className="field-hint">Max 1000 characters</span>
            </div>

            <button
              type="submit"
              className="form-submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Submitting...' : 'Create Account & Submit'}
            </button>

            <p className="form-legal">
              By submitting you agree to create an SM Design Floors contractor account and consent
              to us storing your information solely for the purpose of matching you with relevant
              projects. We will never sell your data.{' '}
              <a href="/privacy" className="form-legal-link">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}