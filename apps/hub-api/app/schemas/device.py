"""
Device schemas for API validation
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum


class DeviceStatus(str, Enum):
    """Device status enumeration"""
    discovered = "discovered"
    claimed = "claimed"
    online = "online"
    offline = "offline"
    error = "error"


class DeviceBase(BaseModel):
    """Base device schema"""
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., min_length=1, max_length=64)
    capabilities: Dict[str, Any] = Field(default_factory=dict)
    device_metadata: Dict[str, Any] = Field(default_factory=dict)


class DeviceCreate(DeviceBase):
    """Schema for creating a device"""
    id: str = Field(..., min_length=1, max_length=64)
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None


class DeviceUpdate(BaseModel):
    """Schema for updating a device"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[DeviceStatus] = None
    capabilities: Optional[Dict[str, Any]] = None
    device_metadata: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None


class DeviceResponse(DeviceBase):
    """Schema for device responses"""
    id: str
    status: DeviceStatus
    claimed: bool
    ip_address: Optional[str]
    mac_address: Optional[str]
    last_seen: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True
    }


class DeviceList(BaseModel):
    """Schema for device list responses"""
    devices: List[DeviceResponse]
    total: int