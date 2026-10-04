"""
ai_matcher.py - the "AI" of JobConnect AI.

This is a RULE-BASED / NLP-style system. It works fully offline, needs no API key,
and every result can be explained step by step (this is called "explainable AI").

Three ideas:
  1. SKILL EXTRACTION  - find known skills in resume text using keyword rules (regex).
  2. CATEGORISATION    - group skills into Frontend / Backend / Database / Cloud / AI.
  3. MATCH SCORE       - compare resume skills with the job's required skills:

         Match Score = matched required skills / total required skills x 100
"""
import re
from typing import Dict, List

# ---------------------------------------------------------------------------
# 1. Skill catalog: canonical skill name -> list of spellings (aliases) to look for.
# ---------------------------------------------------------------------------
SKILL_CATALOG: Dict[str, List[str]] = {
    "Python": ["python"],
    "Java": ["java"],
    "JavaScript": ["javascript", "js", "es6"],
    "TypeScript": ["typescript"],
    "React": ["react", "reactjs", "react.js"],
    "Node.js": ["node.js", "nodejs", "node js", "node"],
    "Express": ["express", "expressjs", "express.js"],
    "FastAPI": ["fastapi", "fast api"],
    "Django": ["django"],
    "Spring Boot": ["spring boot", "springboot"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "SQL": ["sql"],
    "MySQL": ["mysql"],
    "PostgreSQL": ["postgresql", "postgres"],
    "MongoDB": ["mongodb", "mongo db", "mongo"],
    "Git": ["git"],
    "GitHub": ["github"],
    "Docker": ["docker"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure"],
    "REST API": ["rest api", "rest apis", "restful", "restful api", "restful apis"],
    "Machine Learning": ["machine learning", "ml"],
    "AI": ["ai", "artificial intelligence"],
    "LLM": ["llm", "llms", "large language model", "large language models"],
    "RAG": ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
    "LangChain": ["langchain"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Power BI": ["power bi", "powerbi"],
}

# Which category each skill belongs to (used for the category cards in the UI).
CATEGORIES: Dict[str, List[str]] = {
    "Frontend": ["HTML", "CSS", "JavaScript", "TypeScript", "React"],
    "Backend": ["Python", "Java", "Node.js", "Express", "FastAPI", "Django", "Spring Boot", "REST API"],
    "Database": ["SQL", "MySQL", "PostgreSQL", "MongoDB"],
    "Cloud/DevOps": ["Git", "GitHub", "Docker", "AWS", "Azure"],
    "AI/Data": ["Machine Learning", "AI", "LLM", "RAG", "LangChain", "Pandas", "NumPy", "Power BI"],
}


def _build_pattern(aliases: List[str]) -> re.Pattern:
    """
    Build one regex for a skill. We use "not preceded/followed by a letter or digit"
    instead of \\b so that:
        "java"  does NOT match inside "javascript"
        "sql"   does NOT match inside "mysql" or "postgresql"
        "git"   does NOT match inside "github"
        "node.js" and "AI/ML" still work
    """
    parts = [re.escape(a) for a in aliases]
    return re.compile(r"(?<![A-Za-z0-9])(?:" + "|".join(parts) + r")(?![A-Za-z0-9])", re.IGNORECASE)


_PATTERNS = {skill: _build_pattern(aliases) for skill, aliases in SKILL_CATALOG.items()}

# lower-case alias -> canonical name, e.g. "reactjs" -> "React"
_ALIAS_TO_SKILL = {alias.lower(): skill for skill, aliases in SKILL_CATALOG.items() for alias in aliases}
for _skill in SKILL_CATALOG:
    _ALIAS_TO_SKILL[_skill.lower()] = _skill


def canonical_skill(name: str) -> str:
    """Turn any spelling into the standard name ('reactjs' -> 'React'). Unknown skills are kept as typed."""
    cleaned = name.strip()
    return _ALIAS_TO_SKILL.get(cleaned.lower(), cleaned)


# ---------------------------------------------------------------------------
# 2. Skill extraction + categorisation
# ---------------------------------------------------------------------------
def extract_skills(text: str) -> List[str]:
    """Return the list of catalog skills found in the text (in catalog order)."""
    return [skill for skill, pattern in _PATTERNS.items() if pattern.search(text)]


def categorize_skills(skills: List[str]) -> Dict[str, List[str]]:
    """Group skills by category. Every category key is always present."""
    result = {category: [s for s in members if s in skills] for category, members in CATEGORIES.items()}
    return result


def improvement_suggestions(text: str, skills: List[str]) -> List[str]:
    """Simple rules that give the candidate tips to improve the resume."""
    suggestions: List[str] = []
    categories = categorize_skills(skills)
    lowered = text.lower()

    if len(skills) < 8:
        suggestions.append("Only a few technical skills were detected. Add a dedicated 'Skills' section listing your tools and technologies.")
    if not categories["Frontend"] and not categories["Backend"]:
        suggestions.append("Add web development skills (HTML, CSS, JavaScript, React, Python or Node.js) to target web developer roles.")
    if not categories["Database"]:
        suggestions.append("No database skill found. Mention SQL, MySQL, PostgreSQL or MongoDB and describe how you used it.")
    if "Git" not in skills and "GitHub" not in skills:
        suggestions.append("Add Git/GitHub and include a link to your GitHub profile so recruiters can see your code.")
    if "REST API" not in skills:
        suggestions.append("Mention REST APIs if you have built or consumed any - it is a very common requirement.")
    if not categories["Cloud/DevOps"] or ("Docker" not in skills and "AWS" not in skills and "Azure" not in skills):
        suggestions.append("Consider learning Docker or a cloud platform (AWS/Azure) - many job descriptions ask for it.")
    if not categories["AI/Data"]:
        suggestions.append("Add an AI/Data skill (for example Machine Learning, Pandas or LLMs) to stand out.")
    if not re.search(r"\d+\s*%|\d{2,}\+?\s*(users|records|requests|students|downloads)", lowered):
        suggestions.append("Add measurable results to your projects (for example 'reduced load time by 30%').")
    if not re.search(r"project|intern|experience", lowered):
        suggestions.append("Describe at least 2 projects or an internship with what you built and which technologies you used.")
    if len(text.split()) < 80:
        suggestions.append("Your resume text is quite short. Add more detail about projects, education and achievements.")

    if not suggestions:
        suggestions.append("Great resume! Keep it to one page and tailor the skills section to each job you apply for.")
    return suggestions


def analyze_resume(text: str) -> dict:
    """Full resume analysis used by POST /api/ai/analyze-resume."""
    skills = extract_skills(text)
    return {
        "detected_skills": skills,
        "total_skills": len(skills),
        "categories": categorize_skills(skills),
        "suggestions": improvement_suggestions(text, skills),
    }


# ---------------------------------------------------------------------------
# 3. Matching a resume against a job
# ---------------------------------------------------------------------------
def match_level(score: int) -> str:
    """Turn a percentage into a label."""
    if score >= 80:
        return "Strong Match"
    if score >= 60:
        return "Good Match"
    if score >= 40:
        return "Partial Match"
    return "Low Match"


RECOMMENDATIONS = {
    "Strong Match": "Strong match - you meet almost all requirements. Apply with confidence!",
    "Good Match": "Good match - you have most of the skills. Learn the missing ones and apply.",
    "Partial Match": "Partial match - you can apply, but build the missing skills first to improve your chances.",
    "Low Match": "Low match - this role needs many skills you have not shown yet. Use the missing skills as a learning roadmap.",
}


def match_resume_to_job(resume_skills: List[str], required_skills: List[str]) -> dict:
    """
    Compare resume skills with the job's required skills.

        score = matched / total required x 100   (rounded to a whole number)
    """
    # Compare in lower case, using canonical names, so "reactjs" equals "React".
    resume_set = {canonical_skill(s).lower() for s in resume_skills}

    # Remove duplicates in the job skills but keep the original order.
    required: List[str] = []
    for skill in required_skills:
        name = canonical_skill(skill)
        if name.lower() not in [r.lower() for r in required]:
            required.append(name)

    matched = [s for s in required if s.lower() in resume_set]
    missing = [s for s in required if s.lower() not in resume_set]

    total = len(required)
    score = round(len(matched) / total * 100) if total else 0
    level = match_level(score)

    explanation = (
        f"{len(matched)} of {len(required)} required skills were found in the resume. "
        f"Score = {len(matched)} / {len(required)} x 100 = {score}%."
    )
    return {
        "match_score": score,
        "level": level,
        "matched_skills": matched,
        "missing_skills": missing,
        "recommendation": RECOMMENDATIONS[level],
        "explanation": explanation,
    }
