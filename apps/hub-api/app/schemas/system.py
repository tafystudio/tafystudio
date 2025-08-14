"""
System schemas for API validation
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum


class LogLevel(str, Enum):
    """Log level enumeration"""
    debug = "debug"
    info = "info"
    warning = "warning"
    error = "error"
    critical = "critical"


class SystemInfo(BaseModel):
    """System information schema"""
    version: str
    hostname: str
    platform: str
    python_version: str
    uptime_seconds: float
    memory_usage_mb: float
    cpu_percent: float
    nats_connected: bool
    redis_connected: bool
    database_connected: bool


class HealthCheck(BaseModel):
    """Health check response schema"""
    status: str = Field(..., description="healthy, degraded, or unhealthy")
    version: str
    checks: Dict[str, bool] = Field(..., description="Individual component health checks")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class LogEntry(BaseModel):
    """Log entry schema"""
    timestamp: datetime
    level: LogLevel
    message: str
    module: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LogQuery(BaseModel):
    """Log query parameters"""
    level: Optional[LogLevel] = None
    module: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    limit: int = Field(100, ge=1, le=1000)