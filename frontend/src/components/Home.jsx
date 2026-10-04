import { ArrowRight, Brain, Building2, FileSearch, MapPin, Rocket, Users } from "lucide-react";
import JobSearch from "./JobSearch.jsx";
import JobCard from "./JobCard.jsx";
import { EmptyState, ErrorBox, Loader } from "./States.jsx";

// Landing page: hero + search, latest jobs, AI Resume Analyzer promo, statistics.
export default function Home({ filters, onSearch, latestJobs, loading, error, onRetry, stats, onOpenJob, setPage }) {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <span className="pill"><Rocket size={14} /> AI-powered job matching</span>
          <h1>Find the job that <span className="gradient-text">matches your skills</span></h1>
          <p>Search jobs, analyze your resume and see exactly which skills you have and which you are missing - explained, not guessed.</p>
          <JobSearch filters={filters} onSearch={onSearch} />
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Latest jobs</h2>
          <button className="link" onClick={() => setPage("jobs")}>View all jobs <ArrowRight size={14} /></button>
        </div>
        {error && <ErrorBox message={error} onRetry={onRetry} />}
        {loading && <Loader text="Loading latest jobs..." />}
        {!loading && !error && latestJobs.length === 0 && <EmptyState title="No jobs yet" text="Recruiters can post the first job." />}
        <div className="grid-3">
          {latestJobs.map((job) => <JobCard key={job.id} job={job} onView={onOpenJob} />)}
        </div>
      </section>

      <section className="container section">
        <div className="promo card">
          <div>
            <span className="pill"><Brain size={14} /> AI Resume Analyzer</span>
            <h2>Know your resume before recruiters do</h2>
            <ul className="ticks">
              <li>Detects 30 technical skills from your resume text</li>
              <li>Groups them into Frontend, Backend, Database, Cloud and AI/Data</li>
              <li>Gives clear tips to improve your resume</li>
              <li>Calculates a match score for every job</li>
            </ul>
            <button className="btn btn-primary" onClick={() => setPage("analyzer")}><FileSearch size={16} /> Analyze my resume</button>
          </div>
          <div className="promo-visual">
            <div className="mini-score">83%</div>
            <p>Strong Match</p>
            <small>5 of 6 required skills found</small>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="stat-grid">
          <div className="card stat"><Rocket size={22} /><strong>{stats ? stats.total_jobs : "-"}</strong><span>Open jobs</span></div>
          <div className="card stat"><Building2 size={22} /><strong>{stats ? stats.total_companies : "-"}</strong><span>Companies hiring</span></div>
          <div className="card stat"><MapPin size={22} /><strong>{stats ? stats.total_locations : "-"}</strong><span>Cities</span></div>
          <div className="card stat"><Users size={22} /><strong>{stats ? stats.total_applications : "-"}</strong><span>Applications</span></div>
        </div>
      </section>
    </>
  );
}
