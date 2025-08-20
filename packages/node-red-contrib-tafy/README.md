# Node-RED Tafy Nodes

Custom Node-RED nodes for Tafy Studio robot control system. These nodes provide easy integration with the Tafy RDOS platform through NATS messaging and HAL-compliant communication.

## Installation

### Via npm

```bash
cd ~/.node-red
npm install @tafy/node-red-contrib-tafy
```

### Via Node-RED Palette Manager

1. Open Node-RED
2. Go to Menu → Manage Palette
3. Search for "tafy"
4. Click install

### From Source

```bash
cd packages/node-red-contrib-tafy
npm link
cd ~/.node-red
npm link node-red-contrib-tafy
```

## Available Nodes

### Communication Nodes

#### tafy-nats-pub

Publishes messages to NATS subjects.

- **Input**: Any payload (objects are JSON stringified)
- **Config**: NATS server, subject pattern
- **Output**: None (publishes to NATS)

#### tafy-nats-sub

Subscribes to NATS subjects with wildcard support.

- **Input**: None
- **Config**: NATS server, subject pattern
- **Output**: Received messages

### Control Nodes

#### tafy-motor-control

Sends HAL-compliant motor control commands.

- **Input**: Speed commands (linear/angular)
- **Config**: Device ID, drive type
- **Output**: HAL message for publishing

#### tafy-hal-command

Generic HAL command builder for any device capability.

- **Input**: Command payload
- **Config**: Schema, device ID, capabilities
- **Output**: Complete HAL envelope

### Sensor Nodes

#### tafy-sensor-range

Processes range sensor data from HAL messages.

- **Input**: HAL sensor message
- **Config**: Sensor ID, units
- **Output**: Parsed sensor reading

#### tafy-hal-telemetry

Parses HAL telemetry messages from devices.

- **Input**: HAL telemetry message
- **Config**: Schema filter
- **Output**: Parsed telemetry data

### Device Management

#### tafy-device-discovery

Monitors device discovery events.

- **Input**: None (subscribes to discovery)
- **Config**: Device type filter
- **Output**: Discovered device info

### Input Nodes

#### tafy-gamepad

Reads gamepad/joystick input for robot control.

- **Input**: None (polls gamepad)
- **Config**: Gamepad index, dead zones
- **Output**: Joystick values

## Example Flows

### Basic Teleop Control

```json
[
    {
        "id": "gamepad-1",
        "type": "tafy-gamepad",
        "name": "Xbox Controller",
        "gamepadIndex": 0,
        "deadzone": 0.1
    },
    {
        "id": "motor-1",
        "type": "tafy-motor-control",
        "name": "Robot Motors",
        "deviceId": "esp32-robot",
        "driveType": "differential"
    },
    {
        "id": "pub-1",
        "type": "tafy-nats-pub",
        "name": "Send Command",
        "subject": "hal.v1.motor.cmd"
    }
]
```

### Device Discovery Monitor

```json
[
    {
        "id": "discovery-1",
        "type": "tafy-device-discovery",
        "name": "Find ESP32 Devices",
        "deviceType": "esp32"
    },
    {
        "id": "debug-1",
        "type": "debug",
        "name": "Show Devices"
    }
]
```

## NATS Subject Conventions

The nodes follow Tafy's NATS subject naming conventions:

- `device.{device_id}.{action}` - Device-specific messages
- `hal.v1.{type}.{action}` - HAL protocol messages
- `node.{node_id}.{event}` - Node lifecycle events
- `hub.events.{type}` - Hub event stream

## HAL Message Format

All HAL messages follow this structure:

```javascript
{
    "hal_major": 1,
    "hal_minor": 0,
    "schema": "tafylabs/hal/motor/differential/1.0",
    "device_id": "esp32-a4cf12",
    "caps": ["motor.differential:v1.0"],
    "ts": "2024-03-14T10:30:00.000Z",
    "payload": {
        // Schema-specific payload
    }
}
```

## Configuration

### NATS Connection

1. Add a `tafy-nats-config` node
2. Set server URL (e.g., `nats://localhost:4222`)
3. Add credentials if required
4. Use this config in all NATS nodes

### Device IDs

Device IDs can be:

- Static strings: `"esp32-robot"`
- From message: `msg.deviceId`
- From flow/global context

## Troubleshooting

### NATS Connection Issues

- Verify NATS server is running: `nats-server -V`
- Check server URL format: `nats://host:port`
- Ensure network connectivity
- Check firewall rules for port 4222

### No Messages Received

- Verify subject patterns match
- Check NATS server logs
- Use NATS CLI to test: `nats sub "device.>"`
- Enable Node-RED debug logging

### HAL Message Validation

- Use debug nodes to inspect message structure
- Verify all required fields are present
- Check timestamp format (ISO 8601)
- Validate against schema

## Development

### Adding New Nodes

1. Create `.js` and `.html` files in `nodes/`
2. Add to `package.json` node-red section
3. Follow Node-RED node conventions
4. Test with node-red-node-test-helper

### Testing

```bash
npm test
```

### Publishing

```bash
npm version patch
npm publish
```

## License

Apache 2.0 - See LICENSE file
