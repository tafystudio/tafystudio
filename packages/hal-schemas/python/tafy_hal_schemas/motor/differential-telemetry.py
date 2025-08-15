# Generated from JSON Schema - DO NOT EDIT
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


"""Telemetry data from differential drive motors"""

class DifferentialTelemetry(BaseModel):
    actual_linear_meters_per_sec: float = Field(..., description="Actual linear velocity in meters per second")
    actual_angular_rad_per_sec: float = Field(..., description="Actual angular velocity in radians per second")
    commanded_linear_meters_per_sec: Optional[float] = Field(..., description="Last commanded linear velocity")
    commanded_angular_rad_per_sec: Optional[float] = Field(..., description="Last commanded angular velocity")
    odometry: Dict[str, Any]
    wheel_velocities: Optional[Dict[str, Any]] = None
    current_draw_amps: Optional[float] = Field(..., description="Total current draw in amperes")
    temperature_celsius: Optional[float] = Field(..., description="Motor controller temperature")
    error_code: Optional[str] = Field(..., description="Error code if any")
    status: Optional[str] = Field(..., description="Current motor status")

    model_config = ConfigDict(
        json_schema_extra={"$schema": schema.get("$schema", "")},
        validate_assignment=True,
    )
