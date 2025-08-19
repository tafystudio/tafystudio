# Generated from JSON Schema - DO NOT EDIT
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


"""Standard envelope for all HAL messages in Tafy Studio"""

class Envelope(BaseModel):
    hal_major: int = Field(..., description="Major version of HAL specification (breaking changes)")
    hal_minor: int = Field(..., description="Minor version of HAL specification (additions only)")
    schema: str = Field(..., description="Full schema identifier for payload")
    device_id: str = Field(..., description="Unique device identifier")
    caps: List[str] = Field(..., description="Array of capability strings with versions")
    ts: datetime = Field(..., description="ISO 8601 timestamp")
    payload: Dict[str, Any] = Field(..., description="The actual message data conforming to the specified schema")

    model_config = ConfigDict(
        json_schema_extra={"$schema": schema.get("$schema", "")},
        validate_assignment=True,
    )
