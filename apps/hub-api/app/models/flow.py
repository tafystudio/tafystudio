"""
Flow model for Node-RED flows
"""

from sqlalchemy import String, JSON, Boolean, Text, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from typing import Dict, Any, List
from datetime import datetime

from .base import Base, TimestampMixin


class Flow(Base, TimestampMixin):
    """Flow model for storing Node-RED flows"""
    __tablename__ = "flows"
    
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Flow configuration (Node-RED JSON)
    config: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    
    # Deployment status
    deployed: Mapped[bool] = mapped_column(Boolean, default=False)
    deployed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # Target devices/nodes
    target_nodes: Mapped[List[str]] = mapped_column(JSON, default=list)
    
    # Version control
    version: Mapped[int] = mapped_column(Integer, default=1)
    
    # Flow metadata
    flow_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    
    def __repr__(self) -> str:
        return f"<Flow {self.id}: {self.name} (v{self.version})>"