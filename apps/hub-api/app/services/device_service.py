"""
Device management service
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import structlog

from app.schemas.device import DeviceCreate, DeviceUpdate, DeviceResponse, DeviceStatus
from app.core.nats import nats_client

logger = structlog.get_logger()


class DeviceService:
    """Service for managing devices"""
    
    def __init__(self):
        self._devices: Dict[str, Dict[str, Any]] = {}
    
    async def create_device(self, device_data: DeviceCreate) -> DeviceResponse:
        """Create a new device"""
        device = {
            "id": device_data.id,
            "name": device_data.name,
            "type": device_data.type,
            "status": DeviceStatus.discovered,
            "claimed": False,
            "capabilities": device_data.capabilities,
            "device_metadata": device_data.device_metadata,
            "ip_address": device_data.ip_address,
            "mac_address": device_data.mac_address,
            "last_seen": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        self._devices[device_data.id] = device
        
        # Publish device discovery event
        await self._publish_device_event("device.discovered", device)
        
        logger.info("Device created", device_id=device_data.id)
        return DeviceResponse(**device)
    
    async def get_device(self, device_id: str) -> Optional[DeviceResponse]:
        """Get device by ID"""
        device = self._devices.get(device_id)
        if device:
            return DeviceResponse(**device)
        return None
    
    async def update_device(self, device_id: str, update_data: DeviceUpdate) -> Optional[DeviceResponse]:
        """Update device"""
        device = self._devices.get(device_id)
        if not device:
            return None
        
        # Update fields
        update_dict = update_data.model_dump(exclude_unset=True)
        device.update(update_dict)
        device["updated_at"] = datetime.utcnow()
        
        # Update last seen if status is online
        if update_data.status == DeviceStatus.online:
            device["last_seen"] = datetime.utcnow()
        
        # Publish update event
        await self._publish_device_event("device.updated", device)
        
        logger.info("Device updated", device_id=device_id)
        return DeviceResponse(**device)
    
    async def list_devices(self, status: Optional[DeviceStatus] = None) -> List[DeviceResponse]:
        """List all devices"""
        devices = list(self._devices.values())
        
        if status:
            devices = [d for d in devices if d["status"] == status]
        
        return [DeviceResponse(**d) for d in devices]
    
    async def claim_device(self, device_id: str) -> Optional[DeviceResponse]:
        """Claim a device"""
        device = self._devices.get(device_id)
        if not device:
            return None
        
        device["claimed"] = True
        device["status"] = DeviceStatus.claimed
        device["updated_at"] = datetime.utcnow()
        
        # Publish claim event
        await self._publish_device_event("device.claimed", device)
        
        logger.info("Device claimed", device_id=device_id)
        return DeviceResponse(**device)
    
    async def send_command(self, device_id: str, command: Dict[str, Any]) -> bool:
        """Send command to device"""
        device = self._devices.get(device_id)
        if not device:
            return False
        
        # Publish command to device-specific subject
        subject = f"device.{device_id}.command"
        await nats_client.publish(subject, command)
        
        logger.info("Command sent to device", device_id=device_id, command=command.get("type"))
        return True
    
    async def _publish_device_event(self, event_type: str, device: Dict[str, Any]):
        """Publish device event to NATS"""
        event = {
            "type": event_type,
            "device_id": device["id"],
            "timestamp": datetime.utcnow().isoformat(),
            "data": device,
        }
        await nats_client.publish("hub.events.devices", event)


# Singleton instance
device_service = DeviceService()