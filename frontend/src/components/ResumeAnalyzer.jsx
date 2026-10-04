import { useState } from "react";
import { Brain, Lightbulb, Loader2, Sparkles } from "lucide-react";
import SkillBadge from "./SkillBadge.jsx";
import JobCard from "./JobCard.jsx";
import { ErrorBox } from "./States.jsx";
import { analyzeResume, recommendJobs } from "../api.js";
import { SAMPLE_RESUME } from "../constants.js";

const CATEGORY_ORDER = ["Frontend", "Backend", "Database", "Cloud/DevOps", "AI/Data"];

// AI Resume Analyzer: paste resume -> detected skills, categories, suggestions, top job matches.
export default function ResumeAnalyzer({ profile, onProfileChange, onOpenJob }) {
  const [text, setText] = useState(profile.resume || "");
  const [result, setResult] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    setError("");
    if (text.trim().length < 20) {
      setError("Please paste your resume text first (at least 20 characters).");
      return;
    }
    setLoading(true);
    try {
      const [analysis, jobs] = await Promise.all([analyzeResume(text), recommendJobs(text)]);
      setResult(analysis);
      setRecommended(jobs.slice(0, 3));
      onProfileChange({ ...profile, resume: text });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container page">
      <div className="page-head">
        <h1><Sparkles size={26} /> AI Resume Analyzer</h1>
        <p>Paste your resume text. We detect your technical skills, group them, and suggest improvements - all locally, no API key needed.</p>
      </div>

      <div className="analyzer-grid">
        <div className="card">
          <textarea
            rows={16}
            value={text}
            placeholder="Paste your resume text here..."
            onChange={(e) => setText(e.target.value)}
          />
          {error && <ErrorBox message={error} />}
          <div className="btn-row">
            <button className="btn btn-primary" onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="spin" size={16} /> : <Brain size={16} />} Analyze resume
            </button>
            <button className="btn btn-outline" onClick={() => setText(SAMPLE_RESUME)}>Use sample resume</button>
          </div>
        </div>

        <div>
          {!result && !loading && (
            <div className="card placeholder">
              <Brain size={40} />
              <h4>Your analysis will appear here</h4>
              <p>Click "Analyze resume" to see detected skills and tips.</p>
            </div>
          )}

          {result && (
            <div className="card">
              <div className="analysis-top">
                <div className="big-number">{result.total_skills}</div>
                <div>
                  <h4>Skills detected</h4>
                  <p className="muted small">Found by matching your text with a catalog of {30} known technologies.</p>
                </div>
              </div>

              <div className="badges">
                {result.detected_skills.length === 0 && <span className="muted">No known skills found.</span>}
                {result.detected_skills.map((s) => <SkillBadge key={s} name={s} variant="matched" />)}
              </div>

              <div className="category-grid">
                {CATEGORY_ORDER.map((cat) => (
                  <div className="category" key={cat}>
                    <div className="category-head">
                      <span>{cat}</span>
                      <strong>{result.categories[cat].length}</strong>
                    </div>
                    <div className="badges">
                      {result.categories[cat].length === 0 && <span className="muted small">-</span>}
                      {result.categories[cat].map((s) => <SkillBadge key={s} name={s} />)}
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="with-icon"><Lightbulb size={18} /> Resume improvement suggestions</h4>
              <ul className="suggestions">
                {result.suggestions.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      {recommended.length > 0 && (
        <div className="section">
          <h2>Best job matches for this resume</h2>
          <div className="grid-3">
            {recommended.map((r) => (
              <JobCard key={r.job.id} job={r.job} score={r.match_score} onView={onOpenJob} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
