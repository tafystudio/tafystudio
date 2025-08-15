# Generated from JSON Schema - DO NOT EDIT
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


"""Command schema for differential drive motors"""

class Differential(BaseModel):
    linear_meters_per_sec: float = Field(..., description="Linear velocity in meters per second")
    angular_rad_per_sec: float = Field(..., description="Angular velocity in radians per second")
    duration_ms: Optional[int] = Field(..., description="Optional duration in milliseconds (0 = indefinite)")
    acceleration_meters_per_sec2: Optional[float] = Field(..., description="Optional linear acceleration limit")
    angular_acceleration_rad_per_sec2: Optional[float] = Field(..., description="Optional angular acceleration limit")
    priority: Optional[str] = Field(..., description="Command priority for queue management")

    model_config = ConfigDict(
        json_schema_extra={"$schema": schema.get("$schema", "")},
        validate_assignment=True,
    )
