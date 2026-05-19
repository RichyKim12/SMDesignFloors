import { useState, useRef } from 'react';
import './Professionals.css';
import { supabase } from '../lib/supabase';

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

export default function Professionals() {
  const [showVerification, setShowVerification] = useState(false);
  const [showError, setShowError]               = useState(false);
  const [errorMsg, setErrorMsg]                 = useState('');
  const [loading, setLoading]                   = useState(false);
  const [selectedProfs, setSelectedProfs]       = useState([]);
  const [availability, setAvailability]         = useState([]);
  const [resumeFile, setResumeFile]             = useState(null);
  const [certFile, setCertFile]                 = useState(null);
  const [insuranceFile, setInsuranceFile]       = useState(null);
  const [password, setPassword]                 = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [phone, setPhone]                       = useState('');

  const fileInputRef     = useRef(null);
  const certFileRef      = useRef(null);
  const insuranceFileRef = useRef(null);

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length < 4) return digits;
    if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const toggleProf = (v) =>
    setSelectedProfs((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  const toggleSlot = (day, time) => {
    const slot = `${day} ${time}`;
    setAvailability((prev) => prev.includes(slot) ? prev.filter((x) => x !== slot) : [...prev, slot]);
  };

  const isActive = (day, time) => availability.includes(`${day} ${time}`);

  const uploadFile = async (submissionId, file, fileType) => {
    if (!file) return;
    const ext  = file.name.split('.').pop();
    const path = `professional/${submissionId}/${fileType}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('submissions-files')
      .upload(path, file);

    if (uploadError) {
      console.error(`Storage upload error (${fileType}):`, uploadError);
      return;
    }

    const { error: fileInsertError } = await supabase
      .from('professional_submission_files')
      .insert([{
        submission_id: submissionId,
        file_name:     file.name,
        file_path:     path,
        file_type:     fileType,
      }]);

    if (fileInsertError) {
      console.error(`File record insert error (${fileType}):`, fileInsertError);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowError(false);
    setErrorMsg('');

    const form  = e.target;
    const email = form.email.value.trim();
    const name  = form.name.value.trim();

    // Password validation
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      setShowError(true);
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setShowError(true);
      setLoading(false);
      return;
    }

    // Step 1: Create auth account — Supabase prevents duplicate emails natively
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('user already exists')) {
        setErrorMsg('An account with this email already exists. Please sign in instead.');
      } else {
        setErrorMsg(`Account creation failed: ${authError.message}`);
      }
      setShowError(true);
      setLoading(false);
      return;
    }

    const userId = authData?.user?.id;

    if (!userId) {
      setErrorMsg('Could not create account. This email may already be registered.');
      setShowError(true);
      setLoading(false);
      return;
    }

    // Step 2: Insert submission with the real user_id
    const { data, error } = await supabase
      .from('professional_submissions')
      .insert([{
        user_id:      userId,
        name,
        business:     form.business.value.trim() || null,
        email,
        phone:        phone || null,
        professions:  selectedProfs,
        availability,
        years_exp:    form.years_exp.value.trim() || null,
        service_area: form.service_area.value.trim() || null,
        website:      form.website?.value?.trim() || null,
        notes:        form.notes?.value?.trim() || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Submission error:', error.message, error.details, error.hint);
      setErrorMsg(`Something went wrong saving your application: ${error.message}`);
      setShowError(true);
      setLoading(false);
      return;
    }

    // Step 3: Upload files
    await Promise.all([
      uploadFile(data.id, resumeFile,    'resume'),
      uploadFile(data.id, certFile,      'certificate'),
      uploadFile(data.id, insuranceFile, 'insurance'),
    ]);

    // Step 4: Upsert profile with contractor role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, role: 'contractor', full_name: name, email });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
    }

    setLoading(false);
    setShowVerification(true);

    // Reset form
    setSelectedProfs([]);
    setAvailability([]);
    setResumeFile(null);
    setCertFile(null);
    setInsuranceFile(null);
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    form.reset();
  };

  return (
    <section id="professionals">

      {/* ── Success popup modal ── */}
      {showVerification && (
        <div className="modal-overlay visible" onClick={() => setShowVerification(false)}>
          <div className="verification-modal" onClick={e => e.stopPropagation()}>
            <div className="verification-icon">✓</div>
            <h3 className="verification-title">Account Created!</h3>
            <p className="verification-body">
              Your contractor account has been created and your application has been submitted.
              Our team will review your profile and be in touch soon.
            </p>
            <p className="verification-sub">
              You can now sign in using the button at the top of the page.
            </p>
            <button className="verification-btn" onClick={() => setShowVerification(false)}>
              Got it
            </button>
          </div>
        </div>
      )}

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

          {/* Account creation notice */}
          <div className="account-notice">
            <p>
              Completing this form will create a <strong>SM Design Floors contractor account</strong> linked
              to your email. You'll use it to sign in and manage your profile once approved.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input name="name" type="text" placeholder="John Smith" required />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input name="email" type="email" placeholder="john@company.com" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Company / Business</label>
                <input name="business" type="text" placeholder="Smith Contracting LLC" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                />
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
                <input name="years_exp" type="text" placeholder="e.g. Residential Renovation" />
              </div>
              <div className="form-group">
                <label>City &amp; State</label>
                <input name="service_area" type="text" placeholder="e.g. Woodbridge, VA" />
              </div>
            </div>

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
                      {DAYS.map((day) => <th key={day}>{day}</th>)}
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

            <div className="form-group">
              <label>Documents</label>
              <div className="upload-grid">

                <div className="upload-field">
                  <div className="upload-field-label">Resume / Portfolio</div>
                  <div className="upload-zone" onClick={() => fileInputRef.current.click()}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={(e) => setResumeFile(e.target.files[0] || null)}
                    />
                    {resumeFile
                      ? <div className="upload-filename">{resumeFile.name}</div>
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
                      onChange={(e) => setCertFile(e.target.files[0] || null)}
                    />
                    {certFile
                      ? <div className="upload-filename">{certFile.name}</div>
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
                      onChange={(e) => setInsuranceFile(e.target.files[0] || null)}
                    />
                    {insuranceFile
                      ? <div className="upload-filename">{insuranceFile.name}</div>
                      : <div className="upload-hint">Click to upload</div>
                    }
                    <div className="upload-meta">PDF, JPG, JPEG · 10MB</div>
                  </div>
                </div>

              </div>
            </div>

            {/* ── Password section ── */}
            <div className="password-section">
              <div className="password-section-label">Create Your Account Password</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <span className="field-hint">Minimum 6 characters</span>
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {showError && (
              <div className="form-error-banner">
                ✗ {errorMsg}
              </div>
            )}

            <button type="submit" className="form-submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Create Account & Submit'}
            </button>

            <p className="form-legal">
              By submitting, you agree to create an SM Design Floors contractor account.
              You can sign in immediately after submitting.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}