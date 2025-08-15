# Generated from JSON Schema - DO NOT EDIT
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


"""Periodic heartbeat message from devices"""

class Heartbeat(BaseModel):
    uptime_seconds: int = Field(..., description="Device uptime in seconds")
    status: str = Field(..., description="Current device status")
    health: Dict[str, Any]
    active_capabilities: Optional[List[str]] = Field(..., description="Currently active capabilities")
    error_count: Optional[int] = Field(..., description="Number of errors since last heartbeat")
    warnings: Optional[List[str]] = Field(..., description="Current warning messages")
    metrics: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(
        json_schema_extra={"$schema": schema.get("$schema", "")},
        validate_assignment=True,
    )
