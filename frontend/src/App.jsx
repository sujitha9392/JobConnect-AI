import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./components/Home.jsx";
import JobSearch from "./components/JobSearch.jsx";
import JobCard from "./components/JobCard.jsx";
import JobDetails from "./components/JobDetails.jsx";
import ResumeAnalyzer from "./components/ResumeAnalyzer.jsx";
import PostJob from "./components/PostJob.jsx";
import CandidateDashboard from "./components/CandidateDashboard.jsx";
import RecruiterDashboard from "./components/RecruiterDashboard.jsx";
import { EmptyState, ErrorBox, Loader } from "./components/States.jsx";
import { getJobs, getStats } from "./api.js";

const EMPTY_FILTERS = { search: "", location: "", job_type: "" };
const PROFILE_KEY = "jobconnect-profile";

// Read/save the candidate's name, email and resume in the browser (localStorage).
function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || { name: "", email: "", resume: "" };
  } catch {
    return { name: "", email: "", resume: "" };
  }
}

export default function App() {
  // Which "page" is visible. (Simple state instead of a router - easy to explain.)
  const [page, setPage] = useState("home");
  const [profile, setProfile] = useState(loadProfile);
  const [selectedJobId, setSelectedJobId] = useState(null);   // job details dialog
  const [editingJob, setEditingJob] = useState(null);         // job being edited in PostJob
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);            // bump to reload dashboards

  // Search state shared by the Home hero and the Jobs page
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [stats, setStats] = useState(null);

  // "Latest jobs" on the home page (always unfiltered, newest first)
  const [latestJobs, setLatestJobs] = useState([]);
  const [latestLoading, setLatestLoading] = useState(true);
  const [latestError, setLatestError] = useState("");

  const notify = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const updateProfile = (next) => {
    setProfile(next);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  };

  // Load jobs from the API whenever the filters change.
  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError("");
    try {
      setJobs(await getJobs(filters));
    } catch (err) {
      setJobsError(err.message);
    } finally {
      setJobsLoading(false);
    }
  }, [filters]);

  const loadLatest = useCallback(async () => {
    setLatestLoading(true);
    setLatestError("");
    try {
      setLatestJobs((await getJobs()).slice(0, 6));
    } catch (err) {
      setLatestError(err.message);
    } finally {
      setLatestLoading(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => { loadLatest(); }, [loadLatest, refreshKey]);
  useEffect(() => { getStats().then(setStats).catch(() => {}); }, [refreshKey, page]);

  const runSearch = (next) => {
    setFilters(next);
    setPage("jobs");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goTo = (target) => {
    if (target === "post") setEditingJob(null);
    setPage(target);
  };

  const startEdit = (job) => {
    setEditingJob(job);
    setPage("post");
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="app">
      <Navbar page={page} setPage={goTo} />

      <main>
        {page === "home" && (
          <Home
            filters={filters}
            onSearch={runSearch}
            latestJobs={latestJobs}
            loading={latestLoading}
            error={latestError}
            onRetry={loadLatest}
            stats={stats}
            onOpenJob={setSelectedJobId}
            setPage={goTo}
          />
        )}

        {page === "jobs" && (
          <section className="container page">
            <div className="page-head">
              <h1>Find jobs</h1>
              <p>Search by title, company, skill, location or job type.</p>
            </div>
            <JobSearch filters={filters} onSearch={setFilters} />

            <div className="results-head">
              {!jobsLoading && !jobsError && <strong>{jobs.length} job{jobs.length === 1 ? "" : "s"} found</strong>}
              {(filters.search || filters.location || filters.job_type) && (
                <button className="link" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button>
              )}
            </div>

            {jobsError && <ErrorBox message={jobsError} onRetry={loadJobs} />}
            {jobsLoading && <Loader text="Searching jobs..." />}
            {!jobsLoading && !jobsError && jobs.length === 0 && (
              <EmptyState
                title="No jobs match your search"
                text="Try a different keyword, or clear the filters."
                action={<button className="btn btn-outline" onClick={() => setFilters(EMPTY_FILTERS)}>Show all jobs</button>}
              />
            )}
            <div className="grid-3">
              {!jobsLoading && jobs.map((job) => <JobCard key={job.id} job={job} onView={setSelectedJobId} />)}
            </div>
          </section>
        )}

        {page === "analyzer" && (
          <ResumeAnalyzer profile={profile} onProfileChange={updateProfile} onOpenJob={setSelectedJobId} />
        )}

        {page === "post" && (
          <PostJob
            key={editingJob ? editingJob.id : "new"}
            job={editingJob}
            notify={notify}
            onCancel={editingJob ? () => { setEditingJob(null); setPage("recruiter"); } : null}
            onSaved={() => {
              setEditingJob(null);
              setRefreshKey((k) => k + 1);
              loadJobs();
              setPage("recruiter");
            }}
          />
        )}

        {page === "candidate" && (
          <CandidateDashboard
            profile={profile}
            onProfileChange={updateProfile}
            onOpenJob={setSelectedJobId}
            setPage={goTo}
            refreshKey={refreshKey}
          />
        )}

        {page === "recruiter" && (
          <RecruiterDashboard
            key={refreshKey}
            onEdit={startEdit}
            onOpenJob={setSelectedJobId}
            setPage={goTo}
            notify={(type, msg) => { notify(type, msg); loadJobs(); }}
          />
        )}
      </main>

      <Footer setPage={goTo} />

      {selectedJobId && (
        <JobDetails
          jobId={selectedJobId}
          profile={profile}
          onProfileChange={updateProfile}
          onClose={() => setSelectedJobId(null)}
          notify={notify}
          onApplied={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
