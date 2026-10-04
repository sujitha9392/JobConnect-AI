import { levelClass, levelFromScore } from "../constants.js";

// Circular progress ring that visualises the AI match score (0-100).
export default function ScoreRing({ score, size = 120 }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const cls = levelClass(levelFromScore(score));

  return (
    <div className={`score-ring ring-${cls}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100">
        <circle className="ring-bg" cx="50" cy="50" r={radius} />
        <circle
          className="ring-fg"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="ring-label">
        <strong>{score}%</strong>
        <span>match</span>
      </div>
    </div>
  );
}
