import { useState, useRef, useId } from 'react';
import './Professionals.css';
import { supabase } from '../lib/supabase';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeNotes,
  validateForm,
  validateFile,
  verifyFileMagic,
  checkRateLimit,
  formatRetryTime,
  normalizeAuthError,
} from '../lib/formSecurity';

// ─── Whitelisted static data ───────────────────────────────────
const FEATURES = [
  { title: 'Referral Partnerships', desc: 'Earn referral fees when your clients choose our services.' },
  { title: 'Trade Pricing', desc: 'Access wholesale material pricing for your projects.' },
  { title: 'Priority Scheduling', desc: 'Your clients get priority booking and faster turnaround.' },
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

// ─── Phone formatter (UI only) ─────────────────────────────────
function formatPhone(val) {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// ─── Password strength (local) ─────────────────────────────────
function calcStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#c84a4a', '#c8953a', '#c8b43a', '#3a9c6b'];

// ─── Component ────────────────────────────────────────────────
export default function Professionals() {
  const uid = useId();
  const fid = (name) => `${uid}-${name}`;

  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);

  // Separate Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [selectedProfs, setSelectedProfs] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [certFile, setCertFile] = useState(null);
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [pwStrength, setPwStrength] = useState(0);

  const fileInputRef = useRef(null);
  const certFileRef = useRef(null);
  const insuranceFileRef = useRef(null);
  const errorRef = useRef(null);

  // ── Helpers ─────────────────────────────────────────────────
  function showErr(msg, field = '') {
    setErrorMsg(msg);
    setFieldError(field);
    setShowError(true);
    setLoading(false);
    setTimeout(() => errorRef.current?.focus(), 50);
  }

  const toggleProf = (v) => {
    if (!PROFESSIONS.includes(v)) return;
    setSelectedProfs(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  };

  const toggleSlot = (day, time) => {
    if (!DAYS.includes(day) || !TIMES.includes(time)) return;
    const slot = `${day} ${time}`;
    setAvailability(prev => prev.includes(slot) ? prev.filter(x => x !== slot) : [...prev, slot]);
  };

  const isActive = (day, time) => availability.includes(`${day} ${time}`);

  const handleOpenPrivacy = (e) => {
    e.preventDefault();
    setShowPrivacyModal(true);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    window.location.href = '/dashboard';
  };

  // ── File handler ─────────────────────────────────────────────
  async function handleFileChange(setter, file, fileType) {
    if (!file) { setter(null); return; }

    const mimeCheck = validateFile(file, fileType);
    if (!mimeCheck.valid) {
      showErr(mimeCheck.message);
      return;
    }

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

  // ── Submit Handler ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowError(false);
    setFieldError('');

    const rateCheck = checkRateLimit('professional-registration');
    if (!rateCheck.allowed) {
      showErr(`Too many attempts. Please try again in ${formatRetryTime(rateCheck.retryAfterMs)}.`);
      return;
    }

    const formEl = e.currentTarget;
    const rawData = new FormData(formEl);

    const rawEmail = sanitizeEmail(rawData.get('email') || '');
    const rawName = sanitizeText(rawData.get('name') || '');
    const rawBusiness = sanitizeText(rawData.get('business') || '');
    const rawYearsExp = sanitizeText(rawData.get('years_exp') || '');
    const rawServiceArea = sanitizeText(rawData.get('service_area') || '');
    const rawWebsite = sanitizeUrl(rawData.get('website') || '');
    const rawNotes = sanitizeNotes(rawData.get('notes') || '');
    const cleanPhoneVal = sanitizePhone(phone);

    const formDataPayload = {
      name: rawName,
      email: rawEmail,
      phone: cleanPhoneVal,
      business: rawBusiness,
      selectedProfs,
      availability,
      yearsExp: rawYearsExp,
      serviceArea: rawServiceArea,
      website: rawWebsite,
      notes: rawNotes,
      password,
      confirmPassword,
    };

    const validation = validateForm(formDataPayload);
    if (!validation.valid) {
      showErr(validation.message, validation.field);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: rawEmail,
        password: password,
        options: {
          data: {
            full_name: rawName,
            business: rawBusiness,
            phone: cleanPhoneVal,
            professions: selectedProfs,
            availability: availability,
            years_exp: rawYearsExp,
            service_area: rawServiceArea,
            website: rawWebsite,
            notes: rawNotes,
          },
        },
      });

      if (error) throw error;

      if (!data.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: rawEmail,
          password: password,
        });
        if (signInErr) throw signInErr;
      }

      setLoading(false);
      // Trigger submission confirmation modal
      setShowSuccessModal(true);

    } catch (err) {
      console.error('Submission error:', err);
      showErr(normalizeAuthError(err) || 'An error occurred during registration. Please try again.');
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <section id="professionals" aria-label="Contractor registration">

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
              <button 
                type="button" 
                onClick={handleOpenPrivacy} 
                className="form-legal-link"
                style={{ background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}
              >
                Privacy Policy
              </button>.
            </p>
          </div>

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
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
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

            {/* Profession */}
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

            {/* Availability */}
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

            {/* Documents */}
            <fieldset className="form-fieldset">
              <legend className="form-legend">Documents <span className="form-legend-hint">(optional)</span></legend>
              <div className="upload-grid">
                {[
                  { label: 'Resume / Portfolio', ref: fileInputRef, state: resumeFile, setter: setResumeFile, type: 'resume', accept: '.pdf,.doc,.docx', hint: 'PDF, DOC, DOCX — max 10 MB' },
                  { label: 'Certificates / License', ref: certFileRef, state: certFile, setter: setCertFile, type: 'certificate', accept: '.pdf,.jpg,.jpeg', hint: 'PDF, JPG — max 10 MB' },
                  { label: 'Current Insurance', ref: insuranceFileRef, state: insuranceFile, setter: setInsuranceFile, type: 'insurance', accept: '.pdf,.jpg,.jpeg', hint: 'PDF, JPG — max 10 MB' },
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
                    name="password"
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
                    name="confirmPassword"
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
              <button 
                type="button" 
                onClick={handleOpenPrivacy} 
                className="form-legal-link"
                style={{ background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}
              >
                Privacy Policy
              </button>.
            </p>
          </form>
        </div>
      </div>

      {/* ─── 1. Submission Success Modal ────────────────────────────── */}
      {showSuccessModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-modal-title"
        >
          <div 
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '32px 28px',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#e6f4ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h3 id="success-modal-title" style={{ fontSize: '1.5rem', color: '#1a1a1a', marginBottom: '12px', fontWeight: 600 }}>
              Welcome to the Network!
            </h3>
            
            <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Your contractor account has been successfully created and your application details have been submitted. You are now logged in.
            </p>

            <button
              onClick={handleSuccessModalClose}
              style={{
                width: '100%',
                padding: '12px 20px',
                backgroundColor: 'var(--tan-dark, #2a2a2a)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ─── 2. Privacy Policy Modal ────────────────────────────── */}
      {showPrivacyModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          onClick={() => setShowPrivacyModal(false)}
        >
          <div 
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 id="privacy-modal-title" style={{ fontSize: '1.25rem', color: '#1a1a1a', margin: 0, fontWeight: 600 }}>
                Privacy Policy
              </h3>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                aria-label="Close privacy policy"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  lineHeight: 1,
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                &times;
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              color: '#4a4a4a',
              fontSize: '0.9rem',
              lineHeight: 1.6
            }}>
              <h4 style={{ color: '#1a1a1a', marginTop: 0 }}>Information We Collect</h4>
              <p>
                When you register for our contractor network, we collect personal and business information such as your name, email address, phone number, company details, trade specialties, service areas, and optional uploaded documents (resumes, certifications, and insurance records).
              </p>

              <h4 style={{ color: '#1a1a1a' }}>How We Use Your Data</h4>
              <p>
                Your information is stored securely and used solely to verify your qualifications, contact you regarding potential project opportunities, and manage your contractor account. We do not sell, rent, or lease your personal information to third parties.
              </p>

              <h4 style={{ color: '#1a1a1a' }}>Data Retention &amp; Your Rights</h4>
              <p>
                Your profile remains active while you are part of our trade network. You reserve the right to review, update, or request complete deletion of your account and associated documents at any time by contacting our support team.
              </p>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: '#fafafa'
            }}>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--tan-dark, #2a2a2a)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}