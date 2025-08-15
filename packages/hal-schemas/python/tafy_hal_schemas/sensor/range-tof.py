# Generated from JSON Schema - DO NOT EDIT
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


"""Data from Time of Flight (ToF) range sensors"""

class RangeTof(BaseModel):
    sensor_id: str = Field(..., description="Unique identifier for this sensor on the device")
    range_meters: float = Field(..., description="Measured range in meters")
    quality: float = Field(..., description="Measurement quality/confidence percentage")
    min_range_meters: Optional[float] = Field(..., description="Minimum measurable range for this sensor")
    max_range_meters: Optional[float] = Field(..., description="Maximum measurable range for this sensor")
    field_of_view_deg: Optional[float] = Field(..., description="Field of view in degrees")
    ambient_light_level: Optional[float] = Field(..., description="Ambient light level (sensor specific units)")
    temperature_celsius: Optional[float] = Field(..., description="Sensor temperature")
    status: Optional[str] = Field(..., description="Sensor status")
    raw_value: Optional[int] = Field(..., description="Raw sensor reading for debugging")

    model_config = ConfigDict(
        json_schema_extra={"$schema": schema.get("$schema", "")},
        validate_assignment=True,
    )
