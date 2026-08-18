import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './ContractorDashboard.css';

// ── icons ──────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const Icons = {
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  briefcase:
    'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  upload:
    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  status:
    'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  logout:
    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  clock:
    'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
};

const EXT_STYLES = {
  PDF: { bg: 'rgba(200, 74, 74, 0.12)', color: '#a82424' },
  DOC: { bg: 'rgba(58, 127, 200, 0.12)', color: '#1a599c' },
  DOCX: { bg: 'rgba(58, 127, 200, 0.12)', color: '#1a599c' },
  PNG: { bg: 'rgba(58, 156, 107, 0.12)', color: '#1e6b43' },
  JPG: { bg: 'rgba(58, 156, 107, 0.12)', color: '#1e6b43' },
  JPEG: { bg: 'rgba(58, 156, 107, 0.12)', color: '#1e6b43' },
  default: { bg: 'rgba(120, 83, 52, 0.12)', color: '#785334' },
};

function getFileExt(fileName = '') {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : '';
}

function formatDocDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

const STATUS_CONFIG = {
  pending: { 
    label: 'Under Review', 
    color: 'black', 
    bg: 'rgb(197, 194, 22)' 
  },
  approved: { 
    label: 'Approved', 
    color: '#1e6b43', 
    bg: 'rgba(58, 156, 107, 0.15)' 
  },
  rejected: { 
    label: 'Not Approved', 
    color: '#a82424', 
    bg: 'rgba(200, 74, 74, 0.15)' 
  },
  active: { 
    label: 'Active', 
    color: '#1a599c', 
    bg: 'rgba(58, 127, 200, 0.15)' 
  },
};

export default function ContractorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [openingDocId, setOpeningDocId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

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
    if (!uid) return;
    setLoading(true);

    const [profileRes, submissionRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('professional_submissions').select('*').eq('user_id', uid).maybeSingle(),
    ]);

    const subData = submissionRes.data;

    if (!subData) {
      setSubmission(null);
      setDocuments([]);
      setJobs([]);
      setLoading(false);
      return;
    }

    if (profileRes.data) setProfile(profileRes.data);
    setSubmission(subData);
    console.log(uid);
    const docsRes = await supabase
      .from('professional_submission_files')
      .select('*')
      .eq('submission_id', uid);

    if (docsRes.data) setDocuments(docsRes.data);

    const jobsRes = await supabase
      .from('contractor_jobs')
      .select('*')
      .eq('contractor_id', uid)
      .order('created_at', { ascending: false });

    if (jobsRes.data) setJobs(jobsRes.data);

    setLoading(false);
  };

  const handleViewDocument = async (doc) => {
    if (!doc?.file_path) return;
    setOpeningDocId(doc.id);
    try {
      // Bucket is private (RLS-protected), so we need a short-lived
      // signed URL rather than a public URL.
      const { data, error } = await supabase.storage
        .from('submissions-files')
        .createSignedUrl(doc.file_path, 60); // valid for 60 seconds

      if (error) throw error;

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error opening document:', err);
      alert('Could not open this file. Please try again.');
    } finally {
      setOpeningDocId(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="cd-center-full">
        <div className="cd-spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="cd-center-full">
        <p>Please sign in to view your dashboard.</p>
      </div>
    );
  }

  // professional_submissions only has a boolean `approved` column — there's
  // no `status` text field, so derive it here instead of reading one off
  // the row.
  const status = submission?.approved ? 'approved' : 'pending';
  const statusConf = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Icons.status },
    { id: 'profile', label: 'Profile', icon: Icons.user },
    { id: 'jobs', label: 'Jobs', icon: Icons.briefcase },
    { id: 'docs', label: 'Documents', icon: Icons.upload },
  ];

  return (
    <div className="cd-root">
      <aside className="cd-sidebar">
        <div className="cd-sidebar-top-section">
          <div className="cd-sidebar-top">
            <div className="cd-logo-mark">SM</div>
            <div className="cd-logo-text">ProServices</div>
          </div>

          <div className="cd-avatar-wrap">
            <div className="cd-avatar">
              {(profile?.full_name || user.email || '?')[0].toUpperCase()}
            </div>

            <div className="cd-avatar-name">
              {profile?.full_name || 'Contractor'}
            </div>

            <div className="cd-avatar-email">
              {user.email}
            </div>

            <div
              className="cd-status-badge"
              style={{
                color: statusConf.color,
                background: statusConf.bg,
              }}
            >
              {statusConf.label}
            </div>
          </div>
        </div>

        <div className="cd-sidebar-footer">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`cd-nav-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon d={t.icon} size={16} />
              <span>{t.label}</span>
            </button>
          ))}
          <button className="cd-logout-btn" onClick={handleSignOut}>
            <Icon d={Icons.logout} size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="cd-main">
        {activeTab === 'overview' && (
          <div className="cd-section">
            <h1 className="cd-page-title">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Contractor'}
            </h1>

            <p className="cd-page-subtitle">
              Here's a snapshot of your account.
            </p>

            <div className="cd-status-card" style={{ borderColor: statusConf.color }}>
              <Icon d={Icons.clock} size={22} />
              <div>
                <div className="cd-status-card-label" style={{ color: statusConf.color }}>
                  Application {statusConf.label}
                </div>
                <div className="cd-status-card-desc">
                  {status === 'approved'
                    ? 'Your application has been approved.'
                    : 'We are reviewing your application.'}
                </div>
              </div>
            </div>

            <div className="cd-stats-row">
              <div className="cd-stat-card">
                <div className="cd-stat-value">{jobs.length}</div>
                <div className="cd-stat-label">Jobs</div>
              </div>

              <div className="cd-stat-card">
                <div className="cd-stat-value">{documents.length}</div>
                <div className="cd-stat-label">Documents</div>
              </div>

              <div className="cd-stat-card">
                <div className="cd-stat-value">
                  {(submission?.professions || []).length}
                </div>
                <div className="cd-stat-label">Professions</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="cd-section">
            <h1 className="cd-page-title">Profile</h1>

            <div className="cd-status-card">
              <div>
                <div className="cd-status-card-label">
                  {profile?.full_name || 'No name set'}
                </div>
                <div className="cd-status-card-desc">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="cd-danger-zone" style={{ marginTop: '2rem', border: '1px solid #a82424', padding: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ color: '#a82424', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Danger Zone</h3>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.25rem', color: '#444' }}>
                Once you delete your account, all associated submissions, documents, and job records will be permanently removed. This action cannot be undone.
              </p>
              <button 
                type="button" 
                className="cd-delete-btn" 
                style={{ 
                  backgroundColor: '#a82424', 
                  color: 'white', 
                  padding: '0.7rem 1.25rem', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontWeight: '600',
                  cursor: 'pointer' 
                }}
                onClick={async () => {
                  const confirmed = window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.');
                  if (!confirmed) return;

                  try {
                    setLoading(true);
                    
                    const { error: rpcError } = await supabase.rpc('delete_user_account');
                    if (rpcError) throw rpcError;

                    await supabase.auth.signOut();
                    navigate('/');
                  } catch (err) {
                    console.error('Error deleting account:', err);
                    alert('Failed to delete account. Please try again or contact support.');
                    setLoading(false);
                  }
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="cd-section">
            <h1 className="cd-page-title">Jobs</h1>

            {jobs.length === 0 ? (
              <p className="cd-page-subtitle">No jobs assigned yet.</p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="cd-status-card">
                  <div className="cd-status-card-label">
                    {job.title || 'Untitled Job'}
                  </div>
                  <div className="cd-status-card-desc">
                    {job.status}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="cd-section">
            <style>{`
              .cd-doc-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
              }
              .cd-doc-card {
                display: flex;
                align-items: center;
                gap: 14px;
                width: 100%;
                padding: 14px 16px;
                border-radius: 12px;
                border: 1px solid rgba(0, 0, 0, 0.08);
                background: #fff;
                text-align: left;
                font: inherit;
                cursor: pointer;
                transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
              }
              .cd-doc-card:hover:not(:disabled) {
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
                transform: translateY(-1px);
                border-color: rgba(0, 0, 0, 0.15);
              }
              .cd-doc-card:disabled {
                opacity: 0.6;
                cursor: default;
              }
              .cd-doc-badge {
                flex-shrink: 0;
                width: 42px;
                height: 42px;
                border-radius: 9px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                font-weight: 700;
                letter-spacing: 0.02em;
              }
              .cd-doc-info {
                flex: 1;
                min-width: 0;
              }
              .cd-doc-name {
                font-weight: 600;
                font-size: 1rem;
                color: #1a1a1a;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .cd-doc-meta {
                font-size: 0.8rem;
                color: #767676;
                margin-top: 2px;
              }
              .cd-doc-chevron {
                flex-shrink: 0;
                color: #b3b3b3;
              }
            `}</style>

            <h1 className="cd-page-title">Documents</h1>

            {documents.length === 0 ? (
              <p className="cd-page-subtitle">No documents uploaded.</p>
            ) : (
              <div className="cd-doc-list">
                {documents.map((doc) => {
                  const ext = getFileExt(doc.file_name);
                  const extStyle = EXT_STYLES[ext] || EXT_STYLES.default;
                  const isOpening = openingDocId === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      className="cd-doc-card"
                      onClick={() => handleViewDocument(doc)}
                      disabled={isOpening}
                    >
                      <div
                        className="cd-doc-badge"
                        style={{ background: extStyle.bg, color: extStyle.color }}
                      >
                        {ext || 'FILE'}
                      </div>

                      <div className="cd-doc-info">
                        <div className="cd-doc-name">{doc.file_name || 'Document'}</div>
                        <div className="cd-doc-meta">
                          {isOpening
                            ? 'Opening…'
                            : doc.created_at
                            ? `Uploaded ${formatDocDate(doc.created_at)}`
                            : 'Click to view'}
                        </div>
                      </div>

                      <div className="cd-doc-chevron">
                        <Icon d="M9 6l6 6-6 6" size={18} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}