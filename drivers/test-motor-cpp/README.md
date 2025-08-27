# motor Driver

motor actuator driver for Tafy RDOS

## Overview

This is a HAL-compliant actuator driver for Tafy RDOS. It provides the capability: `actuator.motor`

## Features

- HAL v1.0 compliant messaging
- NATS-based communication with C++ client
- Prometheus metrics
- Health monitoring via HTTP
- Docker container support
- Modern C++17 implementation

## Requirements

- C++17 compiler (GCC 9+ or Clang 10+)
- CMake 3.14+
- NATS C client library
- yaml-cpp
- nlohmann/json
- prometheus-cpp

## Quick Start

1. Build the driver:

   ```bash
   make build
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

- `hal.v1.actuator.motor.data` - Actuator data
- `hal.v1.device.telemetry` - Device telemetry

### Subscribed Topics  

- `hal.v1.actuator.motor.cmd` - Commands
- `hal.v1.device.config` - Configuration updates

## License

Apache 2.0
