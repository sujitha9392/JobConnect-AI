import { useCallback, useEffect, useState } from "react";
import { Briefcase, CheckCircle2, Sparkles, UserCircle } from "lucide-react";
import JobCard from "./JobCard.jsx";
import ScoreRing from "./ScoreRing.jsx";
import { EmptyState, ErrorBox, Loader } from "./States.jsx";
import { getApplications, recommendJobs } from "../api.js";
import { STATUSES } from "../constants.js";

// Candidate dashboard: my applications, status counts, AI scores, recommended jobs.
// (No login to keep things simple: the candidate is identified by the email saved in the browser.)
export default function CandidateDashboard({ profile, onProfileChange, onOpenJob, setPage, refreshKey }) {
  const [applications, setApplications] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [identity, setIdentity] = useState({ name: profile.name || "", email: profile.email || "" });
  const [identityError, setIdentityError] = useState("");

  const load = useCallback(async () => {
    if (!profile.email) return;
    setLoading(true);
    setError("");
    try {
      const apps = await getApplications({ email: profile.email });
      setApplications(apps);
      if (profile.resume && profile.resume.length >= 20) {
        setRecommended((await recommendJobs(profile.resume)).slice(0, 3));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile.email, profile.resume]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const saveIdentity = (e) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identity.email.trim())) {
      setIdentityError("Enter the email you used to apply.");
      return;
    }
    setIdentityError("");
    onProfileChange({ ...profile, name: identity.name.trim(), email: identity.email.trim().toLowerCase() });
  };

  // Step 1 - ask for email if we do not know the candidate yet
  if (!profile.email) {
    return (
      <section className="container page narrow">
        <div className="page-head">
          <h1><UserCircle size={26} /> Candidate dashboard</h1>
          <p>Enter your name and the email you use for applications to see your dashboard.</p>
        </div>
        <form className="card form" onSubmit={saveIdentity} noValidate>
          <label>Name
            <input value={identity.name} onChange={(e) => setIdentity({ ...identity, name: e.target.value })} placeholder="Your name" />
          </label>
          <label>Email
            <input type="email" value={identity.email} onChange={(e) => setIdentity({ ...identity, email: e.target.value })} placeholder="you@example.com" />
          </label>
          {identityError && <ErrorBox message={identityError} />}
          <button className="btn btn-primary" type="submit">Open my dashboard</button>
        </form>
      </section>
    );
  }

  const countByStatus = (status) => applications.filter((a) => a.status === status).length;
  const average = applications.length
    ? Math.round(applications.reduce((sum, a) => sum + a.match_score, 0) / applications.length)
    : 0;

  return (
    <section className="container page">
      <div className="page-head row">
        <div>
          <h1>Hello{profile.name ? `, ${profile.name.split(" ")[0]}` : ""} 👋</h1>
          <p>{profile.email}</p>
        </div>
        <button className="btn btn-outline" onClick={() => onProfileChange({ name: "", email: "", resume: profile.resume })}>
          Switch user
        </button>
      </div>

      {error && <ErrorBox message={error} onRetry={load} />}
      {loading && <Loader text="Loading your dashboard..." />}

      {!loading && (
        <>
          <div className="stat-grid">
            <div className="card stat"><Briefcase size={22} /><strong>{applications.length}</strong><span>Applications</span></div>
            <div className="card stat"><Sparkles size={22} /><strong>{average}%</strong><span>Average AI match</span></div>
            <div className="card stat"><CheckCircle2 size={22} /><strong>{countByStatus("Interview") + countByStatus("Shortlisted")}</strong><span>Shortlisted / Interview</span></div>
            <div className="card stat"><CheckCircle2 size={22} /><strong>{countByStatus("Selected")}</strong><span>Selected</span></div>
          </div>

          <div className="status-strip">
            {STATUSES.map((s) => (
              <span key={s} className={`status status-${s.toLowerCase()}`}>{s}: {countByStatus(s)}</span>
            ))}
          </div>

          <h2>Applied jobs</h2>
          {applications.length === 0 ? (
            <EmptyState
              title="No applications yet"
              text="Find a job you like and click Apply Now."
              action={<button className="btn btn-primary" onClick={() => setPage("jobs")}>Browse jobs</button>}
            />
          ) : (
            <div className="app-list">
              {applications.map((a) => (
                <div className="card app-row" key={a.id}>
                  <ScoreRing score={a.match_score} size={72} />
                  <div className="app-info">
                    <h4>{a.job_title}</h4>
                    <p className="muted">{a.job_company} · Applied {new Date(a.created_at + "Z").toLocaleDateString()}</p>
                  </div>
                  <span className={`status status-${a.status.toLowerCase()}`}>{a.status}</span>
                  <button className="btn btn-small btn-outline" onClick={() => onOpenJob(a.job_id)}>View job</button>
                </div>
              ))}
            </div>
          )}

          <div className="section">
            <h2>Recommended jobs for you</h2>
            {recommended.length === 0 ? (
              <EmptyState
                title="No recommendations yet"
                text="Analyze your resume to get AI-matched jobs."
                action={<button className="btn btn-primary" onClick={() => setPage("analyzer")}>Open AI Resume Analyzer</button>}
              />
            ) : (
              <div className="grid-3">
                {recommended.map((r) => (
                  <JobCard key={r.job.id} job={r.job} score={r.match_score} onView={onOpenJob} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
