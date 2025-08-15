"""
Device model for tracking registered devices
"""

from sqlalchemy import String, JSON, Boolean, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional, Dict, Any
from datetime import datetime
import enum

from .base import Base, TimestampMixin


class DeviceStatus(enum.Enum):
    """Device status enumeration"""
    DISCOVERED = "discovered"
    CLAIMED = "claimed"
    ONLINE = "online"
    OFFLINE = "offline"
    ERROR = "error"


class Device(Base, TimestampMixin):
    """Device model"""
    __tablename__ = "devices"
    
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    type: Mapped[str] = mapped_column(String(64))  # esp32, pi, jetson, etc.
    status: Mapped[DeviceStatus] = mapped_column(
        Enum(DeviceStatus),
        default=DeviceStatus.DISCOVERED
    )
    claimed: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Hardware capabilities
    capabilities: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    
    # Network information
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    mac_address: Mapped[Optional[str]] = mapped_column(String(17), nullable=True)
    
    # Device metadata
    device_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    
    # Last seen timestamp
    last_seen: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    def __repr__(self) -> str:
        return f"<Device {self.id}: {self.name} ({self.status.value})>"