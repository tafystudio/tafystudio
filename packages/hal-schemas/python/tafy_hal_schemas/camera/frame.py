# Generated from JSON Schema - DO NOT EDIT
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


"""Metadata about a camera frame for streaming"""

class Frame(BaseModel):
    camera_id: str = Field(..., description="Unique identifier for this camera on the device")
    resolution: str = Field(..., description="Frame resolution (e.g., '640x480')")
    format: str = Field(..., description="Video format/encoding")
    fps: Optional[int] = Field(..., description="Frames per second")
    timestamp: int = Field(..., description="Frame timestamp in milliseconds since epoch")
    frame_count: Optional[int] = Field(..., description="Total frames captured since start")
    size: Optional[int] = Field(..., description="Frame size in bytes")
    url: Optional[str] = Field(..., description="URL to access the video stream")
    exposure: Optional[float] = Field(..., description="Camera exposure value")
    gain: Optional[float] = Field(..., description="Camera gain value")

    model_config = ConfigDict(
        json_schema_extra={"$schema": schema.get("$schema", "")},
        validate_assignment=True,
    )
