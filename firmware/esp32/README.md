# Tafy ESP32 Firmware

ESP32 firmware for Tafy Studio robot nodes. Provides HAL-compliant motor control, sensor reading, and network connectivity.

## Features

- **WiFi Manager**: Web-based configuration portal for network setup
- **mDNS Discovery**: Automatic device advertisement and discovery
- **NATS Integration**: Pub/sub messaging via MQTT bridge
- **Motor Control**: Differential drive with PWM control
- **Sensor Support**: Time-of-flight distance sensor
- **HAL Compliance**: Follows Tafy HAL message specification
- **OTA Updates**: Over-the-air firmware updates (planned)

## Hardware Requirements

### Supported Boards

- ESP32 DevKit
- ESP32-C3
- ESP32-S3

### Pin Configuration

#### Motor Control (Differential Drive)

- Left Motor PWM: GPIO 25
- Left Motor DIR1: GPIO 26
- Left Motor DIR2: GPIO 27
- Right Motor PWM: GPIO 32
- Right Motor DIR1: GPIO 33
- Right Motor DIR2: GPIO 34

#### Sensors

- ToF SDA: GPIO 21
- ToF SCL: GPIO 22
- ToF XSHUT: GPIO 23

## Building and Flashing

### Prerequisites

1. Install [PlatformIO](https://platformio.org/install)
2. Clone this repository

### Build

```bash
cd firmware/esp32
pio run
```

### Flash

```bash
# For ESP32
pio run -t upload -e esp32dev

# For ESP32-C3
pio run -t upload -e esp32-c3

# For ESP32-S3
pio run -t upload -e esp32-s3
```

### Monitor Serial Output

```bash
pio device monitor
```

## First Time Setup

1. Power on the ESP32
2. Connect to WiFi AP: `Tafy-ESP32-XXXXXX`
3. Open browser to: `192.168.4.1`
4. Enter your WiFi credentials
5. Optionally enter NATS server URL
6. Device will restart and connect

## Serial Commands

Connect via serial monitor (115200 baud) for debugging:

- `info` - Display device information
- `restart` - Restart the device
- `motor <left> <right>` - Set motor speeds (-100 to 100)

## HAL Capabilities

This firmware implements:

- `motor.differential:v1.0` - Differential drive motor control
- `sensor.range.tof:v1.0` - Time-of-flight distance sensor

## NATS Topics

### Subscriptions

- `device.{device_id}.command` - Device-specific commands
- `hal.v1.motor.cmd` - Motor control commands
- `hal.v1.system.cmd` - System commands

### Publications

- `node.{device_id}.heartbeat` - Periodic heartbeat
- `hal.v1.sensor.range.data` - Range sensor readings
- `hal.v1.motor.telemetry` - Motor telemetry

## Development

### Project Structure

```text
firmware/esp32/
├── src/              # Source files
├── include/          # Header files
├── lib/              # Private libraries
├── test/             # Unit tests
└── platformio.ini    # PlatformIO configuration
```

### Adding New Sensors

1. Create sensor class in `include/` and `src/`
2. Add initialization in `setup()`
3. Add update call in `loop()`
4. Register HAL handler if needed
5. Update capabilities in mDNS TXT records

### MQTT Bridge

Currently using MQTT as transport (NATS MQTT bridge required).
Future versions will use native NATS protocol.

## Troubleshooting

### WiFi Connection Issues

- Ensure credentials are correct
- Check router supports 2.4GHz
- Try closer to router
- Reset settings by holding BOOT button on startup

### Motor Not Working

- Check motor driver connections
- Verify power supply is adequate
- Test with serial commands
- Check emergency stop status

### Sensor Not Detected

- Verify I2C connections (SDA/SCL)
- Check pull-up resistors (usually built-in)
- Run I2C scanner sketch
- Check sensor power (3.3V)

## License

Apache 2.0 - See LICENSE file in repository root
