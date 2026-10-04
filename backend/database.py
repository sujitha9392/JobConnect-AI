"""
database.py - database connection setup.

We use SQLite (a single file called jobconnect.db) so there is nothing to install.
SQLAlchemy is the ORM: it lets us work with Python classes instead of raw SQL.
"""
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Always create the DB file next to this script, no matter where uvicorn is started from.
DB_FILE = Path(__file__).resolve().parent / "jobconnect.db"
DATABASE_URL = f"sqlite:///{DB_FILE}"

# check_same_thread=False is needed because FastAPI may use several threads with SQLite.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Each request gets its own "session" (a short conversation with the database).
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# All models inherit from this Base class.
Base = declarative_base()


def get_db():
    """FastAPI dependency: open a session for a request, always close it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
