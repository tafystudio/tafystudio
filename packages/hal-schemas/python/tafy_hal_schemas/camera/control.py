# Generated from JSON Schema - DO NOT EDIT
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


"""Control commands for camera devices"""

class Control(BaseModel):
    command: str = Field(..., description="Command to execute")
    resolution: Optional[str] = Field(..., description="Set camera resolution")
    fps: Optional[int] = Field(..., description="Set frames per second")
    format: Optional[str] = Field(..., description="Set video format")
    exposure: Optional[Dict[str, Any]] = None
    gain: Optional[Dict[str, Any]] = None
    white_balance: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(
        json_schema_extra={"$schema": schema.get("$schema", "")},
        validate_assignment=True,
    )
