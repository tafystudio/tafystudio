"""Main FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.middleware.logging import LoggingMiddleware
from app.api.v1.api import api_router
from app.core.exceptions import add_exception_handlers
from app.core.nats import nats_client
from app.services.nats_service import nats_service
import structlog

logger = structlog.get_logger()


app = FastAPI(
    title="Tafy Hub API",
    description="API for Tafy Studio Robot Hub",
    version="0.0.1",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(LoggingMiddleware)

# Add exception handlers
add_exception_handlers(app)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Tafy Hub API",
        "version": "0.0.1",
        "docs": f"{settings.API_V1_STR}/docs",
    }


@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    logger.info("Starting Tafy Hub API")
    
    # Initialize NATS connection
    try:
        await nats_client.connect()
        logger.info("Connected to NATS")
        
        # Set up standard subscriptions
        await nats_service.setup_standard_subscriptions()
        logger.info("NATS subscriptions initialized")
    except Exception as e:
        logger.error("Failed to connect to NATS", error=str(e))
        # Continue running without NATS for development
    
    # Initialize database (if needed)
    # from app.db.init_db import init_db
    # await init_db()


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    logger.info("Shutting down Tafy Hub API")
    
    # Close NATS connection
    await nats_client.close()
    
    # Clean up resources
    logger.info("Cleanup complete")