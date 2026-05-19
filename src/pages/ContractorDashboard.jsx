import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ── icons (inline SVG helpers) ──────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  user:     'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  briefcase:'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  upload:   'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  status:   'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  edit:     'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  logout:   'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  file:     'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  check:    'M20 6L9 17l-5-5',
  clock:    'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  alert:    'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  x:        'M18 6L6 18M6 6l12 12',
  save:     'M19 21H5a2 2 0 0 0-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
};

const STATUS_CONFIG = {
  pending:  { label: 'Under Review',  color: '#c8953a', bg: 'rgba(200,149,58,0.12)'  },
  approved: { label: 'Approved',      color: '#3a9c6b', bg: 'rgba(58,156,107,0.12)'  },
  rejected: { label: 'Not Approved',  color: '#c84a4a', bg: 'rgba(200,74,74,0.12)'   },
  active:   { label: 'Active',        color: '#3a7fc8', bg: 'rgba(58,127,200,0.12)'  },
};

// ── main component ──────────────────────────────────────────────────────────
export default function ContractorDashboard() {
  const [user, setUser]               = useState(null);
  const [profile, setProfile]         = useState(null);
  const [submission, setSubmission]   = useState(null);
  const [jobs, setJobs]               = useState([]);
  const [documents, setDocuments]     = useState([]);
  const [activeTab, setActiveTab]     = useState('overview');
  const [loading, setLoading]         = useState(true);
  const [editMode, setEditMode]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [editForm, setEditForm]       = useState({});
  const docInputRef                   = useRef(null);

  // ── boot: get session ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadData(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadData = async (uid) => {
    setLoading(true);
    const [profileRes, submissionRes, docsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('professional_submissions').select('*').eq('user_id', uid).single(),
      supabase.from('professional_submission_files').select('*').eq('submission_id',
        (await supabase.from('professional_submissions').select('id').eq('user_id', uid).single()).data?.id
      ),
    ]);

    if (profileRes.data)    setProfile(profileRes.data);
    if (submissionRes.data) {
      setSubmission(submissionRes.data);
      setEditForm({
        name:         submissionRes.data.name         || '',
        business:     submissionRes.data.business     || '',
        phone:        submissionRes.data.phone        || '',
        service_area: submissionRes.data.service_area || '',
        website:      submissionRes.data.website      || '',
        notes:        submissionRes.data.notes        || '',
      });
      // load docs using submission id
      const docsRes2 = await supabase
        .from('professional_submission_files')
        .select('*')
        .eq('submission_id', submissionRes.data.id);
      if (docsRes2.data) setDocuments(docsRes2.data);
    }

    // load jobs if table exists
    const jobsRes = await supabase
      .from('contractor_jobs')
      .select('*')
      .eq('contractor_id', uid)
      .order('created_at', { ascending: false });
    if (jobsRes.data) setJobs(jobsRes.data);

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleSaveProfile = async () => {
    if (!submission) return;
    setSaving(true);
    const { error } = await supabase
      .from('professional_submissions')
      .update(editForm)
      .eq('id', submission.id);

    if (!error) {
      setSubmission({ ...submission, ...editForm });
      setSaveMsg('Saved!');
      setEditMode(false);
      setTimeout(() => setSaveMsg(''), 3000);
    } else {
      setSaveMsg('Error saving. Try again.');
    }
    setSaving(false);
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !submission) return;
    setUploadingDoc(true);

    const ext  = file.name.split('.').pop();
    const path = `professional/${submission.id}/doc-${Date.now()}.${ext}`;

    const { error: storageErr } = await supabase.storage
      .from('submissions-files')
      .upload(path, file);

    if (!storageErr) {
      const { data: newDoc } = await supabase
        .from('professional_submission_files')
        .insert([{ submission_id: submission.id, file_name: file.name, file_path: path, file_type: 'document' }])
        .select()
        .single();
      if (newDoc) setDocuments((d) => [...d, newDoc]);
    }
    setUploadingDoc(false);
    e.target.value = '';
  };

  const handleDeleteDoc = async (doc) => {
    await supabase.storage.from('submissions-files').remove([doc.file_path]);
    await supabase.from('professional_submission_files').delete().eq('id', doc.id);
    setDocuments((d) => d.filter((x) => x.id !== doc.id));
  };

  // ── loading / not authenticated ──
  if (loading) return (
    <div style={styles.centerFull}>
      <div style={styles.spinner} />
    </div>
  );

  if (!user) return (
    <div style={styles.centerFull}>
      <p style={{ color: 'var(--mid, #888)', fontFamily: 'Georgia, serif' }}>
        Please sign in to view your dashboard.
      </p>
    </div>
  );

  const status     = submission?.status || 'pending';
  const statusConf = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const tabs = [
    { id: 'overview', label: 'Overview',   icon: Icons.status    },
    { id: 'profile',  label: 'My Profile', icon: Icons.user      },
    { id: 'jobs',     label: 'Jobs',        icon: Icons.briefcase },
    { id: 'docs',     label: 'Documents',   icon: Icons.upload    },
  ];

  return (
    <div style={styles.root}>
      {/* ── sidebar ── */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logoMark}>SM</div>
          <div style={styles.logoText}>ProServices</div>
        </div>

        <div style={styles.avatarWrap}>
          <div style={styles.avatar}>
            {(profile?.full_name || user.email || '?')[0].toUpperCase()}
          </div>
          <div style={styles.avatarName}>{profile?.full_name || 'Contractor'}</div>
          <div style={styles.avatarEmail}>{user.email}</div>
          <div style={{ ...styles.statusBadge, color: statusConf.color, background: statusConf.bg }}>
            {statusConf.label}
          </div>
        </div>

        <nav style={styles.nav}>
          {tabs.map((t) => (
            <button
              key={t.id}
              style={{ ...styles.navBtn, ...(activeTab === t.id ? styles.navBtnActive : {}) }}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon d={t.icon} size={16} />
              {t.label}
            </button>
          ))}
        </nav>

        <button style={styles.logoutBtn} onClick={handleSignOut}>
          <Icon d={Icons.logout} size={15} />
          Sign Out
        </button>
      </aside>

      {/* ── main ── */}
      <main style={styles.main}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={styles.section}>
            <h1 style={styles.pageTitle}>
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Contractor'}
            </h1>
            <p style={styles.pageSubtitle}>Here's a snapshot of your contractor account.</p>

            {/* status card */}
            <div style={{ ...styles.statusCard, borderColor: statusConf.color }}>
              <div style={styles.statusCardIcon}>
                {status === 'approved' || status === 'active'
                  ? <Icon d={Icons.check} size={22} />
                  : status === 'rejected'
                  ? <Icon d={Icons.alert} size={22} />
                  : <Icon d={Icons.clock} size={22} />
                }
              </div>
              <div>
                <div style={{ ...styles.statusCardLabel, color: statusConf.color }}>
                  Application {statusConf.label}
                </div>
                <div style={styles.statusCardDesc}>
                  {status === 'pending'  && 'Our team is reviewing your application. We\'ll be in touch soon.'}
                  {status === 'approved' && 'Your application has been approved. Welcome to the network!'}
                  {status === 'active'   && 'You\'re an active member of the SM Design Floors contractor network.'}
                  {status === 'rejected' && 'Your application was not approved at this time. Please contact us for details.'}
                </div>
              </div>
            </div>

            {/* stats row */}
            <div style={styles.statsRow}>
              {[
                { label: 'Assigned Jobs',  value: jobs.length,      icon: Icons.briefcase },
                { label: 'Documents',      value: documents.length,  icon: Icons.file      },
                { label: 'Professions',    value: (submission?.professions || []).length, icon: Icons.user },
              ].map((s) => (
                <div key={s.label} style={styles.statCard}>
                  <div style={styles.statIcon}><Icon d={s.icon} size={20} /></div>
                  <div style={styles.statValue}>{s.value}</div>
                  <div style={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* quick info */}
            <div style={styles.infoGrid}>
              {[
                { label: 'Service Area', value: submission?.service_area || '—' },
                { label: 'Business',     value: submission?.business     || '—' },
                { label: 'Phone',        value: submission?.phone        || '—' },
                { label: 'Website',      value: submission?.website      || '—' },
              ].map((r) => (
                <div key={r.label} style={styles.infoRow}>
                  <span style={styles.infoLabel}>{r.label}</span>
                  <span style={styles.infoValue}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h1 style={styles.pageTitle}>My Profile</h1>
                <p style={styles.pageSubtitle}>Manage your contractor information.</p>
              </div>
              {!editMode
                ? <button style={styles.btnPrimary} onClick={() => setEditMode(true)}>
                    <Icon d={Icons.edit} size={15} /> Edit Profile
                  </button>
                : <div style={{ display: 'flex', gap: 10 }}>
                    <button style={styles.btnGhost} onClick={() => setEditMode(false)}>Cancel</button>
                    <button style={styles.btnPrimary} onClick={handleSaveProfile} disabled={saving}>
                      <Icon d={Icons.save} size={15} /> {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
              }
            </div>
            {saveMsg && <div style={styles.saveMsg}>{saveMsg}</div>}

            <div style={styles.card}>
              <div style={styles.formGrid}>
                {[
                  { key: 'name',         label: 'Full Name'       },
                  { key: 'business',     label: 'Company / Business' },
                  { key: 'phone',        label: 'Phone'           },
                  { key: 'service_area', label: 'City & State'    },
                  { key: 'website',      label: 'Website'         },
                ].map(({ key, label }) => (
                  <div key={key} style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>{label}</label>
                    {editMode
                      ? <input
                          style={styles.fieldInput}
                          value={editForm[key] || ''}
                          onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                        />
                      : <div style={styles.fieldValue}>{submission?.[key] || '—'}</div>
                    }
                  </div>
                ))}
              </div>

              {/* notes full width */}
              <div style={{ marginTop: 20 }}>
                <label style={styles.fieldLabel}>Notes / Bio</label>
                {editMode
                  ? <textarea
                      style={{ ...styles.fieldInput, height: 100, resize: 'vertical' }}
                      value={editForm.notes || ''}
                      onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                    />
                  : <div style={styles.fieldValue}>{submission?.notes || '—'}</div>
                }
              </div>

              {/* professions (read only) */}
              <div style={{ marginTop: 20 }}>
                <label style={styles.fieldLabel}>Professions</label>
                <div style={styles.tagRow}>
                  {(submission?.professions || []).length
                    ? (submission.professions).map((p) => (
                        <span key={p} style={styles.tag}>{p}</span>
                      ))
                    : <span style={styles.fieldValue}>—</span>
                  }
                </div>
              </div>

              {/* availability (read only) */}
              <div style={{ marginTop: 20 }}>
                <label style={styles.fieldLabel}>Availability</label>
                <div style={styles.tagRow}>
                  {(submission?.availability || []).length
                    ? (submission.availability).map((a) => (
                        <span key={a} style={{ ...styles.tag, background: 'rgba(58,127,200,0.1)', color: '#3a7fc8' }}>{a}</span>
                      ))
                    : <span style={styles.fieldValue}>—</span>
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JOBS */}
        {activeTab === 'jobs' && (
          <div style={styles.section}>
            <h1 style={styles.pageTitle}>Assigned Jobs</h1>
            <p style={styles.pageSubtitle}>Projects assigned to you by the SM Design Floors team.</p>

            {jobs.length === 0
              ? <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}><Icon d={Icons.briefcase} size={32} /></div>
                  <div style={styles.emptyTitle}>No jobs yet</div>
                  <div style={styles.emptyDesc}>
                    Once your application is approved and projects are available, they'll appear here.
                  </div>
                </div>
              : <div style={styles.jobList}>
                  {jobs.map((job) => {
                    const jStatus = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
                    return (
                      <div key={job.id} style={styles.jobCard}>
                        <div style={styles.jobHeader}>
                          <div style={styles.jobTitle}>{job.title || 'Project'}</div>
                          <div style={{ ...styles.statusBadge, color: jStatus.color, background: jStatus.bg }}>
                            {jStatus.label}
                          </div>
                        </div>
                        {job.description && <p style={styles.jobDesc}>{job.description}</p>}
                        <div style={styles.jobMeta}>
                          {job.location  && <span>📍 {job.location}</span>}
                          {job.start_date && <span>📅 {new Date(job.start_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === 'docs' && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h1 style={styles.pageTitle}>Documents</h1>
                <p style={styles.pageSubtitle}>Your uploaded files and certifications.</p>
              </div>
              <button style={styles.btnPrimary} onClick={() => docInputRef.current.click()} disabled={uploadingDoc}>
                <Icon d={Icons.upload} size={15} />
                {uploadingDoc ? 'Uploading…' : 'Upload File'}
              </button>
              <input ref={docInputRef} type="file" style={{ display: 'none' }} onChange={handleDocUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
            </div>

            {documents.length === 0
              ? <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}><Icon d={Icons.file} size={32} /></div>
                  <div style={styles.emptyTitle}>No documents</div>
                  <div style={styles.emptyDesc}>Upload your resume, certifications, or insurance documents.</div>
                </div>
              : <div style={styles.docList}>
                  {documents.map((doc) => (
                    <div key={doc.id} style={styles.docCard}>
                      <div style={styles.docIcon}><Icon d={Icons.file} size={20} /></div>
                      <div style={styles.docInfo}>
                        <div style={styles.docName}>{doc.file_name}</div>
                        <div style={styles.docMeta}>
                          {doc.file_type} · {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ''}
                        </div>
                      </div>
                      <button style={styles.docDelete} onClick={() => handleDeleteDoc(doc)}>
                        <Icon d={Icons.x} size={14} />
                      </button>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

      </main>
    </div>
  );
}

// ── styles ───────────────────────────────────────────────────────────────────
const TAN   = '#c4a882';
const DARK  = '#1a1714';
const MID   = '#6b5f52';
const LIGHT = '#f5f0e8';
const CARD  = '#ffffff';
const BORDER= '#e8e0d4';

const styles = {
  root: {
    display: 'flex', minHeight: '100vh',
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    background: LIGHT, color: DARK,
  },
  sidebar: {
    width: 240, background: DARK, color: '#fff',
    display: 'flex', flexDirection: 'column',
    padding: '28px 0', position: 'sticky', top: 0, height: '100vh',
    flexShrink: 0,
  },
  sidebarTop: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 24px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  logoMark: {
    width: 32, height: 32, borderRadius: 8,
    background: TAN, color: DARK,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 13, letterSpacing: 1,
  },
  logoText: {
    fontFamily: "'Georgia', serif", fontSize: 14,
    color: 'rgba(255,255,255,0.85)', letterSpacing: '0.08em',
  },
  avatarWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '24px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
    gap: 6,
  },
  avatar: {
    width: 56, height: 56, borderRadius: '50%',
    background: TAN, color: DARK,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 700, marginBottom: 4,
  },
  avatarName:  { fontSize: 14, fontWeight: 600, color: '#fff', textAlign: 'center' },
  avatarEmail: { fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  statusBadge: {
    fontSize: 11, fontWeight: 600, padding: '3px 10px',
    borderRadius: 20, letterSpacing: '0.04em',
  },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
  navBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 8, border: 'none',
    background: 'transparent', color: 'rgba(255,255,255,0.55)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.15s',
  },
  navBtnActive: { background: 'rgba(255,255,255,0.1)', color: '#fff' },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    margin: '0 12px', padding: '10px 14px', borderRadius: 8,
    border: 'none', background: 'transparent',
    color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer',
    transition: 'color 0.15s',
  },
  main:    { flex: 1, padding: '48px 48px', overflowY: 'auto', maxWidth: 900 },
  section: { maxWidth: 820 },
  sectionHeader: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 28, gap: 16,
  },
  pageTitle:    { fontSize: '1.9rem', fontWeight: 700, color: DARK, marginBottom: 6, fontFamily: "'Georgia', serif" },
  pageSubtitle: { fontSize: 14, color: MID, fontWeight: 400 },
  statusCard: {
    display: 'flex', alignItems: 'flex-start', gap: 18,
    background: CARD, border: '1.5px solid',
    borderRadius: 14, padding: '22px 24px', marginBottom: 28,
  },
  statusCardIcon: { marginTop: 2, flexShrink: 0 },
  statusCardLabel: { fontWeight: 700, fontSize: 15, marginBottom: 4 },
  statusCardDesc:  { fontSize: 13, color: MID, lineHeight: 1.6 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 },
  statCard: {
    background: CARD, borderRadius: 14, padding: '22px 20px',
    border: `1px solid ${BORDER}`, textAlign: 'center',
  },
  statIcon:  { color: TAN, marginBottom: 8 },
  statValue: { fontSize: '2rem', fontWeight: 700, color: DARK, lineHeight: 1 },
  statLabel: { fontSize: 12, color: MID, marginTop: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' },
  infoGrid: {
    background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`,
    overflow: 'hidden',
  },
  infoRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 22px', borderBottom: `1px solid ${BORDER}`,
  },
  infoLabel: { fontSize: 13, color: MID, fontWeight: 500 },
  infoValue: { fontSize: 13, color: DARK, fontWeight: 500 },
  card: {
    background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`,
    padding: '28px 28px',
  },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px' },
  fieldGroup:  { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel:  { fontSize: 11, fontWeight: 600, color: MID, textTransform: 'uppercase', letterSpacing: '0.08em' },
  fieldValue:  { fontSize: 14, color: DARK, padding: '2px 0' },
  fieldInput: {
    fontSize: 14, color: DARK, border: `1.5px solid ${BORDER}`,
    borderRadius: 8, padding: '9px 12px', outline: 'none',
    fontFamily: 'inherit', background: LIGHT, width: '100%', boxSizing: 'border-box',
  },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag: {
    fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
    background: `rgba(196,168,130,0.15)`, color: '#8b6f47',
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '10px 18px', borderRadius: 9, border: 'none',
    background: DARK, color: '#fff', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnGhost: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '10px 18px', borderRadius: 9,
    border: `1.5px solid ${BORDER}`, background: 'transparent',
    color: MID, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  saveMsg: {
    background: 'rgba(58,156,107,0.1)', color: '#3a9c6b',
    fontSize: 13, fontWeight: 600, padding: '10px 16px',
    borderRadius: 9, marginBottom: 18,
  },
  emptyState: {
    background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`,
    padding: '60px 40px', textAlign: 'center',
  },
  emptyIcon:  { color: BORDER, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 8 },
  emptyDesc:  { fontSize: 13, color: MID, maxWidth: 340, margin: '0 auto', lineHeight: 1.65 },
  jobList: { display: 'flex', flexDirection: 'column', gap: 14 },
  jobCard: {
    background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`,
    padding: '20px 24px',
  },
  jobHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  jobTitle:  { fontSize: 15, fontWeight: 700, color: DARK },
  jobDesc:   { fontSize: 13, color: MID, lineHeight: 1.6, margin: '0 0 12px' },
  jobMeta:   { display: 'flex', gap: 16, fontSize: 12, color: MID },
  docList:   { display: 'flex', flexDirection: 'column', gap: 10 },
  docCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`,
    padding: '14px 18px',
  },
  docIcon:   { color: TAN, flexShrink: 0 },
  docInfo:   { flex: 1, minWidth: 0 },
  docName:   { fontSize: 14, fontWeight: 600, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  docMeta:   { fontSize: 11, color: MID, marginTop: 3, textTransform: 'capitalize' },
  docDelete: {
    border: 'none', background: 'transparent', color: '#ccc',
    cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0,
  },
  centerFull: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh',
  },
  spinner: {
    width: 32, height: 32, border: `3px solid ${BORDER}`,
    borderTopColor: TAN, borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};