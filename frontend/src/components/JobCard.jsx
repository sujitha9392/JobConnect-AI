import { Building2, Clock, MapPin, Wallet } from "lucide-react";
import SkillBadge from "./SkillBadge.jsx";
import { levelClass, levelFromScore } from "../constants.js";

function daysAgo(dateString) {
  if (!dateString) return "";
  const days = Math.floor((Date.now() - new Date(dateString + (dateString.endsWith("Z") ? "" : "Z")).getTime()) / 86400000);
  if (days <= 0) return "Today";
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

// One job in a list. Optional `score` shows an AI match chip.
export default function JobCard({ job, onView, score }) {
  return (
    <article className="card job-card" onClick={() => onView(job.id)}>
      <div className="job-card-top">
        <div className="company-logo">{job.company.charAt(0)}</div>
        <div className="job-card-title">
          <h3>{job.title}</h3>
          <p>
            <Building2 size={14} /> {job.company}
          </p>
        </div>
        {score !== undefined && (
          <span className={`score-chip chip-${levelClass(levelFromScore(score))}`}>{score}% match</span>
        )}
      </div>

      <div className="job-meta">
        <span><MapPin size={14} /> {job.location}</span>
        <span><Clock size={14} /> {job.job_type}</span>
        <span><Wallet size={14} /> {job.salary}</span>
      </div>

      <div className="badges">
        {job.skills.slice(0, 5).map((skill) => (
          <SkillBadge key={skill} name={skill} />
        ))}
        {job.skills.length > 5 && <span className="badge badge-more">+{job.skills.length - 5}</span>}
      </div>

      <div className="job-card-bottom">
        <small>{daysAgo(job.created_at)}</small>
        <button
          className="btn btn-small btn-outline"
          onClick={(e) => {
            e.stopPropagation();
            onView(job.id);
          }}
        >
          View details
        </button>
      </div>
    </article>
  );
}
