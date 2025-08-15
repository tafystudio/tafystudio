# Generated from JSON Schema - DO NOT EDIT
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


"""Message broadcast by devices for discovery"""

class Discovery(BaseModel):
    device_type: str = Field(..., description="Hardware platform type")
    hardware_id: str = Field(..., description="Unique hardware identifier (MAC address or serial)")
    firmware_version: str = Field(..., description="Firmware version (semver)")
    capabilities: List[str] = Field(..., description="List of supported capabilities")
    network: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    resources: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(
        json_schema_extra={"$schema": schema.get("$schema", "")},
        validate_assignment=True,
    )
