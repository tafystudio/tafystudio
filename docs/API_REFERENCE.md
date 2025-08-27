# Tafy Studio API Reference

## Overview

The Tafy Studio Hub API provides a RESTful interface for managing robots, devices, flows, and system components. All API endpoints are prefixed with `/api/v1` and return JSON responses.

## Base URL

```text
http://localhost:8000/api/v1
```

## Authentication

Currently, the API operates without authentication in development mode. Production deployments should implement proper authentication using JWT tokens or API keys.

## Common Response Formats

### Success Response

```json
{
  "data": { ... },
  "status": "success"
}
```

### Error Response

```json
{
  "detail": "Error message",
  "status": "error"
}
```

## Endpoints

### Devices

Manage connected devices including robots, sensors, and actuators.

#### List Devices

```http
GET /devices
```

Query parameters:

- `status` (optional): Filter by device status (`online`, `offline`, `error`)

Response:

```json
{
  "devices": [
    {
      "id": "esp32-a4cf12",
      "name": "Robot 1",
      "type": "esp32",
      "status": "online",
      "capabilities": ["motor.differential:v1.0", "sensor.range:v1.0"],
      "ip_address": "192.168.1.100",
      "last_seen": "2024-03-14T10:30:00Z",
      "metadata": {}
    }
  ],
  "total": 1
}
```

#### Get Device Details

```http
GET /devices/{device_id}
```

Response:

```json
{
  "id": "esp32-a4cf12",
  "name": "Robot 1",
  "type": "esp32",
  "status": "online",
  "capabilities": ["motor.differential:v1.0", "sensor.range:v1.0"],
  "ip_address": "192.168.1.100",
  "last_seen": "2024-03-14T10:30:00Z",
  "metadata": {
    "firmware_version": "1.0.0",
    "hardware_revision": "A",
    "uptime_seconds": 3600
  }
}
```

#### Register Device

```http
POST /devices
```

Request body:

```json
{
  "name": "Robot 1",
  "type": "esp32",
  "capabilities": ["motor.differential:v1.0"],
  "metadata": {}
}
```

Response: Device object (same as GET response)

#### Update Device

```http
PATCH /devices/{device_id}
```

Request body:

```json
{
  "name": "Updated Robot Name",
  "metadata": {
    "location": "Lab A"
  }
}
```

Response: Updated device object

#### Claim Device

```http
POST /devices/{device_id}/claim
```

Claims an unclaimed device for this hub.

Response: Device object with updated claim status

#### Send Command to Device

```http
POST /devices/{device_id}/command
```

Request body:

```json
{
  "type": "motor.differential.command",
  "payload": {
    "linear_velocity": 0.5,
    "angular_velocity": 0.0
  }
}
```

Response:

```json
{
  "status": "sent",
  "device_id": "esp32-a4cf12",
  "command": { ... }
}
```

### Flows

Manage Node-RED flows for robot behaviors.

#### List Flows

```http
GET /flows
```

Query parameters:

- `status` (optional): Filter by flow status (`active`, `inactive`, `error`)

Response:

```json
{
  "flows": [
    {
      "id": "flow-123",
      "name": "Obstacle Avoidance",
      "description": "Basic obstacle avoidance using ToF sensor",
      "status": "active",
      "created_at": "2024-03-14T09:00:00Z",
      "updated_at": "2024-03-14T10:00:00Z",
      "node_count": 12
    }
  ],
  "total": 1
}
```

#### Get Flow Details

```http
GET /flows/{flow_id}
```

Response:

```json
{
  "id": "flow-123",
  "name": "Obstacle Avoidance",
  "description": "Basic obstacle avoidance using ToF sensor",
  "status": "active",
  "created_at": "2024-03-14T09:00:00Z",
  "updated_at": "2024-03-14T10:00:00Z",
  "node_count": 12,
  "definition": { ... },
  "deployed_to": ["esp32-a4cf12"]
}
```

#### Create Flow

```http
POST /flows
```

Request body:

```json
{
  "name": "New Flow",
  "description": "Flow description",
  "definition": { ... }
}
```

Response: Created flow object

#### Update Flow

```http
PUT /flows/{flow_id}
```

Request body:

```json
{
  "name": "Updated Flow Name",
  "description": "Updated description",
  "definition": { ... }
}
```

Response: Updated flow object

#### Deploy Flow

```http
POST /flows/{flow_id}/deploy
```

Request body:

```json
{
  "device_ids": ["esp32-a4cf12", "esp32-b5df23"]
}
```

Response:

```json
{
  "status": "deployed",
  "flow_id": "flow-123",
  "deployed_to": ["esp32-a4cf12", "esp32-b5df23"]
}
```

#### Stop Flow

```http
POST /flows/{flow_id}/stop
```

Response:

```json
{
  "status": "stopped",
  "flow_id": "flow-123"
}
```

### System

Monitor and manage system health and configuration.

#### System Health

```http
GET /system/health
```

Response:

```json
{
  "status": "healthy",
  "checks": {
    "nats": {
      "status": "healthy",
      "latency_ms": 2
    },
    "kubernetes": {
      "status": "healthy",
      "nodes": 3
    },
    "database": {
      "status": "healthy",
      "connections": 5
    }
  },
  "timestamp": "2024-03-14T10:30:00Z"
}
```

#### System Info

```http
GET /system/info
```

Response:

```json
{
  "version": "1.0.0",
  "build_time": "2024-03-14T08:00:00Z",
  "git_commit": "abc123",
  "uptime_seconds": 7200,
  "environment": "production"
}
```

#### System Metrics

```http
GET /system/metrics
```

Response:

```json
{
  "devices": {
    "total": 5,
    "online": 4,
    "offline": 1
  },
  "flows": {
    "total": 10,
    "active": 7,
    "inactive": 3
  },
  "messages": {
    "total_processed": 1000000,
    "rate_per_second": 250
  },
  "resources": {
    "cpu_usage_percent": 45.2,
    "memory_usage_mb": 512,
    "disk_usage_gb": 2.5
  }
}
```

### WebSocket

Real-time communication for device updates and telemetry.

#### WebSocket Connection

```text
ws://localhost:8000/api/v1/ws
```

#### Message Types

##### Device Update

```json
{
  "type": "device.update",
  "device_id": "esp32-a4cf12",
  "data": {
    "status": "online",
    "last_seen": "2024-03-14T10:30:00Z"
  }
}
```

##### Telemetry Data

```json
{
  "type": "telemetry",
  "device_id": "esp32-a4cf12",
  "data": {
    "sensor.range": {
      "distance_mm": 250,
      "confidence": 0.95
    },
    "motor.telemetry": {
      "left_rpm": 120,
      "right_rpm": 118
    }
  }
}
```

##### Command Response

```json
{
  "type": "command.response",
  "device_id": "esp32-a4cf12",
  "command_id": "cmd-456",
  "status": "success",
  "data": {}
}
```

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | BAD_REQUEST | Invalid request format or parameters |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 422 | VALIDATION_ERROR | Request validation failed |
| 500 | INTERNAL_ERROR | Internal server error |

## Rate Limiting

API rate limits (when enabled):

- 100 requests per minute per IP
- 1000 requests per hour per IP

Rate limit headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Pagination

List endpoints support pagination:

Query parameters:

- `page` (default: 1): Page number
- `per_page` (default: 20, max: 100): Items per page

Response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 45,
    "pages": 3
  }
}
```

## Examples

### Python

```python
import requests

# Base URL
BASE_URL = "http://localhost:8000/api/v1"

# List devices
response = requests.get(f"{BASE_URL}/devices")
devices = response.json()

# Send command to device
command = {
    "type": "motor.differential.command",
    "payload": {
        "linear_velocity": 0.5,
        "angular_velocity": 0.0
    }
}

response = requests.post(
    f"{BASE_URL}/devices/esp32-a4cf12/command",
    json=command
)
```

### JavaScript/TypeScript

```typescript
// List devices
const response = await fetch('http://localhost:8000/api/v1/devices');
const { devices } = await response.json();

// Send command using WebSocket
const ws = new WebSocket('ws://localhost:8000/api/v1/ws');

ws.send(JSON.stringify({
  type: 'command',
  device_id: 'esp32-a4cf12',
  command: {
    type: 'motor.differential.command',
    payload: {
      linear_velocity: 0.5,
      angular_velocity: 0.0
    }
  }
}));
```

### curl

```bash
# List devices
curl http://localhost:8000/api/v1/devices

# Get specific device
curl http://localhost:8000/api/v1/devices/esp32-a4cf12

# Send command
curl -X POST http://localhost:8000/api/v1/devices/esp32-a4cf12/command \
  -H "Content-Type: application/json" \
  -d '{
    "type": "motor.differential.command",
    "payload": {
      "linear_velocity": 0.5,
      "angular_velocity": 0.0
    }
  }'
```

## SDK Support

Official SDKs are available for:

- TypeScript/JavaScript: `@tafy/sdk-ts`
- Python: `tafy-sdk-python`
- Go: `github.com/tafystudio/tafy-sdk-go`

See individual SDK documentation for usage details.
