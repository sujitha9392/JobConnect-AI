# JobConnect AI

An AI-powered job portal with **explainable resume-to-job matching**. Candidates search jobs, analyze their resume and see exactly which skills they have and which they are missing. Recruiters post, edit and delete jobs and move candidates through a hiring pipeline.

Built as a portfolio project for Web Developer campus placements. **No paid API keys needed - the AI runs fully offline in Python.**

---

## 1. Project overview

Job seekers often apply blindly and do not know why they are rejected. JobConnect AI compares the skills in a resume with the skills a job requires and shows a clear match score, the matched skills, the missing skills and a recommendation.

## 2. Features

**Candidate**
* Landing page with hero, search, location + job-type filters, latest jobs, statistics
* Search by title, company, skill, location, job type (e.g. `React`, `Python`, `AI`, `Full Stack`, `Hyderabad`, `Internship`)
* Job details pop-up with required skills, **AI Match** and **Apply**
* **AI Resume Analyzer** - detected skills, categories (Frontend / Backend / Database / Cloud-DevOps / AI-Data), improvement tips, best job matches
* Candidate dashboard - applied jobs, status, AI scores, recommended jobs

**Recruiter**
* Post a job (Create), edit a job (Update), delete a job (Delete), view jobs (Read)
* Recruiter dashboard - posted jobs, total applications, applications by status
* View candidates per job and update status: `Applied -> Shortlisted -> Interview -> Selected / Rejected`

**Quality**
* Loading, empty and error states, form validation (frontend + backend), invalid ID handling (404), duplicate-application protection (409), responsive layout

## 3. Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, JavaScript, HTML5, CSS3, Lucide React icons |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite |
| AI | Rule-based / NLP-style skill extraction (regex) + set comparison |
| API style | REST + JSON |

## 4. Architecture

```
 React (Vite, :5173)  --HTTP/JSON-->  FastAPI (:8000)  --SQLAlchemy-->  SQLite (jobconnect.db)
   components, state                  routes + Pydantic                    jobs, applications
                                      + ai_matcher.py
```

1. The browser loads the React app from the Vite dev server.
2. React calls the API through one file, `src/api.js`.
3. FastAPI validates the input with Pydantic, talks to SQLite through SQLAlchemy and returns JSON.
4. AI endpoints call `ai_matcher.py` - plain Python functions, no external services.

## 5. Folder structure

```
JobConnect-AI/
├── backend/
│   ├── main.py            # FastAPI app + all endpoints + demo data
│   ├── database.py        # SQLite connection
│   ├── models.py          # SQLAlchemy tables
│   ├── schemas.py         # Pydantic schemas
│   ├── ai_matcher.py      # AI logic (skills, suggestions, score)
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx       # React entry point
│       ├── App.jsx        # page switching + shared state
│       ├── api.js         # all backend calls
│       ├── constants.js   # job types, locations, helpers
│       ├── styles.css     # all styling
│       └── components/
│           ├── Navbar.jsx, Footer.jsx, Home.jsx
│           ├── JobSearch.jsx, JobCard.jsx, JobDetails.jsx
│           ├── ResumeAnalyzer.jsx, PostJob.jsx
│           ├── CandidateDashboard.jsx, RecruiterDashboard.jsx
│           └── Modal.jsx, ScoreRing.jsx, SkillBadge.jsx, States.jsx
├── README.md
└── .gitignore
```

## 6. Backend setup

Requirements: **Python 3.10+**

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at http://127.0.0.1:8000 and Swagger docs at http://127.0.0.1:8000/docs.

## 7. Frontend setup

Requirements: **Node.js 18+**

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173.

## 8. How to run locally

Use **two terminals**:

| Terminal 1 (backend) | Terminal 2 (frontend) |
|---|---|
| `cd backend` | `cd frontend` |
| `python -m venv venv` | `npm install` |
| `venv\Scripts\activate` | `npm run dev` |
| `pip install -r requirements.txt` | |
| `uvicorn main:app --reload` | |

Then open **http://localhost:5173**. The database and 5 demo jobs are created automatically.

**Troubleshooting**
* *"Cannot reach the server"* in the UI -> the backend is not running; start `uvicorn`.
* *CORS error* -> open the app at `http://localhost:5173` (the allowed origin).
* *Port busy* -> `uvicorn main:app --reload --port 8001` and set `VITE_API_URL=http://127.0.0.1:8001/api` in `frontend/.env`.
* *Reset data* -> stop the backend and delete `backend/jobconnect.db`.

## 9. API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/jobs?search=&location=&job_type=` | List/search/filter jobs |
| GET | `/api/jobs/{id}` | One job (404 if not found) |
| POST | `/api/jobs` | Create job |
| PUT | `/api/jobs/{id}` | Update job |
| DELETE | `/api/jobs/{id}` | Delete job (+ its applications) |
| POST | `/api/applications` | Apply (status = "Applied") |
| GET | `/api/applications?job_id=&email=` | List applications |
| PATCH | `/api/applications/{id}/status` | Update status |
| POST | `/api/ai/analyze-resume` | Detect skills + suggestions |
| POST | `/api/ai/match` | Match resume against one job |
| POST | `/api/ai/recommend` | Rank all jobs for a resume |
| GET | `/api/stats` | Counts for dashboards |

Example - AI match:
```json
POST /api/ai/match
{ "resume_text": "I know Python, React, FastAPI, SQL and Git ...", "job_id": 1 }
```

## 10. Database explanation

Two tables, one-to-many (one job -> many applications):

**jobs**: `id, title, company, location, job_type, salary, description, skills, created_at`
**applications**: `id, job_id (FK -> jobs.id), candidate_name, email, resume_text, status, match_score, created_at`

* Skills are stored as a comma-separated string to keep things simple (a larger system would use a `skills` table and a many-to-many link).
* Deleting a job deletes its applications (`cascade="all, delete-orphan"`).
* Tables are created in a startup function (`Base.metadata.create_all`) and demo jobs are inserted only if the table is empty.
* There is no login: the candidate is identified by the email saved in the browser's localStorage (see Future improvements).

## 11. AI matching explanation

The AI is **rule-based and explainable** - every number can be traced:

1. **Skill extraction** - `ai_matcher.py` has a catalog of 30 skills with spellings (`"reactjs"`, `"react.js"` -> `React`). A regex finds each one in the resume. The regex uses "not surrounded by letters/digits" so `Java` does not match inside `JavaScript` and `SQL` does not match inside `MySQL`.
2. **Categorisation** - each skill belongs to Frontend, Backend, Database, Cloud/DevOps or AI/Data.
3. **Match score**

```
Match Score = matched required skills / total required skills x 100
```

Example: job needs 6 skills, resume has 5 of them -> 5 / 6 x 100 = **83%** -> Strong Match.

| Score | Level |
|---|---|
| 80 - 100 | Strong Match |
| 60 - 79 | Good Match |
| 40 - 59 | Partial Match |
| 0 - 39 | Low Match |

4. **Output** - matched skills, missing skills, level, recommendation and a one-line explanation of the formula.

Why not an LLM? It is free, offline, instant, deterministic and explainable. The function `match_resume_to_job()` can later be swapped for an embedding or LLM based matcher.

## 12. Screenshots

Add your screenshots here after running the app (save images in a `screenshots/` folder):

* Home page - `screenshots/home.png`
* Job search results - `screenshots/search.png`
* Job details + AI match - `screenshots/ai-match.png`
* AI Resume Analyzer - `screenshots/analyzer.png`
* Candidate dashboard - `screenshots/candidate.png`
* Recruiter dashboard - `screenshots/recruiter.png`
* Swagger API docs - `screenshots/api-docs.png`

## 13. Future improvements

* Authentication (JWT) with separate candidate and recruiter accounts
* Upload PDF/DOCX resumes and extract the text
* Embeddings / LLM-based semantic matching (keep rule-based as the explainable baseline)
* Pagination, sorting and saved jobs
* PostgreSQL + Alembic migrations, Docker Compose, deployment (Render / Vercel)
* Email notifications on status change, unit tests (pytest) and CI with GitHub Actions

## 14. Resume bullet points

* Built **JobConnect AI**, a full-stack job portal using **React, Vite, FastAPI, SQLAlchemy and SQLite** with 12 REST endpoints and complete CRUD for jobs and applications.
* Designed an **explainable AI resume-matching engine** in Python (skill extraction with regex + score = matched/required x 100) that works offline without paid APIs.
* Developed a responsive, SaaS-style React UI with search and filters, AI score visualisation, candidate and recruiter dashboards, modals, form validation and loading/empty/error states.
* Implemented a hiring pipeline (Applied -> Shortlisted -> Interview -> Selected/Rejected), Pydantic validation, CORS configuration, automatic DB seeding and proper HTTP error handling (404, 409, 422).

## 15. Interview questions and answers

**1. Explain your project in one line.**
A job portal where candidates search and apply for jobs and an AI feature compares their resume skills with job requirements and explains the match.

**2. Why did you choose React?**
It is component based, so job cards, search and dashboards are reusable, and state updates refresh the UI automatically.

**3. Why FastAPI?**
It is fast, easy to learn, validates data with Pydantic and generates API docs at `/docs`, which is very useful for testing.

**4. What is a REST API?**
A way for the frontend and backend to talk over HTTP using URLs and methods: GET reads, POST creates, PUT updates, PATCH partially updates and DELETE removes.

**5. How is CRUD implemented?**
Create = `POST /api/jobs`, Read = `GET /api/jobs`, Update = `PUT /api/jobs/{id}`, Delete = `DELETE /api/jobs/{id}`. The React form calls these through `api.js`.

**6. How does the AI matching work?**
I extract skills from the resume with regex and compare them with the job's required skills: matched / total x 100. Then I map the percentage to Strong, Good, Partial or Low.

**7. Is it real AI?**
It is rule-based, NLP-style AI - explainable and offline. It is not a trained model, and I can upgrade the matcher to embeddings or an LLM later.

**8. How do you avoid wrong matches such as "Java" inside "JavaScript"?**
My regex requires the skill not to be surrounded by letters or digits, so `java` does not match `javascript`.

**9. What is SQLAlchemy?**
An ORM. I define Python classes (`Job`, `Application`) and it creates tables and runs SQL for me.

**10. What is the database relationship?**
One-to-many: one job has many applications, linked by the foreign key `job_id`.

**11. What does Pydantic do?**
It validates request data (for example, email format and minimum lengths). Invalid data returns 422 automatically.

**12. What is CORS and why did you configure it?**
Browsers block requests between different origins. React runs on port 5173 and FastAPI on 8000, so the backend explicitly allows the React origin.

**13. How do you handle errors?**
The backend raises `HTTPException` (404 for missing job, 409 for duplicate application). `api.js` converts errors to readable messages and components show them in an error box.

**14. How is state managed in React?**
With `useState` and `useEffect` hooks. `App.jsx` holds shared state (page, filters, profile) and passes data to children through props.

**15. What would you improve next?**
Authentication with JWT and roles, PDF resume upload, pagination, tests, Docker and deployment.
