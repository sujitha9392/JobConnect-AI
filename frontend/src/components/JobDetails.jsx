import { useEffect, useState } from "react";
import { Brain, Building2, CheckCircle2, Clock, Loader2, MapPin, Send, Wallet } from "lucide-react";
import Modal from "./Modal.jsx";
import SkillBadge from "./SkillBadge.jsx";
import ScoreRing from "./ScoreRing.jsx";
import { ErrorBox, Loader } from "./States.jsx";
import { applyToJob, getJob, matchJob } from "../api.js";
import { levelClass } from "../constants.js";

// Pop-up with full job details, the AI Match feature and the Apply form.
export default function JobDetails({ jobId, profile, onProfileChange, onClose, notify, onApplied }) {
  const [job, setJob] = useState(null);
  const [loadError, setLoadError] = useState("");

  // AI match state
  const [resume, setResume] = useState(profile.resume || "");
  const [match, setMatch] = useState(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState("");

  // Apply form state
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ name: profile.name || "", email: profile.email || "" });
  const [formError, setFormError] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // Load the job when the dialog opens (handles an invalid job id too).
  useEffect(() => {
    setJob(null);
    setLoadError("");
    getJob(jobId).then(setJob).catch((err) => setLoadError(err.message));
  }, [jobId]);

  const runMatch = async () => {
    setMatchError("");
    if (resume.trim().length < 20) {
      setMatchError("Paste your resume text (at least 20 characters) to run the AI match.");
      return;
    }
    setMatching(true);
    try {
      setMatch(await matchJob(resume, job.id));
      onProfileChange({ ...profile, resume }); // remember resume for next time
    } catch (err) {
      setMatchError(err.message);
    } finally {
      setMatching(false);
    }
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setFormError("");
    if (form.name.trim().length < 2) return setFormError("Please enter your full name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return setFormError("Please enter a valid email address.");
    if (resume.trim().length < 20) return setFormError("Please paste your resume text (at least 20 characters).");

    setApplying(true);
    try {
      await applyToJob({
        candidate_name: form.name.trim(),
        email: form.email.trim(),
        resume_text: resume.trim(),
        job_id: job.id,
      });
      onProfileChange({ name: form.name.trim(), email: form.email.trim().toLowerCase(), resume });
      setApplied(true);
      notify("success", `Application sent to ${job.company}!`);
      onApplied && onApplied();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Modal title="Job details" onClose={onClose} wide>
      {loadError && <ErrorBox message={loadError} />}
      {!job && !loadError && <Loader text="Loading job..." />}

      {job && (
        <div className="details">
          <div className="details-head">
            <div className="company-logo big">{job.company.charAt(0)}</div>
            <div>
              <h2>{job.title}</h2>
              <p className="muted"><Building2 size={15} /> {job.company}</p>
            </div>
          </div>

          <div className="job-meta">
            <span><MapPin size={14} /> {job.location}</span>
            <span><Clock size={14} /> {job.job_type}</span>
            <span><Wallet size={14} /> {job.salary}</span>
          </div>

          <h4>Description</h4>
          <p className="description">{job.description}</p>

          <h4>Required skills</h4>
          <div className="badges">
            {job.skills.map((s) => (
              <SkillBadge key={s} name={s} />
            ))}
          </div>

          {/* ---------- Resume + AI Match ---------- */}
          <div className="panel">
            <h4><Brain size={18} /> Check your fit with AI</h4>
            <textarea
              rows={5}
              placeholder="Paste your resume text here..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
            {matchError && <ErrorBox message={matchError} />}

            <div className="btn-row">
              <button className="btn btn-outline" onClick={runMatch} disabled={matching}>
                {matching ? <Loader2 className="spin" size={16} /> : <Brain size={16} />} AI Match
              </button>
              {!applied && (
                <button className="btn btn-primary" onClick={() => setShowApply(!showApply)}>
                  <Send size={16} /> Apply Now
                </button>
              )}
            </div>

            {match && (
              <div className="match-result">
                <ScoreRing score={match.match_score} />
                <div className="match-info">
                  <span className={`level level-${levelClass(match.level)}`}>{match.level}</span>
                  <p className="recommendation">{match.recommendation}</p>
                  <p className="muted small">{match.explanation}</p>

                  <h5>Matched skills ({match.matched_skills.length})</h5>
                  <div className="badges">
                    {match.matched_skills.length === 0 && <span className="muted small">None</span>}
                    {match.matched_skills.map((s) => <SkillBadge key={s} name={s} variant="matched" />)}
                  </div>

                  <h5>Missing skills ({match.missing_skills.length})</h5>
                  <div className="badges">
                    {match.missing_skills.length === 0 && <span className="muted small">None - you have everything!</span>}
                    {match.missing_skills.map((s) => <SkillBadge key={s} name={s} variant="missing" />)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ---------- Apply form ---------- */}
          {applied && (
            <div className="alert alert-success">
              <CheckCircle2 size={18} />
              <span>Application submitted with status "Applied". Track it under My Applications.</span>
            </div>
          )}

          {showApply && !applied && (
            <form className="panel form" onSubmit={submitApplication} noValidate>
              <h4>Apply for this job</h4>
              <div className="form-row">
                <label>
                  Full name
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                </label>
                <label>
                  Email
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                </label>
              </div>
              <p className="muted small">Your resume text from the box above will be submitted.</p>
              {formError && <ErrorBox message={formError} />}
              <button className="btn btn-primary" type="submit" disabled={applying}>
                {applying ? <Loader2 className="spin" size={16} /> : <Send size={16} />} Submit application
              </button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
