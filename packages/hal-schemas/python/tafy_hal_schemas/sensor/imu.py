# Generated from JSON Schema - DO NOT EDIT
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


"""Data from IMU sensors (accelerometer, gyroscope, magnetometer)"""

class Imu(BaseModel):
    acceleration: Dict[str, Any]
    angular_velocity: Dict[str, Any]
    magnetic_field: Optional[Dict[str, Any]] = None
    orientation: Optional[Dict[str, Any]] = None
    temperature_celsius: Optional[float] = Field(..., description="IMU temperature")
    calibration_status: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(
        json_schema_extra={"$schema": schema.get("$schema", "")},
        validate_assignment=True,
    )
