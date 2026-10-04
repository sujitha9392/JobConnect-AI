"""
models.py - database tables (SQLAlchemy models).

Two simple tables:
  jobs          -> one row per job posting
  applications  -> one row per candidate application (linked to a job by job_id)

Relationship: ONE job has MANY applications (one-to-many).
"""
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(120), nullable=False)
    company = Column(String(120), nullable=False)
    location = Column(String(80), nullable=False)
    job_type = Column(String(30), nullable=False)      # Full-time / Internship ...
    salary = Column(String(60), nullable=False)
    description = Column(Text, nullable=False)
    # Skills are stored as a comma separated string: "React,Python,SQL".
    # (Simple for beginners. A bigger app would use a separate skills table.)
    skills = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    # If a job is deleted, its applications are deleted too (cascade).
    applications = relationship(
        "Application", back_populates="job", cascade="all, delete-orphan"
    )


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    candidate_name = Column(String(120), nullable=False)
    email = Column(String(120), nullable=False)
    resume_text = Column(Text, nullable=False)
    status = Column(String(20), default="Applied", nullable=False)
    match_score = Column(Integer, default=0)            # AI score saved at apply time
    created_at = Column(DateTime, default=utc_now)

    job = relationship("Job", back_populates="applications")

    # Convenience properties so the API can show job info next to each application.
    @property
    def job_title(self):
        return self.job.title if self.job else None

    @property
    def job_company(self):
        return self.job.company if self.job else None
