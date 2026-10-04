// api.js - every call to the FastAPI backend lives here.
// If you change the backend address, change it in ONE place (API_BASE).
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

// Turn FastAPI error responses into a readable message.
function formatError(data, status) {
  if (data && typeof data.detail === "string") return data.detail;
  if (data && Array.isArray(data.detail)) {
    // 422 validation errors: [{loc: ["body","email"], msg: "..."}]
    return data.detail
      .map((e) => `${(e.loc || []).slice(1).join(" ")}: ${e.msg}`.replace(/^: /, ""))
      .join(". ");
  }
  return `Request failed (status ${status})`;
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Cannot reach the server. Please start the backend: uvicorn main:app --reload (http://127.0.0.1:8000)");
  }
  if (response.status === 204) return null; // DELETE returns "No Content"
  let data = null;
  try {
    data = await response.json();
  } catch {
    /* response had no JSON body */
  }
  if (!response.ok) throw new Error(formatError(data, response.status));
  return data;
}

const send = (method, body) => ({ method, body: JSON.stringify(body) });

// ---- Jobs (CRUD) ----
export function getJobs({ search = "", location = "", job_type = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (location) params.set("location", location);
  if (job_type) params.set("job_type", job_type);
  const query = params.toString();
  return request(`/jobs${query ? `?${query}` : ""}`);
}
export const getJob = (id) => request(`/jobs/${id}`);
export const createJob = (job) => request("/jobs", send("POST", job));
export const updateJob = (id, job) => request(`/jobs/${id}`, send("PUT", job));
export const deleteJob = (id) => request(`/jobs/${id}`, { method: "DELETE" });

// ---- Applications ----
export const applyToJob = (application) => request("/applications", send("POST", application));
export function getApplications({ job_id, email } = {}) {
  const params = new URLSearchParams();
  if (job_id) params.set("job_id", job_id);
  if (email) params.set("email", email);
  const query = params.toString();
  return request(`/applications${query ? `?${query}` : ""}`);
}
export const updateApplicationStatus = (id, status) =>
  request(`/applications/${id}/status`, send("PATCH", { status }));

// ---- AI ----
export const analyzeResume = (resume_text) => request("/ai/analyze-resume", send("POST", { resume_text }));
export const matchJob = (resume_text, job_id) => request("/ai/match", send("POST", { resume_text, job_id }));
export const recommendJobs = (resume_text) => request("/ai/recommend", send("POST", { resume_text }));

// ---- Stats ----
export const getStats = () => request("/stats");
