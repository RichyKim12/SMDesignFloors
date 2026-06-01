import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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

const STATUS_CONFIG = {
  pending: { label: 'Under Review', color: '#c8953a', bg: 'rgba(200,149,58,0.12)' },
  approved: { label: 'Approved', color: '#3a9c6b', bg: 'rgba(58,156,107,0.12)' },
  rejected: { label: 'Not Approved', color: '#c84a4a', bg: 'rgba(200,74,74,0.12)' },
  active: { label: 'Active', color: '#3a7fc8', bg: 'rgba(58,127,200,0.12)' },
};

export default function ContractorDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [documents, setDocuments] = useState([]);
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
    setLoading(true);

    const [profileRes, submissionRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('professional_submissions').select('*').eq('user_id', uid).single(),
    ]);

    if (profileRes.data) setProfile(profileRes.data);

    if (submissionRes.data) {
      setSubmission(submissionRes.data);

      const docsRes = await supabase
        .from('professional_submission_files')
        .select('*')
        .eq('submission_id', submissionRes.data.id);

      if (docsRes.data) setDocuments(docsRes.data);
    }

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
    setRole(null);
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

  const status = submission?.status || 'pending';
  const statusConf = STATUS_CONFIG[status];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Icons.status },
    { id: 'profile', label: 'Profile', icon: Icons.user },
    { id: 'jobs', label: 'Jobs', icon: Icons.briefcase },
    { id: 'docs', label: 'Documents', icon: Icons.upload },
  ];

  return (
    <div className="cd-root">

      <aside className="cd-sidebar">

        {/* TOP SECTION (STRUCTURED FIX) */}
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
                  We are reviewing your application.
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
            <h1 className="cd-page-title">Documents</h1>

            {documents.length === 0 ? (
              <p className="cd-page-subtitle">No documents uploaded.</p>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="cd-status-card">
                  <div className="cd-status-card-label">
                    {doc.file_name || 'Document'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </main>
    </div>
  );
}