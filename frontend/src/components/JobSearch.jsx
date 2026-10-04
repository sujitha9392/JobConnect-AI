import { useEffect, useState } from "react";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";
import { JOB_TYPES, LOCATIONS, QUICK_SEARCHES } from "../constants.js";

// Search bar + location filter + job type filter + quick search chips.
export default function JobSearch({ filters, onSearch, showChips = true }) {
  const [draft, setDraft] = useState(filters);

  // Keep the inputs in sync when filters change from outside (e.g. chip click on another page).
  useEffect(() => setDraft(filters), [filters]);

  const submit = (e) => {
    e.preventDefault();
    onSearch(draft);
  };

  const update = (field, value) => setDraft({ ...draft, [field]: value });

  return (
    <div className="search-wrap">
      <form className="search-bar" onSubmit={submit}>
        <label className="search-field">
          <Search size={18} />
          <input
            type="text"
            placeholder="Job title, company or skill (React, Python, AI...)"
            value={draft.search}
            onChange={(e) => update("search", e.target.value)}
          />
        </label>
        <label className="search-field">
          <MapPin size={18} />
          <select value={draft.location} onChange={(e) => update("location", e.target.value)}>
            <option value="">All locations</option>
            {LOCATIONS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="search-field">
          <SlidersHorizontal size={18} />
          <select value={draft.job_type} onChange={(e) => update("job_type", e.target.value)}>
            <option value="">All job types</option>
            {JOB_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {showChips && (
        <div className="chips">
          <span>Popular:</span>
          {QUICK_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              className="chip"
              onClick={() => onSearch({ search: term, location: "", job_type: "" })}
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
