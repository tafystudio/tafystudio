# Tafy Studio HAL Specification

## Overview

The Hardware Abstraction Layer (HAL) provides a uniform interface for all hardware in Tafy Studio.
This specification defines message formats, naming conventions, and behavior contracts that all drivers must implement.

## Core Principles

1. **Self-Describing**: Messages include schema version and capabilities
2. **Forward Compatible**: Unknown fields are ignored, not errors
3. **Units in Names**: No ambiguity (`meters_per_sec` not `speed`)
4. **Graceful Degradation**: Missing optional features don't break core functionality
5. **Idempotent Commands**: Sending the same command twice is safe

## Message Envelope

Every HAL message is wrapped in a standard envelope:

```json
{
  "hal_major": 1,
  "hal_minor": 0,
  "schema": "tafylabs/hal/motor/differential/1.0",
  "device_id": "esp32-a4cf12",
  "caps": ["motor.differential:v1.0", "sensor.range.tof:v1.0"],
  "ts": "2024-03-14T10:30:00.000Z",
  "payload": { ... }
}
```

Fields:

- `hal_major`: Major version of HAL (breaking changes)
- `hal_minor`: Minor version of HAL (additions only)
- `schema`: Full schema identifier for payload
- `device_id`: Unique device identifier
- `caps`: Array of capability strings with versions
- `ts`: ISO 8601 timestamp
- `payload`: The actual message data

## Subject Naming

NATS subjects follow a hierarchical pattern:

```plaintext
hal.v{major}.{domain}.{type}.{action}
```

Examples:

- `hal.v1.motor.differential.cmd` - Differential motor commands
- `hal.v1.sensor.range.data` - Range sensor readings
- `hal.v1.camera.config.set` - Camera configuration

## Standard Domains

### Motor Control (`motor`)

#### Differential Drive

Commands to `hal.v1.motor.differential.cmd`:

```json
{
  "linear_vel_m_per_s": 0.5,
  "angular_vel_rad_per_s": 0.2,
  "duration_ms": 1000,
  "stop_action": "brake"
}
```

State on `hal.v1.motor.differential.state`:

```json
{
  "left_vel_m_per_s": 0.48,
  "right_vel_m_per_s": 0.52,
  "linear_vel_m_per_s": 0.5,
  "angular_vel_rad_per_s": 0.2,
  "battery_volts": 12.1,
  "current_amps": 2.3
}
```

#### Servo Control

Commands to `hal.v1.motor.servo.cmd`:

```json
{
  "channel": 0,
  "position_deg": 90.0,
  "speed_deg_per_s": 60.0
}
```

### Sensors (`sensor`)

#### Range Sensors

Data on `hal.v1.sensor.range.data`:

```json
{
  "distance_m": 1.23,
  "min_range_m": 0.02,
  "max_range_m": 4.0,
  "fov_deg": 25.0,
  "confidence": 0.95
}
```

#### IMU

Data on `hal.v1.sensor.imu.data`:

```json
{
  "accel_m_per_s2": {"x": 0.1, "y": 0.0, "z": 9.81},
  "gyro_rad_per_s": {"x": 0.0, "y": 0.0, "z": 0.01},
  "mag_tesla": {"x": 0.00002, "y": 0.00001, "z": 0.00004},
  "orientation_quaternion": {"w": 1.0, "x": 0.0, "y": 0.0, "z": 0.0},
  "temperature_celsius": 25.3
}
```

### Vision (`vision`)

#### Camera Frames

Request on `hal.v1.camera.frame.req`:

```json
{
  "format": "jpeg",
  "width": 640,
  "height": 480,
  "quality": 85
}
```

Response on `hal.v1.camera.frame.resp`:

```json
{
  "format": "jpeg",
  "width": 640,
  "height": 480,
  "data": "base64_encoded_image_data",
  "timestamp_ms": 1678901234567
}
```

### System (`system`)

#### Health Check

Request on `hal.v1.system.health.req`:

```json
{
  "include_diagnostics": true
}
```

Response on `hal.v1.system.health.resp`:

```json
{
  "status": "healthy",
  "uptime_s": 3600,
  "free_memory_bytes": 1048576,
  "cpu_percent": 23.5,
  "temperature_celsius": 45.0,
  "diagnostics": {
    "voltage": 12.1,
    "errors": []
  }
}
```

## Capability Declaration

Devices declare capabilities in their mDNS TXT records and registration:

```json
{
  "caps": [
    "motor.differential:v1.0:priority=high",
    "sensor.range.tof:v1.0:count=3",
    "system.health:v1.0",
    "system.ota:v1.0"
  ]
}
```

Format: `{domain}.{type}:v{version}[:metadata]`

## Command Patterns

### Request/Reply

For commands expecting responses:

```plaintext
Client: NATS.Request("hal.v1.motor.info.get", timeout: 5s)
Driver: NATS.Reply(with device info)
```

### Fire and Forget

For commands without confirmation:

```plaintext
Client: NATS.Publish("hal.v1.motor.differential.cmd", command)
```

### Streaming

For continuous data:

```plaintext
Driver: NATS.Publish("hal.v1.sensor.imu.data", data) // 100Hz
Clients: NATS.Subscribe("hal.v1.sensor.imu.data")
```

## Error Handling

Errors are returned in a standard format:

```json
{
  "error": {
    "code": "RANGE_EXCEEDED",
    "message": "Requested speed 10 m/s exceeds maximum 2 m/s",
    "details": {
      "requested": 10,
      "maximum": 2
    }
  }
}
```

Standard error codes:

- `INVALID_PARAMETER` - Parameter validation failed
- `RANGE_EXCEEDED` - Value outside acceptable range
- `NOT_IMPLEMENTED` - Feature not available
- `HARDWARE_ERROR` - Physical device problem
- `TIMEOUT` - Operation timed out

## Timing and Quality of Service

### Latency Classes

- **Real-time**: <1ms (encoder feedback)
- **Low-latency**: <10ms (motor commands)
- **Interactive**: <100ms (camera frames)
- **Background**: >100ms (firmware updates)

### Message Priority

Set via NATS headers:

- `Priority: high` - Safety-critical (e-stop, collision)
- `Priority: normal` - Standard operations
- `Priority: low` - Telemetry, logging

## Versioning and Migration

### Version Rules

- Major version change = breaking change
- Minor version change = additions only
- Patch version change = clarifications

### Migration Support

During transitions, drivers may:

1. Publish to both old and new subjects
2. Accept commands on both versions
3. Include adapters for translation

Example migration:

```plaintext
# v1 -> v2 migration (6 months)
hal.v1.motor.cmd -> hal.v2.motor.differential.cmd
Driver publishes to both, gradually deprecate v1
```

## Best Practices

### For Driver Authors

1. Validate all inputs, provide clear errors
2. Include units in every numeric field name
3. Publish state changes immediately
4. Support capability queries
5. Implement health checks

### For Client Authors

1. Subscribe before sending commands
2. Handle missing devices gracefully
3. Respect device capabilities
4. Use appropriate timeouts
5. Log errors with context

### Performance Guidelines

- State updates: 10-100Hz depending on dynamics
- Command latency: <10ms processing time
- Startup time: <1s from power to capability announcement
- Memory usage: <10MB for simple drivers

## Example: Building a Motor Driver

```python
# 1. Announce capabilities
mdns.register("_tafynode._tcp", {
    "caps": ["motor.differential:v1.0", "system.health:v1.0"],
    "device_id": device_id
})

# 2. Subscribe to commands
async def handle_motor_cmd(msg):
    cmd = json.loads(msg.data)
    # Validate
    if abs(cmd["linear_vel_m_per_s"]) > MAX_SPEED:
        return error("RANGE_EXCEEDED", f"Speed exceeds {MAX_SPEED}")
    
    # Execute
    set_motor_speeds(
        left=calculate_left_speed(cmd),
        right=calculate_right_speed(cmd)
    )
    
    # Update state
    publish_state()

nats.subscribe("hal.v1.motor.differential.cmd", cb=handle_motor_cmd)

# 3. Publish state
async def publish_state():
    state = {
        "left_vel_m_per_s": get_left_speed(),
        "right_vel_m_per_s": get_right_speed(),
        "battery_volts": read_battery(),
        "timestamp_ms": time.time() * 1000
    }
    
    envelope = create_envelope("motor.differential.state", state)
    await nats.publish("hal.v1.motor.differential.state", envelope)

# 4. Start state publisher
asyncio.create_task(publish_state_loop(rate_hz=20))
```

## Testing Compliance

Use the HAL compliance test suite:

```bash
# Test a motor driver
tafy test hal --device esp32-a4cf12 --capability motor.differential

# Test all devices
tafy test hal --all
```

Tests verify:

- Message format compliance
- Timing requirements
- Error handling
- Capability accuracy
- State consistency
