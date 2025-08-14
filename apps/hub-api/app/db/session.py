"""
Database session configuration
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import Generator

from app.core.config import settings

# Create engine only if database URL is configured
engine = None
SessionLocal = None

if settings.DATABASE_URL:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        echo=False,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    """
    Database dependency to be used in FastAPI endpoints
    """
    if SessionLocal is None:
        raise RuntimeError("Database not configured. Set DATABASE_URL in environment.")
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()