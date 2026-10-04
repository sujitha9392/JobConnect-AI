"""
main.py - the FastAPI application (all REST endpoints live here).

Run with:  uvicorn main:app --reload
Interactive API docs (free, automatic):  http://127.0.0.1:8000/docs
"""
import re
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import ai_matcher
import models
import schemas
from database import Base, SessionLocal, engine, get_db

STATUSES = ["Applied", "Shortlisted", "Interview", "Selected", "Rejected"]

# ---------------------------------------------------------------------------
# Demo data - inserted automatically the first time the app starts
# ---------------------------------------------------------------------------
SEED_JOBS = [
    {
        "title": "AI-Powered Web Developer", "company": "NovaTech Labs", "location": "Hyderabad",
        "job_type": "Full-time", "salary": "₹8–12 LPA",
        "description": "Build modern web apps that use AI features. You will create React interfaces, design FastAPI services and connect them to SQL databases while working with a friendly product team.",
        "skills": ["React", "JavaScript", "Python", "FastAPI", "SQL", "REST API", "Git", "AI"],
    },
    {
        "title": "Frontend Developer", "company": "PixelWorks", "location": "Bengaluru",
        "job_type": "Full-time", "salary": "₹7–10 LPA",
        "description": "Turn designs into fast, accessible and responsive user interfaces using React. You will work closely with designers and backend engineers and consume REST APIs.",
        "skills": ["HTML", "CSS", "JavaScript", "React", "Git", "REST API"],
    },
    {
        "title": "Full Stack Developer", "company": "CloudSprint", "location": "Hyderabad",
        "job_type": "Internship", "salary": "₹25k/month",
        "description": "Six month internship building features end to end with the MERN stack. You will write React components, Express APIs and MongoDB queries under a mentor's guidance.",
        "skills": ["React", "Node.js", "Express", "MongoDB", "JavaScript", "Git", "REST API"],
    },
    {
        "title": "Junior AI Engineer", "company": "DataMind", "location": "Chennai",
        "job_type": "Full-time", "salary": "₹9–14 LPA",
        "description": "Help build LLM and RAG powered products. You will prepare data with Pandas, build Python APIs with FastAPI and store results in SQL databases.",
        "skills": ["Python", "AI", "LLM", "RAG", "FastAPI", "Pandas", "SQL", "Git"],
    },
    {
        "title": "Software Engineer Graduate", "company": "TechBridge", "location": "Pune",
        "job_type": "Full-time", "salary": "₹6–9 LPA",
        "description": "Graduate program for new engineers. You will build backend services in Java and Python, write SQL queries, expose REST APIs and learn containerised deployment with Docker.",
        "skills": ["Java", "Python", "SQL", "REST API", "Git", "Docker"],
    },
]


def skills_to_text(skills: List[str]) -> str:
    """List -> 'React,Python' for storing in the database. Names are standardised first."""
    cleaned: List[str] = []
    for skill in skills:
        name = ai_matcher.canonical_skill(skill)
        if name.lower() not in [c.lower() for c in cleaned]:
            cleaned.append(name)
    return ",".join(cleaned)


def seed_database():
    """Insert demo jobs only when the jobs table is empty."""
    db = SessionLocal()
    try:
        if db.query(models.Job).count() == 0:
            for data in SEED_JOBS:
                db.add(models.Job(**{**data, "skills": skills_to_text(data["skills"])}))
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once at startup: create tables (if missing) and insert demo jobs.
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield


app = FastAPI(title="JobConnect AI API", version="1.0.0", lifespan=lifespan)

# ---------------------------------------------------------------------------
# CORS: lets the React app (port 5173) call this API (port 8000) from the browser.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_job_or_404(db: Session, job_id: int) -> models.Job:
    job = db.get(models.Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job with id {job_id} was not found")
    return job


def job_skills(job: models.Job) -> List[str]:
    return [s for s in job.skills.split(",") if s]


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ===========================================================================
# JOBS - CRUD
# ===========================================================================
@app.get("/api/jobs", response_model=List[schemas.JobOut])
def list_jobs(
    search: Optional[str] = Query(None, description="title, company, skill, location or type"),
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """READ: list jobs (newest first) with optional search + filters."""
    query = db.query(models.Job)
    if location:
        query = query.filter(models.Job.location.ilike(f"%{location.strip()}%"))
    if job_type:
        query = query.filter(models.Job.job_type.ilike(job_type.strip()))
    jobs = query.order_by(models.Job.id.desc()).all()

    if search and search.strip():
        # Every word typed must appear as a WHOLE WORD in title/company/skills/location/type.
        # (A plain SQL LIKE would make "AI" match "Chennai", so we check whole words in Python.)
        words = search.lower().split()

        def matches(job: models.Job) -> bool:
            text = " ".join([job.title, job.company, job.skills.replace(",", " "), job.location, job.job_type]).lower()
            return all(re.search(r"(?<![a-z0-9])" + re.escape(w) + r"(?![a-z0-9])", text) for w in words)

        jobs = [j for j in jobs if matches(j)]
    return jobs


@app.get("/api/jobs/{job_id}", response_model=schemas.JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """READ: one job by id (404 if not found)."""
    return get_job_or_404(db, job_id)


@app.post("/api/jobs", response_model=schemas.JobOut, status_code=201)
def create_job(payload: schemas.JobCreate, db: Session = Depends(get_db)):
    """CREATE: recruiter posts a new job."""
    data = payload.model_dump()
    data["skills"] = skills_to_text(data["skills"])
    job = models.Job(**data)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@app.put("/api/jobs/{job_id}", response_model=schemas.JobOut)
def update_job(job_id: int, payload: schemas.JobCreate, db: Session = Depends(get_db)):
    """UPDATE: replace the details of an existing job."""
    job = get_job_or_404(db, job_id)
    data = payload.model_dump()
    data["skills"] = skills_to_text(data["skills"])
    for field, value in data.items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return job


@app.delete("/api/jobs/{job_id}", status_code=204)
def delete_job(job_id: int, db: Session = Depends(get_db)):
    """DELETE: remove a job (and its applications)."""
    job = get_job_or_404(db, job_id)
    db.delete(job)
    db.commit()
    return Response(status_code=204)


# ===========================================================================
# APPLICATIONS
# ===========================================================================
@app.post("/api/applications", response_model=schemas.ApplicationOut, status_code=201)
def create_application(payload: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    """Candidate applies for a job. Status starts as 'Applied'."""
    job = get_job_or_404(db, payload.job_id)

    already = (
        db.query(models.Application)
        .filter(models.Application.job_id == job.id, models.Application.email == payload.email)
        .first()
    )
    if already:
        raise HTTPException(status_code=409, detail="You have already applied for this job with this email")

    # Calculate and save the AI match score at apply time.
    resume_skills = ai_matcher.extract_skills(payload.resume_text)
    score = ai_matcher.match_resume_to_job(resume_skills, job_skills(job))["match_score"]

    application = models.Application(
        job_id=job.id,
        candidate_name=payload.candidate_name,
        email=payload.email,
        resume_text=payload.resume_text,
        status="Applied",
        match_score=score,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@app.get("/api/applications", response_model=List[schemas.ApplicationOut])
def list_applications(
    job_id: Optional[int] = None,
    email: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """READ: list applications. Filter by job (recruiter) or email (candidate)."""
    query = db.query(models.Application)
    if job_id is not None:
        query = query.filter(models.Application.job_id == job_id)
    if email:
        query = query.filter(models.Application.email == email.strip().lower())
    if status:
        query = query.filter(models.Application.status == status)
    return query.order_by(models.Application.id.desc()).all()


@app.patch("/api/applications/{application_id}/status", response_model=schemas.ApplicationOut)
def update_application_status(application_id: int, payload: schemas.StatusUpdate, db: Session = Depends(get_db)):
    """UPDATE: recruiter changes the status (Applied -> Shortlisted -> Interview ...)."""
    application = db.get(models.Application, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail=f"Application with id {application_id} was not found")
    application.status = payload.status
    db.commit()
    db.refresh(application)
    return application


# ===========================================================================
# AI
# ===========================================================================
@app.post("/api/ai/analyze-resume", response_model=schemas.AnalyzeResult)
def analyze_resume(payload: schemas.ResumeRequest):
    """Detect skills in pasted resume text and suggest improvements."""
    return ai_matcher.analyze_resume(payload.resume_text)


@app.post("/api/ai/match", response_model=schemas.MatchResult)
def match_resume(payload: schemas.MatchRequest, db: Session = Depends(get_db)):
    """Compare resume skills with one job's required skills."""
    job = get_job_or_404(db, payload.job_id)
    resume_skills = ai_matcher.extract_skills(payload.resume_text)
    result = ai_matcher.match_resume_to_job(resume_skills, job_skills(job))
    return {"job_id": job.id, "job_title": job.title, "company": job.company, **result}


@app.post("/api/ai/recommend", response_model=List[schemas.RecommendedJob])
def recommend_jobs(payload: schemas.ResumeRequest, db: Session = Depends(get_db)):
    """Score every job against the resume and return them best-first."""
    resume_skills = ai_matcher.extract_skills(payload.resume_text)
    results = []
    for job in db.query(models.Job).all():
        match = ai_matcher.match_resume_to_job(resume_skills, job_skills(job))
        results.append({
            "job": schemas.JobOut.model_validate(job),
            "match_score": match["match_score"],
            "level": match["level"],
            "matched_skills": match["matched_skills"],
            "missing_skills": match["missing_skills"],
        })
    results.sort(key=lambda r: r["match_score"], reverse=True)
    return results


# ===========================================================================
# STATS
# ===========================================================================
@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """Numbers for the home page and recruiter dashboard."""
    jobs = db.query(models.Job).all()
    applications = db.query(models.Application).all()
    by_status = {status: 0 for status in STATUSES}
    for application in applications:
        by_status[application.status] = by_status.get(application.status, 0) + 1
    return {
        "total_jobs": len(jobs),
        "total_applications": len(applications),
        "total_companies": len({j.company for j in jobs}),
        "total_locations": len({j.location for j in jobs}),
        "applications_by_status": by_status,
    }
