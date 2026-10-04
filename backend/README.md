# JobConnect AI - Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows   (macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
uvicorn main:app --reload
```

* API: http://127.0.0.1:8000
* Interactive docs (Swagger UI): http://127.0.0.1:8000/docs
* The SQLite file `jobconnect.db` and the 5 demo jobs are created automatically on first start.
* To reset the data, stop the server and delete `jobconnect.db`.

| File | Purpose |
|---|---|
| `main.py` | FastAPI app, CORS, all REST endpoints, demo data seeding |
| `database.py` | SQLite engine + session (`get_db` dependency) |
| `models.py` | SQLAlchemy tables: `Job`, `Application` |
| `schemas.py` | Pydantic request/response schemas + validation |
| `ai_matcher.py` | Rule-based skill extraction, suggestions and match score |
