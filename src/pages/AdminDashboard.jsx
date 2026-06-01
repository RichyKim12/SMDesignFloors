import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './AdminDashboard.css';

// ── icons (same helper as ContractorDashboard) ─────────────
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
  jobs:     'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',
  contractors: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  logout:   'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
};

const STATUS_OPTIONS = ['new', 'in_progress', 'completed'];
const STATUS_LABELS  = { new: 'New', in_progress: 'In Progress', completed: 'Completed' };
const STATUS_COLORS  = { new: '#c8953a', in_progress: '#4a7fb5', completed: '#2d8a5e' };

export default function AdminDashboard() {
  const location     = useLocation();
  const navigate     = useNavigate();
  const [view, setView] = useState('jobs'); // 'jobs' | 'contractors'

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobNote, setJobNote] = useState('');
  const [assignContractorId, setAssignContractorId] = useState('');

  // Contractors state
  const [contractors, setContractors] = useState([]);
  const [contractorsLoading, setContractorsLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState(null);

  // Approved contractors for assignment dropdown
  const [approvedContractors, setApprovedContractors] = useState([]);

  useEffect(() => { fetchJobs(); fetchContractors(); }, []);

  const fetchJobs = async () => {
    setJobsLoading(true);
    const { data } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    setJobs(data || []);
    setJobsLoading(false);
  };

  const fetchContractors = async () => {
    setContractorsLoading(true);
    const { data } = await supabase
      .from('professional_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    setContractors(data || []);
    setApprovedContractors((data || []).filter(c => c.approved));
    setContractorsLoading(false);
  };

  const approveContractor = async (id) => {
    await supabase.from('professional_submissions').update({ approved: true }).eq('id', id);
    fetchContractors();
    if (selectedContractor?.id === id)
      setSelectedContractor(prev => ({ ...prev, approved: true }));
  };

  const revokeContractor = async (id) => {
    await supabase.from('professional_submissions').update({ approved: false }).eq('id', id);
    fetchContractors();
    if (selectedContractor?.id === id)
      setSelectedContractor(prev => ({ ...prev, approved: false }));
  };

  const updateJobStatus = async (id, status) => {
    await supabase.from('contact_submissions').update({ status }).eq('id', id);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
    if (selectedJob?.id === id) setSelectedJob(prev => ({ ...prev, status }));
  };

  const saveJobNote = async () => {
    await supabase
      .from('contact_submissions')
      .update({ admin_notes: jobNote })
      .eq('id', selectedJob.id);
    setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, admin_notes: jobNote } : j));
    setSelectedJob(prev => ({ ...prev, admin_notes: jobNote }));
  };

  const assignJob = async () => {
    const contractor = approvedContractors.find(c => c.id === assignContractorId);
    await supabase
      .from('contact_submissions')
      .update({
        assigned_contractor_id: assignContractorId,
        assigned_contractor_name: contractor?.name || '',
      })
      .eq('id', selectedJob.id);
    setJobs(prev => prev.map(j =>
      j.id === selectedJob.id
        ? { ...j, assigned_contractor_id: assignContractorId, assigned_contractor_name: contractor?.name }
        : j
    ));
    setSelectedJob(prev => ({
      ...prev,
      assigned_contractor_id: assignContractorId,
      assigned_contractor_name: contractor?.name,
    }));
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
  };

  const openContractor = (c) => setSelectedContractor(c);

  const handleSignOut = async () => {
    console.log('hello')
    await supabase.auth.signOut();
    // setRole(null);
    navigate('/');
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const jobStats = {
    total:      jobs.length,
    new:        jobs.filter(j => !j.status || j.status === 'new').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed:  jobs.filter(j => j.status === 'completed').length,
  };

  const contractorStats = {
    total:    contractors.length,
    approved: contractors.filter(c => c.approved).length,
    pending:  contractors.filter(c => !c.approved).length,
  };

  return (
    <div className="admin-root">

      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">

        {/* Brand — mirrors cd-sidebar-top */}
        <div className="admin-brand">
          <div className="admin-brand-sm">SM</div>
          <div className="admin-brand-text">Design Floors</div>
          <div className="admin-brand-tag">Admin</div>
        </div>

        {/* Nav — mirrors cd-sidebar-footer nav buttons */}
        <nav className="admin-nav">
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
        </nav>

        {/* Footer — stats + sign out */}
        <div className="admin-sidebar-footer">
          <div className="sidebar-stats-row">
            <div className="sidebar-stat">
              <span className="sidebar-stat-val">{jobStats.total}</span>
              <span className="sidebar-stat-label">Jobs</span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-val">{contractorStats.approved}</span>
              <span className="sidebar-stat-label">Contractors</span>
            </div>
          </div>

          <button className="btn-sign-out" onClick={handleSignOut}>
            <Icon d={Icons.logout} size={15} />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>

      {/* ── Main ── */}
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

            <div className="admin-split">
              {/* Job list */}
              <div className="admin-list">
                {jobsLoading
                  ? <div className="admin-loading">Loading jobs…</div>
                  : jobs.length === 0
                    ? <div className="admin-empty">No jobs yet.</div>
                    : jobs.map(job => (
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

              {/* Job detail */}
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
                        <button className="btn-delete" onClick={() => deleteJob(selectedJob.id)}>
                          Delete
                        </button>
                      </div>

                      {/* Status */}
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

                      {/* Job info */}
                      <div className="detail-section">
                        <div className="detail-section-label">Job Details</div>
                        <div className="detail-grid">
                          {selectedJob.services && (
                            <>
                              <span className="dg-label">Services</span>
                              <span>{Array.isArray(selectedJob.services) ? selectedJob.services.join(', ') : selectedJob.services}</span>
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

                      {/* Assign contractor */}
                      <div className="detail-section">
                        <div className="detail-section-label">Assign Contractor</div>
                        {approvedContractors.length === 0
                          ? <p className="detail-hint">No approved contractors yet.</p>
                          : (
                            <div className="assign-row">
                              <select
                                className="admin-select"
                                value={assignContractorId}
                                onChange={e => setAssignContractorId(e.target.value)}
                              >
                                <option value="">— Unassigned —</option>
                                {approvedContractors.map(c => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} · {c.business || c.email}
                                  </option>
                                ))}
                              </select>
                              <button className="btn-primary" onClick={assignJob}>Save</button>
                            </div>
                          )
                        }
                        {selectedJob.assigned_contractor_name && (
                          <p className="detail-hint" style={{ marginTop: 6 }}>
                            Currently: <strong>{selectedJob.assigned_contractor_name}</strong>
                          </p>
                        )}
                      </div>

                      {/* Admin notes */}
                      <div className="detail-section">
                        <div className="detail-section-label">Admin Notes</div>
                        <textarea
                          className="admin-textarea"
                          value={jobNote}
                          onChange={e => setJobNote(e.target.value)}
                          placeholder="Add internal notes about this job…"
                          rows={4}
                        />
                        <button className="btn-primary" style={{ marginTop: 8 }} onClick={saveJobNote}>
                          Save Notes
                        </button>
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

            <div className="admin-split">
              {/* Contractor list */}
              <div className="admin-list">
                {contractorsLoading
                  ? <div className="admin-loading">Loading contractors…</div>
                  : contractors.length === 0
                    ? <div className="admin-empty">No applications yet.</div>
                    : contractors.map(c => (
                      <div
                        key={c.id}
                        className={`admin-list-item ${selectedContractor?.id === c.id ? 'selected' : ''}`}
                        onClick={() => openContractor(c)}
                      >
                        <div className="list-item-top">
                          <span className="list-item-name">{c.name}</span>
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
                              .map(p => (
                                <span key={p} className="list-tag">{p}</span>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    ))
                }
              </div>

              {/* Contractor detail */}
              <div className="admin-detail">
                {!selectedContractor
                  ? <div className="admin-detail-empty">Select a contractor to view details</div>
                  : (
                    <div className="detail-content">
                      <div className="detail-header">
                        <div>
                          <h2 className="detail-title">{selectedContractor.name}</h2>
                          <p className="detail-sub">
                            {selectedContractor.business || '—'} · {selectedContractor.email}
                          </p>
                        </div>
                        <span
                          className="detail-badge"
                          style={{
                            background: selectedContractor.approved ? 'rgba(58,156,107,0.12)' : 'rgba(200,149,58,0.12)',
                            color:      selectedContractor.approved ? '#3a9c6b' : '#c8953a',
                            border:     `1px solid ${selectedContractor.approved ? '#3a9c6b' : '#c8953a'}`,
                          }}
                        >
                          {selectedContractor.approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>

                      {/* Approve / Revoke */}
                      <div className="detail-section">
                        <div className="detail-section-label">Approval</div>
                        <div className="assign-row">
                          {!selectedContractor.approved
                            ? <button className="btn-approve" onClick={() => approveContractor(selectedContractor.id)}>
                                Approve Contractor
                              </button>
                            : <button className="btn-revoke" onClick={() => revokeContractor(selectedContractor.id)}>
                                Revoke Approval
                              </button>
                          }
                        </div>
                      </div>

                      {/* Contractor info */}
                      <div className="detail-section">
                        <div className="detail-section-label">Profile</div>
                        <div className="detail-grid">
                          <span className="dg-label">Phone</span>
                          <span>{selectedContractor.phone || '—'}</span>
                          <span className="dg-label">Service Area</span>
                          <span>{selectedContractor.service_area || '—'}</span>
                          <span className="dg-label">Specialty</span>
                          <span>{selectedContractor.years_exp || '—'}</span>
                          <span className="dg-label">Website</span>
                          <span>{selectedContractor.website || '—'}</span>
                          <span className="dg-label">Applied</span>
                          <span>{formatDate(selectedContractor.created_at)}</span>
                        </div>
                      </div>

                      {/* Professions */}
                      {selectedContractor.professions?.length > 0 && (
                        <div className="detail-section">
                          <div className="detail-section-label">Professions</div>
                          <div className="list-item-tags" style={{ marginTop: 8 }}>
                            {(Array.isArray(selectedContractor.professions)
                              ? selectedContractor.professions
                              : [selectedContractor.professions]
                            ).map(p => (
                              <span key={p} className="list-tag">{p}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Availability */}
                      {selectedContractor.availability?.length > 0 && (
                        <div className="detail-section">
                          <div className="detail-section-label">Availability</div>
                          <div className="list-item-tags" style={{ marginTop: 8 }}>
                            {(Array.isArray(selectedContractor.availability)
                              ? selectedContractor.availability
                              : [selectedContractor.availability]
                            ).map(a => (
                              <span key={a} className="list-tag">{a}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assigned jobs */}
                      <div className="detail-section">
                        <div className="detail-section-label">Assigned Jobs</div>
                        {jobs.filter(j => j.assigned_contractor_id === selectedContractor.id).length === 0
                          ? <p className="detail-hint">No jobs assigned yet.</p>
                          : jobs
                              .filter(j => j.assigned_contractor_id === selectedContractor.id)
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