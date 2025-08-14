"""
Flow schemas for API validation
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime


class FlowBase(BaseModel):
    """Base flow schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    target_nodes: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class FlowCreate(FlowBase):
    """Schema for creating a flow"""
    pass


class FlowUpdate(BaseModel):
    """Schema for updating a flow"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    target_nodes: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class FlowResponse(FlowBase):
    """Schema for flow responses"""
    id: str
    deployed: bool
    deployed_at: Optional[datetime]
    version: int
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True
    }


class FlowDeploy(BaseModel):
    """Schema for flow deployment"""
    target_nodes: Optional[List[str]] = Field(None, description="Specific nodes to deploy to")
    force: bool = Field(False, description="Force deployment even if already deployed")