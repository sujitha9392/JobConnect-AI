"""
schemas.py - Pydantic schemas.

Schemas describe the JSON the API accepts (input) and returns (output).
Pydantic validates automatically: wrong data -> FastAPI answers with a 422 error.
"""
import re
from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

JobType = Literal["Full-time", "Part-time", "Internship", "Contract"]
ApplicationStatus = Literal["Applied", "Shortlisted", "Interview", "Selected", "Rejected"]


# ---------------------------------------------------------------- Jobs
class JobBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, from_attributes=True)

    title: str = Field(min_length=2, max_length=120)
    company: str = Field(min_length=2, max_length=120)
    location: str = Field(min_length=2, max_length=80)
    job_type: JobType
    salary: str = Field(min_length=1, max_length=60)
    description: str = Field(min_length=10)
    skills: List[str] = Field(min_length=1)

    @field_validator("skills", mode="before")
    @classmethod
    def skills_to_list(cls, value):
        """Accept "React,Python" (database format) or ["React", "Python"] (API format)."""
        if isinstance(value, str):
            value = value.split(",")
        return [s.strip() for s in value if s and s.strip()]


class JobCreate(JobBase):
    pass


class JobOut(JobBase):
    id: int
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------- Applications
class ApplicationCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    candidate_name: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=120)
    resume_text: str = Field(min_length=20)
    job_id: int

    @field_validator("email")
    @classmethod
    def check_email(cls, value):
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value):
            raise ValueError("Enter a valid email address")
        return value.lower()


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    job_title: Optional[str] = None
    job_company: Optional[str] = None
    candidate_name: str
    email: str
    resume_text: str
    status: ApplicationStatus
    match_score: int
    created_at: Optional[datetime] = None


class StatusUpdate(BaseModel):
    status: ApplicationStatus


# ---------------------------------------------------------------- AI
class ResumeRequest(BaseModel):
    resume_text: str = Field(min_length=20, description="Paste at least a few lines of resume text")


class MatchRequest(BaseModel):
    resume_text: str = Field(min_length=20)
    job_id: int


class AnalyzeResult(BaseModel):
    detected_skills: List[str]
    total_skills: int
    categories: Dict[str, List[str]]
    suggestions: List[str]


class MatchResult(BaseModel):
    job_id: int
    job_title: str
    company: str
    match_score: int
    level: str
    matched_skills: List[str]
    missing_skills: List[str]
    recommendation: str
    explanation: str


class RecommendedJob(BaseModel):
    job: JobOut
    match_score: int
    level: str
    matched_skills: List[str]
    missing_skills: List[str]
