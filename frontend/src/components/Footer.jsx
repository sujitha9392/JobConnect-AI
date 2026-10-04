import { Briefcase } from "lucide-react";

export default function Footer({ setPage }) {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="logo static">
            <span className="logo-mark">
              <Briefcase size={18} />
            </span>
            JobConnect <span className="logo-ai">AI</span>
          </div>
          <p className="footer-text">
            An AI-powered job portal with explainable resume matching. Built with React, FastAPI and SQLite.
          </p>
        </div>
        <div>
          <h5>Candidates</h5>
          <button onClick={() => setPage("jobs")}>Find Jobs</button>
          <button onClick={() => setPage("analyzer")}>AI Resume Analyzer</button>
          <button onClick={() => setPage("candidate")}>My Applications</button>
        </div>
        <div>
          <h5>Recruiters</h5>
          <button onClick={() => setPage("post")}>Post a Job</button>
          <button onClick={() => setPage("recruiter")}>Recruiter Dashboard</button>
        </div>
        <div>
          <h5>Developer</h5>
          <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">API Docs (Swagger)</a>
          <a href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
      <div className="container footer-bottom">© {new Date().getFullYear()} JobConnect AI - Portfolio project</div>
    </footer>
  );
}
