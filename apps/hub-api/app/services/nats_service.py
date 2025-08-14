"""
NATS messaging service for pub/sub operations
"""

from typing import Dict, Any, Callable, Optional
import json
import structlog
from nats.aio.msg import Msg

from app.core.nats import nats_client

logger = structlog.get_logger()


class NATSService:
    """Service for NATS messaging operations"""
    
    def __init__(self):
        self._subscriptions: Dict[str, Any] = {}
        self._handlers: Dict[str, Callable] = {}
    
    async def subscribe(self, subject: str, handler: Callable) -> str:
        """Subscribe to a NATS subject"""
        sub_id = f"{subject}_{id(handler)}"
        
        if sub_id in self._subscriptions:
            logger.warning("Subscription already exists", subject=subject)
            return sub_id
        
        async def wrapped_handler(msg: Msg):
            try:
                data = json.loads(msg.data.decode())
                await handler(data, msg)
            except json.JSONDecodeError:
                logger.error("Invalid JSON in message", subject=subject)
            except Exception as e:
                logger.error("Handler error", subject=subject, error=str(e))
        
        sub = await nats_client.nc.subscribe(subject, cb=wrapped_handler)
        self._subscriptions[sub_id] = sub
        self._handlers[sub_id] = handler
        
        logger.info("Subscribed to subject", subject=subject)
        return sub_id
    
    async def unsubscribe(self, sub_id: str):
        """Unsubscribe from a subject"""
        sub = self._subscriptions.get(sub_id)
        if sub:
            await sub.unsubscribe()
            del self._subscriptions[sub_id]
            del self._handlers[sub_id]
            logger.info("Unsubscribed", sub_id=sub_id)
    
    async def publish(self, subject: str, data: Dict[str, Any], reply: Optional[str] = None):
        """Publish message to a subject"""
        await nats_client.publish(subject, data, reply)
    
    async def request(self, subject: str, data: Dict[str, Any], timeout: float = 5.0) -> Optional[Dict[str, Any]]:
        """Send request and wait for response"""
        try:
            msg = await nats_client.nc.request(
                subject,
                json.dumps(data).encode(),
                timeout=timeout
            )
            return json.loads(msg.data.decode())
        except Exception as e:
            logger.error("Request failed", subject=subject, error=str(e))
            return None
    
    async def setup_standard_subscriptions(self):
        """Set up standard Hub subscriptions"""
        # Device events
        await self.subscribe("device.*.status", self._handle_device_status)
        await self.subscribe("device.*.telemetry", self._handle_device_telemetry)
        
        # HAL messages
        await self.subscribe("hal.v1.*.data", self._handle_hal_data)
        
        # Node events
        await self.subscribe("node.*.heartbeat", self._handle_node_heartbeat)
        
        logger.info("Standard subscriptions set up")
    
    async def _handle_device_status(self, data: Dict[str, Any], msg: Msg):
        """Handle device status updates"""
        device_id = msg.subject.split(".")[1]
        logger.info("Device status update", device_id=device_id, status=data.get("status"))
        # TODO: Update device service with status
    
    async def _handle_device_telemetry(self, data: Dict[str, Any], msg: Msg):
        """Handle device telemetry"""
        device_id = msg.subject.split(".")[1]
        logger.debug("Device telemetry", device_id=device_id)
        # TODO: Store telemetry data
    
    async def _handle_hal_data(self, data: Dict[str, Any], msg: Msg):
        """Handle HAL data messages"""
        device_id = data.get("device_id")
        schema = data.get("schema")
        logger.debug("HAL data received", device_id=device_id, schema=schema)
        # TODO: Process HAL data
    
    async def _handle_node_heartbeat(self, data: Dict[str, Any], msg: Msg):
        """Handle node heartbeats"""
        node_id = msg.subject.split(".")[1]
        logger.debug("Node heartbeat", node_id=node_id)
        # TODO: Update node status


# Singleton instance
nats_service = NATSService()