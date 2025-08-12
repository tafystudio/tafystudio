"""
NATS client singleton for the application
"""

import nats
from nats.js import JetStreamContext
from typing import Optional
import structlog
from app.core.config import settings

logger = structlog.get_logger()


class NATSClient:
    """NATS client wrapper with connection management"""
    
    def __init__(self):
        self.nc: Optional[nats.NATS] = None
        self.js: Optional[JetStreamContext] = None
        
    async def connect(self):
        """Connect to NATS server"""
        try:
            self.nc = await nats.connect(
                servers=[settings.NATS_URL],
                user=settings.NATS_USER,
                password=settings.NATS_PASSWORD,
                name="tafy-hub-api",
                reconnect_time_wait=2,
                max_reconnect_attempts=60,
            )
            
            # Enable JetStream if available
            try:
                self.js = self.nc.jetstream()
                logger.info("JetStream enabled")
            except Exception as e:
                logger.warning("JetStream not available", error=str(e))
                
        except Exception as e:
            logger.error("Failed to connect to NATS", error=str(e))
            raise
            
    async def close(self):
        """Close NATS connection"""
        if self.nc:
            await self.nc.close()
            
    @property
    def is_connected(self) -> bool:
        """Check if connected to NATS"""
        return self.nc is not None and self.nc.is_connected
        
    async def publish(self, subject: str, data: bytes):
        """Publish message to subject"""
        if not self.is_connected:
            raise RuntimeError("NATS not connected")
        await self.nc.publish(subject, data)
        
    async def subscribe(self, subject: str, callback):
        """Subscribe to subject with callback"""
        if not self.is_connected:
            raise RuntimeError("NATS not connected")
        return await self.nc.subscribe(subject, cb=callback)


# Global NATS client instance
nats_client = NATSClient()