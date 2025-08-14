"""
Database initialization
"""

from sqlalchemy import inspect
import structlog

from app.db.session import engine
from app.models.base import Base
from app.models.device import Device
from app.models.flow import Flow

logger = structlog.get_logger()


def init_db():
    """
    Initialize database with tables
    """
    if engine is None:
        logger.warning("Database not configured, skipping initialization")
        return
    
    # Create all tables
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    if not existing_tables:
        logger.info("Creating database tables")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    else:
        logger.info("Database tables already exist", tables=existing_tables)


def drop_db():
    """
    Drop all database tables (use with caution!)
    """
    if engine is None:
        logger.warning("Database not configured, nothing to drop")
        return
    
    logger.warning("Dropping all database tables")
    Base.metadata.drop_all(bind=engine)
    logger.info("Database tables dropped")


if __name__ == "__main__":
    # Initialize database when run directly
    init_db()