# ultrasonic Driver

ultrasonic sensor driver for Tafy RDOS

## Overview

This is a HAL-compliant sensor driver for Tafy RDOS. It provides the capability: `sensor.ultrasonic`

## Features

- HAL v1.0 compliant messaging
- NATS-based communication  
- Prometheus metrics
- Health monitoring
- Docker container support
- Type hints and async/await

## Quick Start

1. Install dependencies:

   ```bash
   uv pip install -r requirements.txt
   ```

2. Run locally:

   ```bash
   make run
   ```

3. Run tests:

   ```bash
   make test
   ```

## Configuration

See `config/default.yaml` for available configuration options.

## HAL Messages

### Published Topics

- `hal.v1.sensor.ultrasonic.data` - Sensor data
- `hal.v1.device.telemetry` - Device telemetry

### Subscribed Topics  

- `hal.v1.sensor.ultrasonic.cmd` - Commands
- `hal.v1.device.config` - Configuration updates

## License

Apache 2.0
