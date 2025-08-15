# Generated from JSON Schema - DO NOT EDIT
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


"""Standard envelope for all HAL messages"""

class Envelope(BaseModel):
    hal_major: int = Field(..., description="Major version of HAL specification")
    hal_minor: int = Field(..., description="Minor version of HAL specification")
    schema: str = Field(..., description="Schema identifier for payload (e.g., tafylabs/hal/motor/differential/1.0)")
    device_id: str = Field(..., description="Unique device identifier")
    caps: List[str] = Field(..., description="Array of capability strings with versions (e.g., motor.differential:v1.0)")
    ts: datetime = Field(..., description="ISO 8601 timestamp")
    payload: Dict[str, Any] = Field(..., description="Message payload conforming to schema")
    seq: Optional[int] = Field(..., description="Optional sequence number for ordering")
    correlation_id: Optional[str] = Field(..., description="Optional correlation ID for request/response patterns")

    model_config = ConfigDict(
        json_schema_extra={"$schema": schema.get("$schema", "")},
        validate_assignment=True,
    )
