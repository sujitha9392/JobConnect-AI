// Values shared by several components.
export const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];
export const LOCATIONS = ["Hyderabad", "Bengaluru", "Chennai", "Pune", "Mumbai", "Delhi", "Remote"];
export const STATUSES = ["Applied", "Shortlisted", "Interview", "Selected", "Rejected"];
export const QUICK_SEARCHES = ["React", "Python", "AI", "Full Stack", "Hyderabad", "Bengaluru", "Internship", "Full-time"];

export const SAMPLE_RESUME = `Rahul Sharma - Final year B.Tech CSE student
Skills: HTML, CSS, JavaScript, React, Python, FastAPI, SQL, MySQL, Git, GitHub, REST API
Projects:
1. Student Portal - built a responsive React app with a FastAPI backend and MySQL database. Reduced page load time by 30%.
2. Weather Dashboard - consumed REST APIs using JavaScript and displayed charts.
Internship: Web development intern - built reusable UI components used by 200+ users.
Learning: Docker, Machine Learning and LLM basics.`;

// Colour of the AI score / level label.
export function levelClass(level) {
  if (level === "Strong Match") return "strong";
  if (level === "Good Match") return "good";
  if (level === "Partial Match") return "partial";
  return "low";
}

export function levelFromScore(score) {
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Partial Match";
  return "Low Match";
}
