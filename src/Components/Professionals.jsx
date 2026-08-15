import { useState, useRef, useId, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import './Professionals.css';
import PrivacyModal from './PrivacyModal';
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

// ─── Storage Upload Helper ────────────────────────────────────
async function uploadDocument(file, type, userEmail) {
  if (!file) return null;

  const cleanEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const fileExt = file.name.split('.').pop();
  const filePath = `${cleanEmail}/${type}_${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('contractor-documents')
    .upload(filePath, file);

  if (error) {
    console.error(`Error uploading ${type}:`, error);
    throw new Error(`Failed to upload ${type} document.`);
  }

  return data.path;
}

// ─── Component ────────────────────────────────────────────────
export default function Professionals({ onOpenPrivacy }) {
  const uid = useId();
  const fid = (name) => `${uid}-${name}`;

  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLocalPrivacyModal, setShowLocalPrivacyModal] = useState(false);

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
  const submitButtonRef = useRef(null);

  // Handle Privacy Modal Triggering
  const handleOpenPrivacy = (e) => {
    e.preventDefault();

    if (onOpenPrivacy) {
      onOpenPrivacy();
    } else {
      setShowLocalPrivacyModal(true);
    }
  };

  // Close Success Modal & restore focus
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setTimeout(() => submitButtonRef.current?.focus(), 50);
  };

  const handleNavigateDashboard = () => {
    setShowSuccessModal(false);
    window.location.href = '/contractor';
  };

  // Escape Key Handler for Success Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showSuccessModal) {
        handleSuccessModalClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuccessModal]);

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

    setSelectedProfs((p) =>
      p.includes(v)
        ? p.filter((x) => x !== v)
        : [...p, v]
    );
  };

  const toggleSlot = (day, time) => {
    if (!DAYS.includes(day) || !TIMES.includes(time)) return;

    const slot = `${day} ${time}`;

    setAvailability((prev) =>
      prev.includes(slot)
        ? prev.filter((x) => x !== slot)
        : [...prev, slot]
    );
  };

  const isActive = (day, time) =>
    availability.includes(`${day} ${time}`);

  // ── File handler ─────────────────────────────────────────────
  async function handleFileChange(setter, file, fileType) {
    if (!file) {
      setter(null);
      return;
    }

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

  // ── File removal handler ─────────────────────────────────────
  const removeFile = (setter, inputRef) => {
    setter(null);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // ── Submit Handler ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowError(false);
    setFieldError('');

    const rateCheck = checkRateLimit('professional-registration');

    if (!rateCheck.allowed) {
      showErr(
        `Too many attempts. Please try again in ${formatRetryTime(rateCheck.retryAfterMs)}.`
      );
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
      const [resumePath, certPath, insurancePath] = await Promise.all([
        resumeFile
          ? uploadDocument(resumeFile, 'resume', rawEmail)
          : Promise.resolve(null),

        certFile
          ? uploadDocument(certFile, 'certificate', rawEmail)
          : Promise.resolve(null),

        insuranceFile
          ? uploadDocument(insuranceFile, 'insurance', rawEmail)
          : Promise.resolve(null),
      ]);

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
            resume_path: resumePath,
            cert_path: certPath,
            insurance_path: insurancePath,
          },
        },
      });

      if (error) throw error;

      if (!data.session) {
        const { error: signInErr } =
          await supabase.auth.signInWithPassword({
            email: rawEmail,
            password: password,
          });

        if (signInErr) throw signInErr;
      }

      setLoading(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Submission error:', err);

      showErr(
        normalizeAuthError(err) ||
        'An error occurred during registration. Please try again.'
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <section id="professionals" aria-label="Contractor registration">

      {/* Left: info panel */}
      <div className="sticky-info" aria-label="About ProServices">

        <div
          className="section-label"
          style={{
            color: '#785334',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Trade Network
        </div>

        <h2
          className="section-title"
          style={{
            fontSize: '2.4rem',
            marginBottom: 16,
            color: '#1a1a1a',
          }}
        >
          Connect With Our <em>Network Today</em>
        </h2>

        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.3rem',
            fontWeight: 600,
            color: '#785334',
            marginBottom: 16,
            letterSpacing: '0.04em',
          }}
        >
          Join ProServices
        </p>

        <p
          style={{
            color: '#2c251e',
            fontSize: '0.92rem',
            lineHeight: 1.75,
            fontWeight: 450,
            maxWidth: 380,
          }}
        >
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
          {FEATURES.map((f) => (
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

          <div className="form-title">
            Join Our Network
          </div>

          <div className="account-notice" role="note">
            <p>
              Completing this form creates an <strong>SM Design Floors contractor account</strong> linked
              to your email. Your information is stored securely and used only to match you with
              relevant projects. You may request deletion at any time.{' '}

              <button
                type="button"
                onClick={handleOpenPrivacy}
                className="form-legal-link"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  font: 'inherit',
                }}
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
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>

              {errorMsg}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            aria-label="Contractor registration form"
          >

            {/* Personal info */}
            <fieldset className="form-fieldset">
              <legend className="form-legend">
                Personal Information
              </legend>

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
                    aria-invalid={
                      fieldError === 'name'
                        ? 'true'
                        : undefined
                    }
                    aria-describedby={
                      fieldError === 'name'
                        ? fid('name-err')
                        : undefined
                    }
                  />

                  {fieldError === 'name' && (
                    <span
                      id={fid('name-err')}
                      className="field-error"
                      role="alert"
                    >
                      {errorMsg}
                    </span>
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
                    aria-invalid={
                      fieldError === 'email'
                        ? 'true'
                        : undefined
                    }
                    aria-describedby={
                      fieldError === 'email'
                        ? fid('email-err')
                        : undefined
                    }
                  />

                  {fieldError === 'email' && (
                    <span
                      id={fid('email-err')}
                      className="field-error"
                      role="alert"
                    >
                      {errorMsg}
                    </span>
                  )}
                </div>

              </div>

              <div className="form-row">

                <div className="form-group">
                  <label htmlFor={fid('business')}>
                    Company / Business
                  </label>

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
                  <label htmlFor={fid('phone')}>
                    Phone Number
                  </label>

                  <input
                    id={fid('phone')}
                    name="phone"
                    type="tel"
                    placeholder="(555) 000-0000"
                    autoComplete="tel"
                    inputMode="tel"
                    value={phone}
                    maxLength={14}
                    aria-invalid={
                      fieldError === 'phone'
                        ? 'true'
                        : undefined
                    }
                    aria-describedby={`${fid('phone-hint')}${fieldError === 'phone'
                      ? ` ${fid('phone-err')}`
                      : ''
                      }`}
                    onChange={(e) =>
                      setPhone(formatPhone(e.target.value))
                    }
                  />

                  <span
                    id={fid('phone-hint')}
                    className="field-hint"
                  >
                    Format: (555) 000-0000
                  </span>

                  {fieldError === 'phone' && (
                    <span
                      id={fid('phone-err')}
                      className="field-error"
                      role="alert"
                    >
                      {errorMsg}
                    </span>
                  )}
                </div>

              </div>
            </fieldset>

            {/* Profession */}
            <fieldset className="form-fieldset">

              <legend className="form-legend">
                Profession <span aria-hidden="true">*</span>
                <span className="sr-only">
                  (required, select all that apply)
                </span>
                <span className="form-legend-hint">
                  {' '}— select all that apply
                </span>
              </legend>

              <div
                className="profession-grid"
                role="group"
                aria-required="true"
                aria-invalid={
                  fieldError === 'profession'
                    ? 'true'
                    : undefined
                }
              >
                {PROFESSIONS.map((prof) => (
                  <label
                    key={prof}
                    className="checkbox-item"
                  >
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
                <span
                  className="field-error"
                  role="alert"
                >
                  {errorMsg}
                </span>
              )}

            </fieldset>

            {/* Experience & location */}
            <fieldset className="form-fieldset">

              <legend className="form-legend">
                Experience &amp; Location
              </legend>

              <div className="form-row">

                <div className="form-group">
                  <label htmlFor={fid('years_exp')}>
                    Specialty / Focus Area
                  </label>

                  <input
                    id={fid('years_exp')}
                    name="years_exp"
                    type="text"
                    placeholder="e.g. Residential Renovation"
                    maxLength={120}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={fid('service_area')}>
                    City &amp; State
                  </label>

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
                <label htmlFor={fid('website')}>
                  Website
                </label>

                <input
                  id={fid('website')}
                  name="website"
                  type="url"
                  placeholder="https://yourcompany.com"
                  autoComplete="url"
                  maxLength={2048}
                  aria-invalid={
                    fieldError === 'website'
                      ? 'true'
                      : undefined
                  }
                  aria-describedby={fid('website-hint')}
                />

                <span
                  id={fid('website-hint')}
                  className="field-hint"
                >
                  Must start with https://
                </span>
              </div>

            </fieldset>

            {/* Availability */}
            <fieldset className="form-fieldset">

              <legend className="form-legend">
                Availability to be contacted
                <span className="form-legend-hint">
                  {' '}— select all that apply
                </span>
              </legend>

              <div className="availability-table-wrapper">

                <table className="availability-table">

                  <thead>
                    <tr>
                      <th scope="col">
                        <span className="sr-only">
                          Time of day
                        </span>
                      </th>

                      {DAYS.map((day) => (
                        <th
                          key={day}
                          scope="col"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>

                    {TIMES.map((time) => (
                      <tr key={time}>

                        <th
                          scope="row"
                          className="time-label"
                        >
                          {time}
                        </th>

                        {DAYS.map((day) => (
                          <td key={day}>

                            <button
                              type="button"
                              className={`pill-btn${isActive(day, time)
                                ? ' pill-btn--active'
                                : ''
                                }`}
                              onClick={() =>
                                toggleSlot(day, time)
                              }
                              aria-pressed={isActive(day, time)}
                              aria-label={`${day} ${time}`}
                            >
                              {time === 'Morning'
                                ? 'AM'
                                : 'PM'}
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
              <legend className="form-legend">
                Documents <span className="form-legend-hint">(optional)</span>
              </legend>
              <p className="upload-subtext">
                Upload any documents you’d like to include with your application.
              </p>

              <div className="upload-grid">
                {[
                  {
                    label: 'Resume / Portfolio',
                    ref: fileInputRef,
                    state: resumeFile,
                    setter: setResumeFile,
                    type: 'resume',
                    accept: '.pdf,.doc,.docx',
                    hint: 'PDF, DOC, DOCX — max 10 MB',
                  },
                  {
                    label: 'Certificates / License',
                    ref: certFileRef,
                    state: certFile,
                    setter: setCertFile,
                    type: 'certificate',
                    accept: '.pdf,.jpg,.jpeg',
                    hint: 'PDF, JPG — max 10 MB',
                  },
                  {
                    label: 'Current Insurance',
                    ref: insuranceFileRef,
                    state: insuranceFile,
                    setter: setInsuranceFile,
                    type: 'insurance',
                    accept: '.pdf,.jpg,.jpeg',
                    hint: 'PDF, JPG — max 10 MB',
                  },
                ].map(({ label, ref, state, setter, type, accept, hint }) => {
                  const btnId = fid(`upload-${type}`);

                  return (
                    <div key={type} className={`upload-card ${state ? 'has-file' : ''}`}>
                      <div className="upload-card-header">
                        <span className="upload-card-title">{label}</span>
                      </div>

                      {/* Hidden File Input */}
                      <input
                        ref={ref}
                        id={`${btnId}-input`}
                        type="file"
                        accept={accept}
                        className="file-input-hidden"
                        onChange={(e) =>
                          handleFileChange(setter, e.target.files[0] || null, type)
                        }
                      />

                      {/* Card Body */}
                      {state ? (
                        <div className="uploaded-file-card">
                          <div className="file-info-group">
                            <div className="file-icon-badge">
                              <svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="#d9534f" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                            </div>
                            <div className="file-details">
                              <span className="file-name" title={state.name}>
                                {state.name}
                              </span>
                              <span className="file-meta-size">
                                {state.type.includes('pdf') ? 'PDF' : 'DOC'} • {(state.size / 1024).toFixed(0)} KB
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="file-remove-circle"
                            onClick={() => removeFile(setter, ref)}
                            aria-label={`Remove ${state.name}`}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="upload-dashed-zone"
                          onClick={() => ref.current?.click()}
                        >
                          <svg className="cloud-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5e3c" strokeWidth="1.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <div className="zone-text">
                            <strong>Click or press Enter to upload</strong>
                          </div>
                        </button>
                      )}

                      <div className="upload-card-footer">{hint}</div>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            {/* Password */}
            <fieldset className="form-fieldset password-section">

              <legend className="form-legend password-section-label">
                Create Your Account Password
              </legend>

              <div className="form-row">

                <div className="form-group">

                  <label htmlFor={fid('password')}>
                    Password <span aria-hidden="true">*</span>
                    <span className="sr-only">
                      (required)
                    </span>
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
                    aria-invalid={
                      fieldError === 'password'
                        ? 'true'
                        : undefined
                    }
                    aria-describedby={`${fid('pw-hint')}${fieldError === 'password'
                      ? ` ${fid('pw-err')}`
                      : ''
                      }`}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPwStrength(
                        calcStrength(e.target.value)
                      );
                    }}
                  />

                  <span
                    id={fid('pw-hint')}
                    className="field-hint"
                  >
                    Min 8 characters, 1 uppercase, 1 number
                  </span>

                  {password.length > 0 && (
                    <div
                      className="pw-strength"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <div className="pw-strength-bar">
                        <div
                          className="pw-strength-fill"
                          style={{
                            width: `${(pwStrength / 4) * 100}%`,
                            backgroundColor: STRENGTH_COLORS[pwStrength],
                          }}
                        />
                      </div>
                      <span className="pw-strength-label">
                        {STRENGTH_LABELS[pwStrength]}
                      </span>
                    </div>
                  )}

                  {fieldError === 'password' && (
                    <span
                      id={fid('pw-err')}
                      className="field-error"
                      role="alert"
                    >
                      {errorMsg}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor={fid('confirmPassword')}>
                    Confirm Password <span aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </label>

                  <input
                    id={fid('confirmPassword')}
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    aria-required="true"
                    aria-invalid={
                      fieldError === 'confirmPassword'
                        ? 'true'
                        : undefined
                    }
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  {fieldError === 'confirmPassword' && (
                    <span
                      id={fid('confirmPassword-err')}
                      className="field-error"
                      role="alert"
                    >
                      {errorMsg}
                    </span>
                  )}
                </div>

              </div>
            </fieldset>

            {/* Notes */}
            <fieldset className="form-fieldset">
              <legend className="form-legend">
                Additional Notes
              </legend>

              <div className="form-group">
                <textarea
                  id={fid('notes')}
                  name="notes"
                  placeholder="Anything else you would like us to know..."
                  maxLength={1000}
                />
                <span className="field-hint">Max 1000 characters</span>
              </div>
            </fieldset>

            {/* Submit */}
            <button
              ref={submitButtonRef}
              type="submit"
              className="form-submit btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting Application...' : 'Create Account & Submit'}
            </button>

            <p className="form-disclaimer">
              By submitting you agree to create an SM Design Floors contractor account and consent to us storing your information solely for the purpose of matching you with relevant projects. We will never sell your data.{' '}
              <button
                type="button"
                onClick={handleOpenPrivacy}
                className="form-legal-link"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                Privacy Policy
              </button>
            </p>

          </form>

        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <FocusTrap>
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-content">
              <h3>Registration Complete!</h3>
              <p>Your contractor account has been created. You can now access your contractor portal or close this window.</p>
              <div className="modal-actions">
                <button type="button" className="btn-primary" onClick={handleNavigateDashboard}>
                  Go to Contractor Portal
                </button>
                <button type="button" className="btn-outline" onClick={handleSuccessModalClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </FocusTrap>
      )}

      {/* Local Privacy Modal Fallback */}
      {showLocalPrivacyModal && (
        <PrivacyModal onClose={() => setShowLocalPrivacyModal(false)} />
      )}

    </section>
  );
}