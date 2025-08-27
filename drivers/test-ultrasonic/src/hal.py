"""HAL message definitions."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class HALMessage(BaseModel):
    """HAL message envelope."""
    
    hal_major: int = Field(..., description="HAL major version")
    hal_minor: int = Field(..., description="HAL minor version")
    schema: str = Field(..., description="Message schema identifier")
    device_id: str = Field(..., description="Device ID")
    caps: List[str] = Field(default_factory=list, description="Device capabilities")
    ts: str = Field(..., description="ISO 8601 timestamp")
    payload: Dict[str, Any] = Field(..., description="Message payload")
