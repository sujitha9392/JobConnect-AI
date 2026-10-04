import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import SkillBadge from "./SkillBadge.jsx";
import { ErrorBox } from "./States.jsx";
import { createJob, updateJob } from "../api.js";
import { JOB_TYPES } from "../constants.js";

const EMPTY = {
  title: "", company: "", location: "", job_type: "Full-time", salary: "", description: "", skills: "",
};

// Recruiter form. Used for BOTH "Create" (job = null) and "Update" (job = existing job).
export default function PostJob({ job, onSaved, onCancel, notify }) {
  const editing = Boolean(job);
  const [form, setForm] = useState(editing ? { ...job, skills: job.skills.join(", ") } : EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm({ ...form, [field]: value });
  const skillList = form.skills.split(",").map((s) => s.trim()).filter(Boolean);

  // Client side validation (the backend validates again - never trust only the frontend).
  const validate = () => {
    const e = {};
    if (form.title.trim().length < 2) e.title = "Enter a job title";
    if (form.company.trim().length < 2) e.company = "Enter the company name";
    if (form.location.trim().length < 2) e.location = "Enter a location";
    if (!form.salary.trim()) e.salary = "Enter a salary";
    if (form.description.trim().length < 10) e.description = "Description must be at least 10 characters";
    if (skillList.length === 0) e.skills = "Add at least one skill (comma separated)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setApiError("");
    if (!validate()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      job_type: form.job_type,
      salary: form.salary.trim(),
      description: form.description.trim(),
      skills: skillList,
    };
    try {
      const saved = editing ? await updateJob(job.id, payload) : await createJob(payload);
      notify("success", editing ? "Job updated successfully" : "Job posted successfully");
      onSaved(saved);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, placeholder, type = "text") => (
    <label>
      {label}
      <input type={type} value={form[name]} placeholder={placeholder} onChange={(e) => set(name, e.target.value)} />
      {errors[name] && <span className="field-error">{errors[name]}</span>}
    </label>
  );

  return (
    <section className="container page narrow">
      <div className="page-head">
        <h1>{editing ? "Edit job" : "Post a job"}</h1>
        <p>{editing ? "Update the details and save." : "Reach candidates and let AI match them to your required skills."}</p>
      </div>

      <form className="card form" onSubmit={submit} noValidate>
        <div className="form-row">
          {field("title", "Job title", "e.g. React Developer")}
          {field("company", "Company", "e.g. NovaTech Labs")}
        </div>
        <div className="form-row">
          {field("location", "Location", "e.g. Hyderabad")}
          <label>
            Job type
            <select value={form.job_type} onChange={(e) => set("job_type", e.target.value)}>
              {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
        </div>
        {field("salary", "Salary", "e.g. ₹8–12 LPA")}
        <label>
          Description
          <textarea rows={5} value={form.description} placeholder="What will the candidate do?" onChange={(e) => set("description", e.target.value)} />
          {errors.description && <span className="field-error">{errors.description}</span>}
        </label>
        <label>
          Required skills (comma separated)
          <input value={form.skills} placeholder="React, Python, FastAPI, SQL, Git" onChange={(e) => set("skills", e.target.value)} />
          {errors.skills && <span className="field-error">{errors.skills}</span>}
        </label>
        {skillList.length > 0 && (
          <div className="badges">
            {skillList.map((s) => <SkillBadge key={s} name={s} />)}
          </div>
        )}

        {apiError && <ErrorBox message={apiError} />}

        <div className="btn-row">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />} {editing ? "Save changes" : "Post job"}
          </button>
          {onCancel && <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>}
        </div>
      </form>
    </section>
  );
}
