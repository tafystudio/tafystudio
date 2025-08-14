"""
Test device endpoints
"""

import pytest
from httpx import AsyncClient

from app.schemas.device import DeviceStatus


@pytest.mark.asyncio
async def test_create_device(client: AsyncClient):
    """Test device creation"""
    device_data = {
        "id": "test-device-001",
        "name": "Test Device",
        "type": "esp32",
        "capabilities": {
            "motor": ["differential"],
            "sensor": ["range", "imu"]
        },
        "ip_address": "192.168.1.100",
        "mac_address": "AA:BB:CC:DD:EE:FF"
    }
    
    response = await client.post("/api/v1/devices/", json=device_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == device_data["id"]
    assert data["name"] == device_data["name"]
    assert data["status"] == DeviceStatus.discovered
    assert data["claimed"] is False


@pytest.mark.asyncio
async def test_list_devices(client: AsyncClient):
    """Test listing devices"""
    # First create a device
    device_data = {
        "id": "test-device-002",
        "name": "Test Device 2",
        "type": "pi",
        "capabilities": {}
    }
    await client.post("/api/v1/devices/", json=device_data)
    
    # List all devices
    response = await client.get("/api/v1/devices/")
    assert response.status_code == 200
    
    data = response.json()
    assert "devices" in data
    assert "total" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_get_device(client: AsyncClient):
    """Test getting specific device"""
    # Create device first
    device_id = "test-device-003"
    device_data = {
        "id": device_id,
        "name": "Test Device 3",
        "type": "jetson",
        "capabilities": {}
    }
    await client.post("/api/v1/devices/", json=device_data)
    
    # Get the device
    response = await client.get(f"/api/v1/devices/{device_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == device_id
    assert data["name"] == device_data["name"]


@pytest.mark.asyncio
async def test_get_nonexistent_device(client: AsyncClient):
    """Test getting device that doesn't exist"""
    response = await client.get("/api/v1/devices/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_claim_device(client: AsyncClient):
    """Test claiming a device"""
    # Create unclaimed device
    device_id = "test-device-004"
    device_data = {
        "id": device_id,
        "name": "Test Device 4",
        "type": "esp32",
        "capabilities": {}
    }
    await client.post("/api/v1/devices/", json=device_data)
    
    # Claim the device
    response = await client.post(f"/api/v1/devices/{device_id}/claim")
    assert response.status_code == 200
    
    data = response.json()
    assert data["claimed"] is True
    assert data["status"] == DeviceStatus.claimed


@pytest.mark.asyncio
async def test_update_device(client: AsyncClient):
    """Test updating device"""
    # Create device
    device_id = "test-device-005"
    device_data = {
        "id": device_id,
        "name": "Original Name",
        "type": "esp32",
        "capabilities": {}
    }
    await client.post("/api/v1/devices/", json=device_data)
    
    # Update device
    update_data = {
        "name": "Updated Name",
        "status": DeviceStatus.online
    }
    response = await client.patch(f"/api/v1/devices/{device_id}", json=update_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["status"] == DeviceStatus.online


@pytest.mark.asyncio
async def test_send_command(client: AsyncClient):
    """Test sending command to device"""
    # Create device
    device_id = "test-device-006"
    device_data = {
        "id": device_id,
        "name": "Test Device 6",
        "type": "esp32",
        "capabilities": {"motor": ["differential"]}
    }
    await client.post("/api/v1/devices/", json=device_data)
    
    # Send command
    command = {
        "type": "move",
        "data": {
            "linear": 0.5,
            "angular": 0.0
        }
    }
    response = await client.post(f"/api/v1/devices/{device_id}/command", json=command)
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "sent"
    assert data["device_id"] == device_id