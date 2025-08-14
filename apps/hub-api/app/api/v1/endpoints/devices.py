"""
Device management endpoints
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Body
import structlog

from app.schemas.device import DeviceCreate, DeviceUpdate, DeviceResponse, DeviceList, DeviceStatus
from app.services.device_service import device_service

router = APIRouter()
logger = structlog.get_logger()


@router.get("/", response_model=DeviceList)
async def list_devices(
    status: Optional[DeviceStatus] = Query(None, description="Filter by device status")
):
    """List all discovered devices"""
    devices = await device_service.list_devices(status=status)
    return DeviceList(devices=devices, total=len(devices))


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(device_id: str):
    """Get device details"""
    device = await device_service.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.post("/", response_model=DeviceResponse)
async def create_device(device_data: DeviceCreate):
    """Register a new device"""
    return await device_service.create_device(device_data)


@router.patch("/{device_id}", response_model=DeviceResponse)
async def update_device(device_id: str, update_data: DeviceUpdate):
    """Update device information"""
    device = await device_service.update_device(device_id, update_data)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.post("/{device_id}/claim", response_model=DeviceResponse)
async def claim_device(device_id: str):
    """Claim a device for this hub"""
    device = await device_service.claim_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.post("/{device_id}/command")
async def send_command(device_id: str, command: Dict[str, Any] = Body(...)):
    """Send command to device"""
    success = await device_service.send_command(device_id, command)
    if not success:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"status": "sent", "device_id": device_id, "command": command}