import { useState, useRef } from 'react';
import './Contact.css';
import { supabase } from '../lib/supabase';

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

export default function Contact() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [availability, setAvailability]         = useState([]);
  const [floorplanFile, setFloorplanFile]       = useState(null);
  const floorplanRef = useRef(null);

  const toggleService = (v) =>
    setSelectedServices((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  const toggleSlot = (day, time) => {
    const slot = `${day} ${time}`;
    setAvailability((prev) => prev.includes(slot) ? prev.filter((x) => x !== slot) : [...prev, slot]);
  };

  const isActive = (day, time) => availability.includes(`${day} ${time}`);

  const uploadFile = async (submissionId, file, fileType) => {
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `contact/${submissionId}/${fileType}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('submissions-files')
      .upload(path, file);

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return;
    }

    await supabase.from('contact_submission_files').insert([{
      submission_id: submissionId,
      file_name:     file.name,
      file_path:     path,
      file_type:     fileType,
    }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowError(false);

    const form = e.target;

    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([{
        name:         form.name.value,
        email:        form.email.value,
        phone:        form.phone.value,
        budget:       form.budget.value,
        timeline:     form.timeline.value,
        services:     selectedServices,
        availability: availability,
        project_desc: form.project_desc.value,
      }])
      .select()
      .single();

    if (error) {
      console.error(error);
      setShowError(true);
      setLoading(false);
      return;
    }

    // Upload files
    await uploadFile(data.id, floorplanFile, 'floorplan');

    setLoading(false);
    setShowSuccess(true);
    setSelectedServices([]);
    setAvailability([]);
    setFloorplanFile(null);
    form.reset();
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <section id="contact">
      <div>
        <div className="form-card">
          <div className="form-title">Request a Quote</div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Your Name *</label>
                <input name="name" type="text" placeholder="Jane Doe" required />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input name="email" type="email" placeholder="jane@example.com" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input name="phone" type="tel" placeholder="(555) 000-0000" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Estimated Budget</label>
                <select name="budget">
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
                <select name="timeline">
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
                <span className="small-note">(select all that apply)</span>
              </label>
              <div className="service-grid">
                {SERVICES_NEEDED.map((svc) => (
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
            </div>

            <div className="form-group">
              <label>
                Availability to be contacted{' '}
                <span className="small-note">(select all that apply)</span>
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
              <label>Project Description *</label>
              <textarea
                name="project_desc"
                required
                placeholder="Tell us about your project – the space, square footage, materials, style, etc..."
              />
            </div>

            <div className="form-group">
              <label>Floor Plan <span className="small-note">— optional</span></label>
              <div className="upload-zone" onClick={() => floorplanRef.current.click()}>
                <input
                  ref={floorplanRef}
                  type="file"
                  accept=".png,.pdf,.jpeg,.jpg"
                  style={{ display: 'none' }}
                  onChange={(e) => setFloorplanFile(e.target.files[0] || null)}
                />
                {floorplanFile
                  ? <div className="upload-filename">{floorplanFile.name}</div>
                  : <div className="upload-hint">Click to upload</div>
                }
                <div className="upload-meta">PNG, PDF, JPEG · 10MB</div>
              </div>
            </div>

            <button type="submit" className="form-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send My Request'}
            </button>
          </form>

          <div className={`success-banner ${showSuccess ? 'show' : ''}`}>
            ✓ Request received! We'll reach out within 24 hours.
          </div>
          <div className={`success-banner ${showError ? 'show' : ''}`} style={{ borderColor: 'red' }}>
            ✗ Something went wrong. Please try again or call us directly.
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
          {CONTACT_DETAILS.map((c) => (
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