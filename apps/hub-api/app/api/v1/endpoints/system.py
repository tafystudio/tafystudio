"""
System management endpoints
"""

from fastapi import APIRouter, Query
from typing import Optional, List
from datetime import datetime
import structlog
import platform
import psutil
import time

from app.schemas.system import SystemInfo, HealthCheck, LogEntry, LogLevel
from app.core.config import settings
from app.core.nats import nats_client

router = APIRouter()
logger = structlog.get_logger()

# Track startup time for uptime calculation
STARTUP_TIME = time.time()


@router.get("/info", response_model=SystemInfo)
async def get_system_info():
    """Get system information"""
    memory = psutil.virtual_memory()
    cpu_percent = psutil.cpu_percent(interval=0.1)
    
    return SystemInfo(
        version=settings.VERSION,
        hostname=platform.node(),
        platform=f"{platform.system()} {platform.release()}",
        python_version=platform.python_version(),
        uptime_seconds=time.time() - STARTUP_TIME,
        memory_usage_mb=memory.used / 1024 / 1024,
        cpu_percent=cpu_percent,
        nats_connected=nats_client.is_connected,
        redis_connected=False,  # TODO: Check Redis connection
        database_connected=False,  # TODO: Check database connection
    )


@router.get("/health", response_model=HealthCheck)
async def get_system_health():
    """Get detailed system health"""
    checks = {
        "nats": nats_client.is_connected,
        "api": True,  # We're responding, so API is healthy
        "redis": False,  # TODO: Implement Redis health check
        "database": False,  # TODO: Implement database health check
    }
    
    # Determine overall status
    if all(checks.values()):
        status = "healthy"
    elif any(checks.values()):
        status = "degraded"
    else:
        status = "unhealthy"
    
    return HealthCheck(
        status=status,
        version=settings.VERSION,
        checks=checks,
    )


@router.get("/logs", response_model=List[LogEntry])
async def get_system_logs(
    level: Optional[LogLevel] = Query(None, description="Filter by log level"),
    module: Optional[str] = Query(None, description="Filter by module"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of logs to return")
):
    """Get recent system logs"""
    # TODO: Implement actual log retrieval from structured logging
    # For now, return sample data
    sample_logs = [
        LogEntry(
            timestamp=datetime.utcnow(),
            level=LogLevel.info,
            message="System started successfully",
            module="main",
            metadata={"version": settings.VERSION}
        ),
        LogEntry(
            timestamp=datetime.utcnow(),
            level=LogLevel.info,
            message="NATS connection established",
            module="nats",
            metadata={"url": settings.NATS_URL}
        ),
    ]
    
    # Apply filters
    if level:
        sample_logs = [log for log in sample_logs if log.level == level]
    if module:
        sample_logs = [log for log in sample_logs if log.module == module]
    
    return sample_logs[:limit]


@router.post("/backup")
async def create_backup():
    """Create system backup"""
    logger.info("Creating system backup")
    # TODO: Implement backup functionality with Velero or similar
    backup_id = f"backup-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
    
    return {
        "status": "initiated",
        "backup_id": backup_id,
        "message": "Backup functionality will be implemented with Velero integration"
    }