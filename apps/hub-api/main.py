"""
Tafy Studio Hub API
FastAPI backend for the Robot Distributed Operation System
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager
import structlog

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.nats import nats_client
from app.core.logging import configure_logging
from app.middleware.logging import LoggingMiddleware
from app.services.nats_service import nats_service
from app.core.exceptions import (
    TafyException,
    tafy_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    general_exception_handler,
)

# Configure structured logging
configure_logging()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Tafy Hub API", version=settings.VERSION)
    
    # Connect to NATS
    await nats_client.connect()
    logger.info("Connected to NATS", url=settings.NATS_URL)
    
    # Set up NATS subscriptions
    await nats_service.setup_standard_subscriptions()
    
    yield
    
    # Shutdown
    logger.info("Shutting down Tafy Hub API")
    await nats_client.close()


app = FastAPI(
    title="Tafy Studio Hub API",
    description="Backend API for the Robot Distributed Operation System",
    version=settings.VERSION,
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(LoggingMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add exception handlers
app.add_exception_handler(TafyException, tafy_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "nats_connected": nats_client.is_connected,
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Tafy Studio Hub API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
    }