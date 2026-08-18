import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './AdminDashboard.css';

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  jobs: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',
  contractors: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  search: 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  x: 'M18 6L6 18M6 6l12 12',
  sort: 'M3 6h18M7 12h10M11 18h2',
};

const STATUS_OPTIONS = ['new', 'in_progress', 'completed'];
const STATUS_LABELS = { new: 'New', in_progress: 'In Progress', completed: 'Completed' };
const STATUS_COLORS = { new: '#c8953a', in_progress: '#4a7fb5', completed: '#2d8a5e' };

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name_az', label: 'Name A–Z' },
  { value: 'name_za', label: 'Name Z–A' },
];

const EXT_STYLES = {
  PDF: { bg: 'rgba(200, 74, 74, 0.12)', color: '#a82424' },
  DOC: { bg: 'rgba(74, 127, 181, 0.12)', color: '#4a7fb5' },
  DOCX: { bg: 'rgba(74, 127, 181, 0.12)', color: '#4a7fb5' },
  PNG: { bg: 'rgba(45, 138, 94, 0.12)', color: '#2d8a5e' },
  JPG: { bg: 'rgba(45, 138, 94, 0.12)', color: '#2d8a5e' },
  JPEG: { bg: 'rgba(45, 138, 94, 0.12)', color: '#2d8a5e' },
  default: { bg: 'rgba(120, 83, 52, 0.12)', color: '#785334' },
};

function getFileExt(fileName = '') {
  const parts = String(fileName || '').split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : '';
}

function formatFileDate(dateStr) {
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

// Helper to generate temporary signed URLs for private storage buckets
const getSignedFileUrl = async (filePath, defaultBucket = 'submissions-files') => {
  if (!filePath) return '#';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;

  let cleanPath = filePath.replace(/^\/+/, '');
  let bucket = defaultBucket;

  if (cleanPath.startsWith('submissions-files/')) {
    bucket = 'submissions-files';
    cleanPath = cleanPath.replace(/^submissions-files\//, '');
  } else if (cleanPath.startsWith('contractor-documents/')) {
    bucket = 'contractor-documents';
    cleanPath = cleanPath.replace(/^contractor-documents\//, '');
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(cleanPath, 3600, {download:true}); // 1 hour validity

  if (error) {
    console.error(`Error generating signed URL for ${bucket}/${cleanPath}:`, error);
    return '#';
  }

  return data?.signedUrl || '#';
};

// Injected once; scoped by class name so it's safe alongside the rest of admin-dashboard.css
const FileCardStyles = () => (
  <style>{`
    .adm-doc-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .adm-doc-card {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      background: #fff;
      text-align: left;
      font: inherit;
      cursor: pointer;
      transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
      text-decoration: none;
    }
    .adm-doc-card:hover {
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
      border-color: rgba(0, 0, 0, 0.15);
    }
    .adm-doc-card.is-disabled {
      opacity: 0.6;
      cursor: default;
      pointer-events: none;
    }
    .adm-doc-badge {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .adm-doc-info {
      flex: 1;
      min-width: 0;
    }
    .adm-doc-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: #1a1a1a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .adm-doc-meta {
      font-size: 0.76rem;
      color: #888;
      margin-top: 1px;
    }
  `}</style>
);

// Reusable component to render asynchronous file attachment links.
// fileType / uploadedAt are optional — used when available (contractor docs)
// but the component degrades gracefully without them (job attachments).
function SignedFileLink({ filePath, defaultBucket, fileName, fileType, uploadedAt }) {
  const [url, setUrl] = useState('#');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchUrl() {
      setLoading(true);
      const signedUrl = await getSignedFileUrl(filePath, defaultBucket);
      if (isMounted) {
        setUrl(signedUrl);
        setLoading(false);
      }
    }

    if (filePath) {
      fetchUrl();
    }
    return () => { isMounted = false; };
  }, [filePath, defaultBucket]);

  const ext = getFileExt(fileName);
  const extStyle = EXT_STYLES[ext] || EXT_STYLES.default;
  const metaParts = [fileType, uploadedAt ? `Uploaded ${formatFileDate(uploadedAt)}` : null].filter(Boolean);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`adm-doc-card ${loading ? 'is-disabled' : ''}`}
    >
      <div className="adm-doc-badge" style={{ background: extStyle.bg, color: extStyle.color }}>
        {ext || 'FILE'}
      </div>
      <div className="adm-doc-info">
        <div className="adm-doc-name">{fileName || 'Document'}</div>
        <div className="adm-doc-meta">
          {loading ? 'Loading…' : (metaParts.join(' · ') || 'Click to view')}
        </div>
      </div>
    </a>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState('jobs');

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobNote, setJobNote] = useState('');
  const [assignContractorId, setAssignContractorId] = useState('');

  // Jobs search & filters
  const [jobSearch, setJobSearch] = useState('');
  const [jobFilterStatus, setJobFilterStatus] = useState('all');
  const [jobFilterService, setJobFilterService] = useState('all');
  const [jobFilterDate, setJobFilterDate] = useState('all');
  const [jobSortBy, setJobSortBy] = useState('newest');

  // Contractors state
  const [contractors, setContractors] = useState([]);
  const [contractorsLoading, setContractorsLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [approvedContractors, setApprovedContractors] = useState([]);

  // Contractor search & filter state
  const [contractorSearch, setContractorSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProfession, setFilterProfession] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Autosave indicator
  const [saveIndicator, setSaveIndicator] = useState('');

  const isFirstNoteRender = useRef(true);
  const isFirstAssignRender = useRef(true);
  const selectedJobId = useRef(null);

  useEffect(() => { 
    fetchJobs(); 
    fetchContractors(); 
  }, []);

  useEffect(() => {
    if (selectedJob?.id !== selectedJobId.current) {
      selectedJobId.current = selectedJob?.id ?? null;
      isFirstNoteRender.current = true;
      isFirstAssignRender.current = true;
    }
  }, [selectedJob?.id]);

  const flashSaved = () => {
    setSaveIndicator('saving');
    setTimeout(() => setSaveIndicator('saved'), 500);
    setTimeout(() => setSaveIndicator(''), 2200);
  };

  // Autosave notes
  useEffect(() => {
    if (!selectedJob) return;

    if (isFirstNoteRender.current) {
      isFirstNoteRender.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      await supabase
        .from('contact_submissions')
        .update({ admin_notes: jobNote })
        .eq('id', selectedJob.id);
      setJobs(prev =>
        prev.map(j => j.id === selectedJob.id ? { ...j, admin_notes: jobNote } : j)
      );
      flashSaved();
    }, 800);

    return () => clearTimeout(timer);
  }, [jobNote]);

  // Autosave contractor assignment
  useEffect(() => {
    if (!selectedJob) return;

    if (isFirstAssignRender.current) {
      isFirstAssignRender.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      const contractor = approvedContractors.find(c => (c.user_id || c.id) === assignContractorId);
      const contractorName = contractor ? (contractor.full_name || contractor.name || '') : '';

      await supabase
        .from('contact_submissions')
        .update({
          assigned_contractor_id: assignContractorId || null,
          assigned_contractor_name: contractorName,
        })
        .eq('id', selectedJob.id);

      setJobs(prev =>
        prev.map(j =>
          j.id === selectedJob.id
            ? { ...j, assigned_contractor_id: assignContractorId, assigned_contractor_name: contractorName }
            : j
        )
      );
      setSelectedJob(prev => ({
        ...prev,
        assigned_contractor_id: assignContractorId,
        assigned_contractor_name: contractorName,
      }));
      flashSaved();
    }, 600);

    return () => clearTimeout(timer);
  }, [assignContractorId]);

  const fetchJobs = async () => {
    setJobsLoading(true);
    // Fetch base jobs
    const { data: jobData, error: jobErr } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (jobErr) console.error('Fetch jobs error:', jobErr);

    // Fetch files independently to avoid join crashes if RLS/foreign key is missing
    const { data: filesData } = await supabase
      .from('contact_submission_files')
      .select('*');

    const mappedJobs = (jobData || []).map(job => ({
      ...job,
      contact_submission_files: (filesData || []).filter(f => f.submission_id === job.id)
    }));

    setJobs(mappedJobs);
    setJobsLoading(false);
  };

  const fetchContractors = async () => {
    setContractorsLoading(true);
    // Fetch base contractors table directly (matching original working code)
    const { data: contractorData, error: contractorErr } = await supabase
      .from('professional_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (contractorErr) console.error('Fetch contractors error:', contractorErr);

    // Fetch files independently to protect against missing DB foreign key constraints
    const { data: filesData } = await supabase
      .from('professional_submission_files')
      .select('*');

    const mappedContractors = (contractorData || []).map(c => {
      const cId = c.user_id || c.id;
      return {
        ...c,
        professional_submissions_files: (filesData || []).filter(f => f.user_id === cId || f.submission_id === cId)
      };
    });

    setContractors(mappedContractors);
    setApprovedContractors(mappedContractors.filter(c => c.approved));
    setContractorsLoading(false);
  };

  const allJobServices = useMemo(() => {
    const set = new Set();
    jobs.forEach(j => {
      const svcs = Array.isArray(j.services) ? j.services : j.services ? [j.services] : [];
      svcs.forEach(s => set.add(s));
    });
    return Array.from(set).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let list = [...jobs];

    if (jobFilterStatus !== 'all') {
      list = list.filter(j => (j.status || 'new') === jobFilterStatus);
    }

    if (jobFilterService !== 'all') {
      list = list.filter(j => {
        const svcs = Array.isArray(j.services) ? j.services : j.services ? [j.services] : [];
        return svcs.includes(jobFilterService);
      });
    }

    if (jobFilterDate !== 'all') {
      const now = new Date();
      list = list.filter(j => {
        if (!j.created_at) return false;
        const created = new Date(j.created_at);
        if (jobFilterDate === 'today') {
          return created.toDateString() === now.toDateString();
        }
        if (jobFilterDate === 'week') {
          const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
          return created >= weekAgo;
        }
        if (jobFilterDate === 'month') {
          const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
          return created >= monthAgo;
        }
        return true;
      });
    }

    const q = jobSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(j =>
        (j.name || '').toLowerCase().includes(q) ||
        (j.email || '').toLowerCase().includes(q) ||
        (j.phone || '').toLowerCase().includes(q) ||
        (j.project_desc || '').toLowerCase().includes(q) ||
        (j.assigned_contractor_name || '').toLowerCase().includes(q) ||
        (Array.isArray(j.services) ? j.services.join(' ') : j.services || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (jobSortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (jobSortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (jobSortBy === 'name_az') return (a.name || '').localeCompare(b.name || '');
      if (jobSortBy === 'name_za') return (b.name || '').localeCompare(a.name || '');
      return 0;
    });

    return list;
  }, [jobs, jobSearch, jobFilterStatus, jobFilterService, jobFilterDate, jobSortBy]);

  const clearJobFilters = () => {
    setJobSearch('');
    setJobFilterStatus('all');
    setJobFilterService('all');
    setJobFilterDate('all');
    setJobSortBy('newest');
  };

  const hasActiveJobFilters =
    jobSearch || jobFilterStatus !== 'all' || jobFilterService !== 'all' ||
    jobFilterDate !== 'all' || jobSortBy !== 'newest';

  const allProfessions = useMemo(() => {
    const set = new Set();
    contractors.forEach(c => {
      const profs = Array.isArray(c.professions) ? c.professions : c.professions ? [c.professions] : [];
      profs.forEach(p => set.add(p));
    });
    return Array.from(set).sort();
  }, [contractors]);

  const filteredContractors = useMemo(() => {
    let list = [...contractors];

    if (filterStatus === 'approved') list = list.filter(c => c.approved);
    else if (filterStatus === 'pending') list = list.filter(c => !c.approved);

    if (filterProfession !== 'all') {
      list = list.filter(c => {
        const profs = Array.isArray(c.professions) ? c.professions : c.professions ? [c.professions] : [];
        return profs.includes(filterProfession);
      });
    }

    const q = contractorSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(c =>
        (c.full_name || c.name || '').toLowerCase().includes(q) ||
        (c.business || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.service_area || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const nameA = a.full_name || a.name || '';
      const nameB = b.full_name || b.name || '';
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'name_az') return nameA.localeCompare(nameB);
      if (sortBy === 'name_za') return nameB.localeCompare(nameA);
      return 0;
    });

    return list;
  }, [contractors, filterStatus, filterProfession, contractorSearch, sortBy]);

  const clearContractorFilters = () => {
    setContractorSearch('');
    setFilterStatus('all');
    setFilterProfession('all');
    setSortBy('newest');
  };

  const hasActiveFilters =
    contractorSearch || filterStatus !== 'all' || filterProfession !== 'all' || sortBy !== 'newest';

  const approveContractor = async (id) => {
    const { error } = await supabase
      .from('professional_submissions')
      .update({ approved: true })
      .or(`user_id.eq.${id},id.eq.${id}`);

    if (error) { console.error('Approve failed:', error.message); return; }
    fetchContractors();
    if ((selectedContractor?.user_id || selectedContractor?.id) === id)
      setSelectedContractor(prev => ({ ...prev, approved: true }));
  };

  const revokeContractor = async (id) => {
    const { error } = await supabase
      .from('professional_submissions')
      .update({ approved: false })
      .or(`user_id.eq.${id},id.eq.${id}`);

    if (error) { console.error('Revoke failed:', error.message); return; }
    fetchContractors();
    if ((selectedContractor?.user_id || selectedContractor?.id) === id)
      setSelectedContractor(prev => ({ ...prev, approved: false }));
  };

  const updateJobStatus = async (id, status) => {
    await supabase.from('contact_submissions').update({ status }).eq('id', id);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
    if (selectedJob?.id === id) setSelectedJob(prev => ({ ...prev, status }));
  };

  const deleteJob = async (id) => {
    if (!confirm('Delete this job? This cannot be undone.')) return;
    await supabase.from('contact_submissions').delete().eq('id', id);
    setJobs(prev => prev.filter(j => j.id !== id));
    if (selectedJob?.id === id) setSelectedJob(null);
  };

  const openJob = (job) => {
    setSelectedJob(job);
    setJobNote(job.admin_notes || '');
    setAssignContractorId(job.assigned_contractor_id || '');
    setSaveIndicator('');
  };

  const openContractor = (c) => setSelectedContractor(c);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const jobStats = {
    total: jobs.length,
    new: jobs.filter(j => !j.status || j.status === 'new').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  const contractorStats = {
    total: contractors.length,
    approved: contractors.filter(c => c.approved).length,
    pending: contractors.filter(c => !c.approved).length,
  };

  return (
    <div className="admin-root">
      <FileCardStyles />

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-sm">SM</div>
          <div className="admin-brand-text">Design Floors</div>
          <div className="admin-brand-tag">Admin</div>
        </div>

        <div className="sidebar-stats-row">
          <div className="sidebar-stat">
            <span className="sidebar-stat-val">{jobStats.total}</span>
            <span className="sidebar-stat-label">Jobs</span>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-val">{contractorStats.total}</span>
            <span className="sidebar-stat-label">Contractors</span>
          </div>
        </div>

        <button
          className={`admin-nav-item ${view === 'jobs' ? 'active' : ''}`}
          onClick={() => setView('jobs')}
        >
          <Icon d={Icons.jobs} size={16} />
          <span>Jobs</span>
          {jobStats.new > 0 && <span className="nav-badge">{jobStats.new}</span>}
        </button>

        <button
          className={`admin-nav-item ${view === 'contractors' ? 'active' : ''}`}
          onClick={() => setView('contractors')}
        >
          <Icon d={Icons.contractors} size={16} />
          <span>Contractors</span>
          {contractorStats.pending > 0 && <span className="nav-badge">{contractorStats.pending}</span>}
        </button>

        <div className="admin-sidebar-footer">
          <button className="btn-sign-out" onClick={handleSignOut}>
            <Icon d={Icons.logout} size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="admin-main">

        {/* ════ JOBS VIEW ════ */}
        {view === 'jobs' && (
          <div className="admin-view">
            <div className="admin-view-header">
              <div>
                <h1 className="admin-view-title">Jobs</h1>
                <p className="admin-view-sub">Client contact submissions &amp; assignments</p>
              </div>
              <div className="stat-chips">
                <div className="stat-chip" style={{ '--chip-color': '#c8953a' }}>
                  <span>{jobStats.new}</span> New
                </div>
                <div className="stat-chip" style={{ '--chip-color': '#4a7fb5' }}>
                  <span>{jobStats.inProgress}</span> In Progress
                </div>
                <div className="stat-chip" style={{ '--chip-color': '#2d8a5e' }}>
                  <span>{jobStats.completed}</span> Completed
                </div>
              </div>
            </div>

            {/* Jobs Toolbar */}
            <div className="contractor-toolbar">
              <div className="contractor-search-wrap">
                <Icon d={Icons.search} size={15} />
                <input
                  className="contractor-search"
                  type="text"
                  placeholder="Search by name, email, phone, description…"
                  value={jobSearch}
                  onChange={e => setJobSearch(e.target.value)}
                />
                {jobSearch && (
                  <button className="search-clear" onClick={() => setJobSearch('')}>
                    <Icon d={Icons.x} size={13} />
                  </button>
                )}
              </div>

              <div className="contractor-filters">
                <div className="filter-pill-group">
                  {['all', 'new', 'in_progress', 'completed'].map(s => (
                    <button
                      key={s}
                      className={`filter-pill ${jobFilterStatus === s ? 'active' : ''}`}
                      style={jobFilterStatus === s && s !== 'all'
                        ? { '--pill-active-color': STATUS_COLORS[s] }
                        : {}
                      }
                      onClick={() => setJobFilterStatus(s)}
                    >
                      {s === 'all' ? 'All' : STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>

                <select
                  className="admin-select admin-select--sm"
                  value={jobFilterDate}
                  onChange={e => setJobFilterDate(e.target.value)}
                >
                  <option value="all">Any Date</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>

                {allJobServices.length > 0 && (
                  <select
                    className="admin-select admin-select--sm"
                    value={jobFilterService}
                    onChange={e => setJobFilterService(e.target.value)}
                  >
                    <option value="all">All Services</option>
                    {allJobServices.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}

                <div className="sort-wrap">
                  <Icon d={Icons.sort} size={14} />
                  <select
                    className="admin-select admin-select--sm"
                    value={jobSortBy}
                    onChange={e => setJobSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {hasActiveJobFilters && (
                  <button className="btn-clear-filters" onClick={clearJobFilters}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="contractor-results-meta">
              {filteredJobs.length} of {jobs.length} job{jobs.length !== 1 ? 's' : ''}
              {hasActiveJobFilters && ' (filtered)'}
            </div>

            <div className="admin-split">
              {/* Job List */}
              <div className="admin-list">
                {jobsLoading
                  ? <div className="admin-loading">Loading jobs…</div>
                  : filteredJobs.length === 0
                    ? (
                      <div className="admin-empty">
                        {hasActiveJobFilters ? 'No jobs match your filters.' : 'No jobs yet.'}
                        {hasActiveJobFilters && (
                          <button className="btn-text" onClick={clearJobFilters}>Clear filters</button>
                        )}
                      </div>
                    )
                    : filteredJobs.map(job => (
                      <div
                        key={job.id}
                        className={`admin-list-item ${selectedJob?.id === job.id ? 'selected' : ''}`}
                        onClick={() => openJob(job)}
                      >
                        <div className="list-item-top">
                          <span className="list-item-name">{job.name}</span>
                          <span
                            className="list-item-status"
                            style={{ color: STATUS_COLORS[job.status || 'new'] }}
                          >
                            {STATUS_LABELS[job.status || 'new']}
                          </span>
                        </div>
                        <div className="list-item-meta">
                          <span>{job.email}</span>
                          <span>{formatDate(job.created_at)}</span>
                        </div>
                        {job.assigned_contractor_name && (
                          <div className="list-item-assigned">
                            Assigned: {job.assigned_contractor_name}
                          </div>
                        )}
                      </div>
                    ))
                }
              </div>

              {/* Job Detail */}
              <div className="admin-detail">
                {!selectedJob
                  ? <div className="admin-detail-empty">Select a job to view details</div>
                  : (
                    <div className="detail-content">
                      <div className="detail-header">
                        <div>
                          <h2 className="detail-title">{selectedJob.name}</h2>
                          <p className="detail-sub">{selectedJob.email} · {selectedJob.phone}</p>
                        </div>
                        <div className="detail-header-actions">
                          {saveIndicator && (
                            <span className={`save-indicator save-indicator--${saveIndicator}`}>
                              {saveIndicator === 'saving' ? 'Saving…' : '✓ Saved'}
                            </span>
                          )}
                          <button className="btn-delete" onClick={() => deleteJob(selectedJob.id)}>
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="detail-section">
                        <div className="detail-section-label">Status</div>
                        <div className="status-pills">
                          {STATUS_OPTIONS.map(s => (
                            <button
                              key={s}
                              className={`status-pill ${(selectedJob.status || 'new') === s ? 'active' : ''}`}
                              style={{ '--pill-color': STATUS_COLORS[s] }}
                              onClick={() => updateJobStatus(selectedJob.id, s)}
                            >
                              {STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="detail-section">
                        <div className="detail-section-label">Job Details</div>
                        <div className="detail-grid">
                          {selectedJob.services && (
                            <>
                              <span className="dg-label">Services</span>
                              <span>
                                {Array.isArray(selectedJob.services)
                                  ? selectedJob.services.join(', ')
                                  : selectedJob.services}
                              </span>
                            </>
                          )}
                          {selectedJob.budget && (
                            <>
                              <span className="dg-label">Budget</span>
                              <span>{selectedJob.budget}</span>
                            </>
                          )}
                          {selectedJob.timeline && (
                            <>
                              <span className="dg-label">Timeline</span>
                              <span>{selectedJob.timeline}</span>
                            </>
                          )}
                          {selectedJob.project_desc && (
                            <>
                              <span className="dg-label">Description</span>
                              <span>{selectedJob.project_desc}</span>
                            </>
                          )}
                          {selectedJob.availability && (
                            <>
                              <span className="dg-label">Availability</span>
                              <span>
                                {Array.isArray(selectedJob.availability)
                                  ? selectedJob.availability.join(', ')
                                  : selectedJob.availability}
                              </span>
                            </>
                          )}
                          <span className="dg-label">Submitted</span>
                          <span>{formatDate(selectedJob.created_at)}</span>
                        </div>
                      </div>

                      {/* Job Files */}
                      {selectedJob.contact_submission_files?.length > 0 && (
                        <div className="detail-section">
                          <div className="detail-section-label">
                            Attached Files ({selectedJob.contact_submission_files.length})
                          </div>
                          <div className="adm-doc-list" style={{ marginTop: '8px' }}>
                            {selectedJob.contact_submission_files.map(file => (
                              <SignedFileLink
                                key={file.id || file.file_path}
                                filePath={file.file_path}
                                defaultBucket="submissions-files"
                                fileName={file.file_name}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="detail-section">
                        <div className="detail-section-label">
                          Assign Contractor
                          <span className="autosave-hint">autosaves on change</span>
                        </div>
                        {approvedContractors.length === 0
                          ? <p className="detail-hint">No approved contractors yet.</p>
                          : (
                            <select
                              className="admin-select"
                              value={assignContractorId}
                              onChange={e => setAssignContractorId(e.target.value)}
                            >
                              <option value="">— Unassigned —</option>
                              {approvedContractors.map(c => {
                                const cid = c.user_id || c.id;
                                const cName = c.full_name || c.name || 'Contractor';
                                return (
                                  <option key={cid} value={cid}>
                                    {cName} · {c.business || c.email}
                                  </option>
                                );
                              })}
                            </select>
                          )
                        }
                        {selectedJob.assigned_contractor_name && (
                          <p className="detail-hint" style={{ marginTop: 6 }}>
                            Currently: <strong>{selectedJob.assigned_contractor_name}</strong>
                          </p>
                        )}
                      </div>

                      <div className="detail-section">
                        <div className="detail-section-label">
                          Admin Notes
                          <span className="autosave-hint">autosaves on change</span>
                        </div>
                        <textarea
                          className="admin-textarea"
                          value={jobNote}
                          onChange={e => setJobNote(e.target.value)}
                          placeholder="Add internal notes about this job…"
                          rows={4}
                        />
                      </div>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        )}

        {/* ════ CONTRACTORS VIEW ════ */}
        {view === 'contractors' && (
          <div className="admin-view">
            <div className="admin-view-header">
              <div>
                <h1 className="admin-view-title">Contractors</h1>
                <p className="admin-view-sub">ProServices applications &amp; approvals</p>
              </div>
              <div className="stat-chips">
                <div className="stat-chip" style={{ '--chip-color': '#c8953a' }}>
                  <span>{contractorStats.pending}</span> Pending
                </div>
                <div className="stat-chip" style={{ '--chip-color': '#2d8a5e' }}>
                  <span>{contractorStats.approved}</span> Approved
                </div>
              </div>
            </div>

            {/* Contractor Toolbar */}
            <div className="contractor-toolbar">
              <div className="contractor-search-wrap">
                <Icon d={Icons.search} size={15} />
                <input
                  className="contractor-search"
                  type="text"
                  placeholder="Search by name, business, email, area…"
                  value={contractorSearch}
                  onChange={e => setContractorSearch(e.target.value)}
                />
                {contractorSearch && (
                  <button className="search-clear" onClick={() => setContractorSearch('')}>
                    <Icon d={Icons.x} size={13} />
                  </button>
                )}
              </div>

              <div className="contractor-filters">
                <div className="filter-pill-group">
                  {['all', 'approved', 'pending'].map(s => (
                    <button
                      key={s}
                      className={`filter-pill ${filterStatus === s ? 'active' : ''}`}
                      onClick={() => setFilterStatus(s)}
                    >
                      {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                {allProfessions.length > 0 && (
                  <select
                    className="admin-select admin-select--sm"
                    value={filterProfession}
                    onChange={e => setFilterProfession(e.target.value)}
                  >
                    <option value="all">All Trades</option>
                    {allProfessions.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                )}

                <div className="sort-wrap">
                  <Icon d={Icons.sort} size={14} />
                  <select
                    className="admin-select admin-select--sm"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {hasActiveFilters && (
                  <button className="btn-clear-filters" onClick={clearContractorFilters}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="contractor-results-meta">
              {filteredContractors.length} of {contractors.length} contractor{contractors.length !== 1 ? 's' : ''}
              {hasActiveFilters && ' (filtered)'}
            </div>

            <div className="admin-split">
              {/* Contractor List */}
              <div className="admin-list">
                {contractorsLoading
                  ? <div className="admin-loading">Loading contractors…</div>
                  : filteredContractors.length === 0
                    ? (
                      <div className="admin-empty">
                        {hasActiveFilters ? 'No contractors match your filters.' : 'No applications yet.'}
                        {hasActiveFilters && (
                          <button className="btn-text" onClick={clearContractorFilters}>Clear filters</button>
                        )}
                      </div>
                    )
                    : filteredContractors.map(c => {
                      const cid = c.user_id || c.id;
                      const cName = c.full_name || c.name || 'Contractor Application';
                      const isSelected = (selectedContractor?.user_id || selectedContractor?.id) === cid;

                      return (
                        <div
                          key={cid}
                          className={`admin-list-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => openContractor(c)}
                        >
                          <div className="list-item-top">
                            <span className="list-item-name">{cName}</span>
                            <span
                              className="list-item-status"
                              style={{ color: c.approved ? '#3a9c6b' : '#c8953a' }}
                            >
                              {c.approved ? 'Approved' : 'Pending'}
                            </span>
                          </div>
                          <div className="list-item-meta">
                            <span>{c.business || c.email}</span>
                            <span>{formatDate(c.created_at)}</span>
                          </div>
                          {c.professions?.length > 0 && (
                            <div className="list-item-tags">
                              {(Array.isArray(c.professions) ? c.professions : [c.professions])
                                .slice(0, 2)
                                .map(p => <span key={p} className="list-tag">{p}</span>)
                              }
                              {(Array.isArray(c.professions) ? c.professions : [c.professions]).length > 2 && (
                                <span className="list-tag list-tag--more">
                                  +{(Array.isArray(c.professions) ? c.professions : [c.professions]).length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                }
              </div>

              {/* Contractor Detail */}
              <div className="admin-detail">
                {!selectedContractor
                  ? <div className="admin-detail-empty">Select a contractor to view details</div>
                  : (
                    <div className="detail-content">
                      <div className="detail-header">
                        <div>
                          <h2 className="detail-title">
                            {selectedContractor.full_name || selectedContractor.name || 'Contractor Details'}
                          </h2>
                          <p className="detail-sub">
                            {selectedContractor.business || '—'} · {selectedContractor.email}
                          </p>
                        </div>
                        <span
                          className="detail-badge"
                          style={{
                            background: selectedContractor.approved
                              ? 'rgba(58,156,107,0.12)'
                              : 'rgba(200,149,58,0.12)',
                            color: selectedContractor.approved ? '#3a9c6b' : '#c8953a',
                            border: `1px solid ${selectedContractor.approved ? '#3a9c6b' : '#c8953a'}`,
                          }}
                        >
                          {selectedContractor.approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>

                      <div className="detail-section">
                        <div className="detail-section-label">Approval</div>
                        <div className="assign-row">
                          {!selectedContractor.approved
                            ? (
                              <button
                                className="btn-approve"
                                onClick={() => approveContractor(selectedContractor.user_id || selectedContractor.id)}
                              >
                                Approve Contractor
                              </button>
                            )
                            : (
                              <button
                                className="btn-revoke"
                                onClick={() => revokeContractor(selectedContractor.user_id || selectedContractor.id)}
                              >
                                Revoke Approval
                              </button>
                            )
                          }
                        </div>
                      </div>

                      <div className="detail-section">
                        <div className="detail-section-label">Profile</div>
                        <div className="detail-grid">
                          <span className="dg-label">Phone</span>
                          <span>{selectedContractor.phone || '—'}</span>
                          <span className="dg-label">Service Area</span>
                          <span>{selectedContractor.service_area || '—'}</span>
                          <span className="dg-label">Specialty</span>
                          <span>{selectedContractor.years_exp || selectedContractor.specialty || '—'}</span>
                          <span className="dg-label">Website</span>
                          <span>{selectedContractor.website || '—'}</span>
                          <span className="dg-label">Applied</span>
                          <span>{formatDate(selectedContractor.created_at)}</span>
                        </div>
                      </div>

                      {selectedContractor.professions?.length > 0 && (
                        <div className="detail-section">
                          <div className="detail-section-label">Professions</div>
                          <div className="list-item-tags" style={{ marginTop: 8 }}>
                            {(Array.isArray(selectedContractor.professions)
                              ? selectedContractor.professions
                              : [selectedContractor.professions]
                            ).map(p => <span key={p} className="list-tag">{p}</span>)}
                          </div>
                        </div>
                      )}

                      {selectedContractor.availability?.length > 0 && (
                        <div className="detail-section">
                          <div className="detail-section-label">Availability</div>
                          <div className="list-item-tags" style={{ marginTop: 8 }}>
                            {(Array.isArray(selectedContractor.availability)
                              ? selectedContractor.availability
                              : [selectedContractor.availability]
                            ).map(a => <span key={a} className="list-tag">{a}</span>)}
                          </div>
                        </div>
                      )}

                      {/* Contractor Documents */}
                      {selectedContractor.professional_submissions_files?.length > 0 && (
                        <div className="detail-section">
                          <div className="detail-section-label">
                            Uploaded Documents &amp; Licenses ({selectedContractor.professional_submissions_files.length})
                          </div>
                          <div className="adm-doc-list" style={{ marginTop: '8px' }}>
                            {selectedContractor.professional_submissions_files.map(file => (
                              <SignedFileLink
                                key={file.id || file.file_path}
                                filePath={file.file_path}
                                defaultBucket="submissions-files"
                                fileName={file.file_name || 'Document'}
                                fileType={file.file_type}
                                uploadedAt={file.created_at}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="detail-section">
                        <div className="detail-section-label">Assigned Jobs</div>
                        {jobs.filter(j => j.assigned_contractor_id === (selectedContractor.user_id || selectedContractor.id)).length === 0
                          ? <p className="detail-hint">No jobs assigned yet.</p>
                          : jobs
                            .filter(j => j.assigned_contractor_id === (selectedContractor.user_id || selectedContractor.id))
                            .map(j => (
                              <div
                                key={j.id}
                                className="assigned-job-row"
                                onClick={() => { setView('jobs'); openJob(j); }}
                              >
                                <span>{j.name}</span>
                                <span style={{ color: STATUS_COLORS[j.status || 'new'], fontSize: '0.75rem' }}>
                                  {STATUS_LABELS[j.status || 'new']}
                                </span>
                              </div>
                            ))
                        }
                      </div>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}