# Generated from JSON Schema - DO NOT EDIT
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


"""Status information for a camera device"""

class Status(BaseModel):
    camera_id: str = Field(..., description="Unique identifier for this camera on the device")
    status: str = Field(..., description="Current camera status")
    resolution: Optional[str] = Field(..., description="Current resolution")
    fps: Optional[int] = Field(..., description="Current frames per second")
    frame_count: Optional[int] = Field(..., description="Total frames captured")
    error_count: Optional[int] = Field(..., description="Total capture errors")
    last_error: Optional[str] = Field(..., description="Last error message")
    stream_url: Optional[str] = Field(..., description="URL to access the video stream")
    capabilities: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(
        json_schema_extra={"$schema": schema.get("$schema", "")},
        validate_assignment=True,
    )
