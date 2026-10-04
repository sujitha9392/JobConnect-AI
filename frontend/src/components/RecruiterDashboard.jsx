import { useCallback, useEffect, useState } from "react";
import { Briefcase, Eye, Pencil, Plus, Trash2, Users } from "lucide-react";
import Modal from "./Modal.jsx";
import SkillBadge from "./SkillBadge.jsx";
import { EmptyState, ErrorBox, Loader } from "./States.jsx";
import { deleteJob, getApplications, getJobs, getStats, updateApplicationStatus } from "../api.js";
import { STATUSES } from "../constants.js";

// Recruiter dashboard: stats, posted jobs (Edit / Delete), and candidates per job (update status).
export default function RecruiterDashboard({ onEdit, onOpenJob, setPage, notify }) {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [jobToDelete, setJobToDelete] = useState(null);   // job waiting for delete confirmation
  const [candidatesJob, setCandidatesJob] = useState(null); // job whose candidates are shown
  const [openResume, setOpenResume] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [j, a, s] = await Promise.all([getJobs(), getApplications(), getStats()]);
      setJobs(j);
      setApplications(a);
      setStats(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    try {
      await deleteJob(jobToDelete.id);
      notify("success", "Job deleted");
      setJobToDelete(null);
      load();
    } catch (err) {
      notify("error", err.message);
      setJobToDelete(null);
    }
  };

  const changeStatus = async (application, status) => {
    try {
      const updated = await updateApplicationStatus(application.id, status);
      setApplications((list) => list.map((a) => (a.id === updated.id ? updated : a)));
      notify("success", `Status changed to ${status}`);
      getStats().then(setStats).catch(() => {});
    } catch (err) {
      notify("error", err.message);
    }
  };

  const applicantCount = (jobId) => applications.filter((a) => a.job_id === jobId).length;
  const candidates = candidatesJob ? applications.filter((a) => a.job_id === candidatesJob.id) : [];

  return (
    <section className="container page">
      <div className="page-head row">
        <div>
          <h1>Recruiter dashboard</h1>
          <p>Manage your job postings and review candidates.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setPage("post")}><Plus size={16} /> Post a job</button>
      </div>

      {error && <ErrorBox message={error} onRetry={load} />}
      {loading && <Loader text="Loading dashboard..." />}

      {!loading && !error && stats && (
        <>
          <div className="stat-grid">
            <div className="card stat"><Briefcase size={22} /><strong>{stats.total_jobs}</strong><span>Posted jobs</span></div>
            <div className="card stat"><Users size={22} /><strong>{stats.total_applications}</strong><span>Total applications</span></div>
            <div className="card stat"><Users size={22} /><strong>{stats.applications_by_status.Shortlisted + stats.applications_by_status.Interview}</strong><span>Shortlisted / Interview</span></div>
            <div className="card stat"><Users size={22} /><strong>{stats.applications_by_status.Selected}</strong><span>Selected</span></div>
          </div>

          <div className="status-strip">
            {STATUSES.map((s) => (
              <span key={s} className={`status status-${s.toLowerCase()}`}>{s}: {stats.applications_by_status[s]}</span>
            ))}
          </div>

          <h2>Posted jobs</h2>
          {jobs.length === 0 ? (
            <EmptyState title="No jobs posted" text="Post your first job to start receiving applications." action={<button className="btn btn-primary" onClick={() => setPage("post")}>Post a job</button>} />
          ) : (
            <div className="table-wrap card">
              <table>
                <thead>
                  <tr><th>Job</th><th>Location</th><th>Type</th><th>Applicants</th><th className="right">Actions</th></tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <button className="link" onClick={() => onOpenJob(job.id)}>{job.title}</button>
                        <div className="muted small">{job.company}</div>
                      </td>
                      <td>{job.location}</td>
                      <td>{job.job_type}</td>
                      <td>{applicantCount(job.id)}</td>
                      <td className="right actions">
                        <button className="btn btn-small btn-outline" onClick={() => setCandidatesJob(job)}><Eye size={14} /> Candidates</button>
                        <button className="btn btn-small btn-outline" onClick={() => onEdit(job)}><Pencil size={14} /> Edit</button>
                        <button className="btn btn-small btn-danger" onClick={() => setJobToDelete(job)}><Trash2 size={14} /> Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ---- Delete confirmation ---- */}
      {jobToDelete && (
        <Modal title="Delete job?" onClose={() => setJobToDelete(null)}>
          <p>
            Are you sure you want to delete <strong>{jobToDelete.title}</strong> at {jobToDelete.company}? All
            its applications will also be deleted. This cannot be undone.
          </p>
          <div className="btn-row">
            <button className="btn btn-danger" onClick={confirmDelete}>Yes, delete</button>
            <button className="btn btn-outline" onClick={() => setJobToDelete(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* ---- Candidates for one job ---- */}
      {candidatesJob && (
        <Modal title={`Candidates - ${candidatesJob.title}`} onClose={() => { setCandidatesJob(null); setOpenResume(null); }} wide>
          {candidates.length === 0 ? (
            <EmptyState title="No applications yet" text="Candidates who apply will appear here." />
          ) : (
            <div className="candidate-list">
              {candidates.map((a) => (
                <div className="candidate" key={a.id}>
                  <div className="candidate-top">
                    <div>
                      <strong>{a.candidate_name}</strong>
                      <div className="muted small">{a.email}</div>
                    </div>
                    <span className="score-chip chip-good">{a.match_score}% AI match</span>
                    <select value={a.status} onChange={(e) => changeStatus(a, e.target.value)} aria-label="Application status">
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <button className="link small" onClick={() => setOpenResume(openResume === a.id ? null : a.id)}>
                    {openResume === a.id ? "Hide resume" : "View resume"}
                  </button>
                  {openResume === a.id && <pre className="resume-box">{a.resume_text}</pre>}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </section>
  );
}
