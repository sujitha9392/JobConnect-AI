import { useState } from "react";
import { Briefcase, Menu, Plus, X } from "lucide-react";

const LINKS = [
  { id: "home", label: "Home" },
  { id: "jobs", label: "Find Jobs" },
  { id: "analyzer", label: "AI Resume Analyzer" },
  { id: "candidate", label: "My Applications" },
  { id: "recruiter", label: "Recruiter" },
];

export default function Navbar({ page, setPage }) {
  const [open, setOpen] = useState(false); // mobile menu

  const go = (id) => {
    setPage(id);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <button className="logo" onClick={() => go("home")}>
          <span className="logo-mark">
            <Briefcase size={18} />
          </span>
          JobConnect <span className="logo-ai">AI</span>
        </button>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          {LINKS.map((link) => (
            <button
              key={link.id}
              className={`nav-link ${page === link.id ? "active" : ""}`}
              onClick={() => go(link.id)}
            >
              {link.label}
            </button>
          ))}
          <button className="btn btn-primary nav-cta" onClick={() => go("post")}>
            <Plus size={16} /> Post a Job
          </button>
        </nav>

        <button className="icon-btn menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
