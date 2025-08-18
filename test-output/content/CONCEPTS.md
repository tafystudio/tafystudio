# Tafy Studio Core Concepts

## Overview

This document explains the key concepts and terminology used throughout Tafy Studio. Understanding these concepts will help you navigate the documentation and build robots more effectively.

## Fundamental Concepts

### RDOS (Robot Distributed Operation System)

Unlike traditional robot frameworks that assume a single powerful computer, an RDOS recognizes that modern robots are
distributed systems with multiple compute nodes. Note: We use "operation system" rather than "operating system"
because Tafy Studio orchestrates robot operations across multiple nodes—it is not an operating system in the
traditional sense. Each node might have different capabilities (MCU for motor control, Pi for coordination, Jetson
for vision), and they need to work together seamlessly.

Key characteristics:

- Multi-node by design
- Automatic discovery and clustering
- Workload distribution based on capabilities
- Resilient to node failures

### Node

A compute device in your robot cluster. Nodes can be:

- **Host Node**: The primary node running Hub services
- **Compute Node**: Additional processing power (Raspberry Pi, Jetson, x86)
- **MCU Node**: Microcontrollers for real-time control (ESP32, Arduino)
- **Sensor Node**: Dedicated sensor processing units

### HAL (Hardware Abstraction Layer)

The HAL provides a uniform interface to hardware capabilities regardless of the underlying implementation. Instead of writing device-specific code, you interact with standardized messages.

Example:

- `hal.v1.motor.cmd` - Commands any motor driver
- `hal.v1.sensor.range` - Reads any distance sensor
- `hal.v1.camera.frame` - Gets frames from any camera

### Capability

A standardized function that hardware can provide. Capabilities are:

- Self-describing via discovery
- Version-tagged for compatibility
- Composable into complex behaviors

Common capabilities:

- `motor.differential` - Two-wheel differential drive
- `sensor.range.tof` - Time-of-flight distance sensing
- `vision.color.detect` - Color blob detection

### Driver

Software that bridges between hardware and the HAL. Drivers:

- Run in containers on Linux nodes
- Are embedded in firmware on MCUs
- Translate hardware-specific protocols to HAL messages
- Report their capabilities on startup

### Flow

A visual program created in Node-RED that defines robot behavior. Flows:

- Connect inputs (sensors, joysticks) to outputs (motors, lights)
- Process data with logic nodes
- Can be shared and remixed
- Run distributed across your cluster

### Hub

The central management interface for your robot cluster. The Hub provides:

- Web-based UI for configuration and monitoring
- Device registry and discovery
- Flow editor (Node-RED)
- Firmware flashing tools
- System health monitoring

### Agent

A service (`tafyd`) running on each node that:

- Announces the node via mDNS
- Manages driver containers
- Reports health and telemetry
- Handles firmware updates
- Provides local API access

## Architecture Concepts

### Message-Driven Architecture

All communication in Tafy Studio happens through messages:

- **Commands**: Request/reply for actions (move motor, take photo)
- **Telemetry**: Continuous streams of data (IMU readings, battery level)
- **Events**: Notifications of state changes (obstacle detected, goal reached)

### Subject-Based Routing

NATS subjects organize messages hierarchically:

```plaintext
hal.v1.motor.cmd           # Motor commands
hal.v1.motor.state         # Motor state updates
robot.42.telemetry.battery # Specific robot battery data
flow.kitchen.event.done    # Flow completion event
```

### Discovery Protocol

How devices find each other:

1. Device broadcasts mDNS service (`_tafynode._tcp`)
2. Agent discovers and queries capabilities
3. Device registered in KV store
4. Hub notifies UI of new device
5. Device available in flows

### Containerized Drivers

Linux drivers run as containers because:

- Isolation from system
- Easy dependency management
- Consistent across platforms
- Simple updates
- Resource limits

## Development Concepts

### Time to First Motion (TTFM)

The critical metric: how long from unboxing to seeing your robot move. Every design decision should reduce TTFM.

### Soft Real-Time

Tafy Studio targets 10-100ms latency, sufficient for most robotics tasks. This allows us to use:

- Standard Linux instead of RTOS
- Containers instead of native binaries
- Node.js/Python instead of only C++

### Convention Over Configuration

Smart defaults everywhere:

- Motors on pins 12/13? We'll configure differential drive
- USB camera detected? Available as video source
- Jetson node? Schedule AI workloads there

### Progressive Disclosure

Simple things should be simple:

- Beginners use pre-built flows
- Intermediate users modify flows
- Advanced users write custom nodes
- Experts build new drivers

## Operational Concepts

### Local-First Networking

The robot works without internet:

- mDNS for discovery (no DNS server)
- Local NATS cluster (no cloud broker)
- On-device UI (no cloud dashboard)

Cloud is enhancement, not requirement.

### Graceful Degradation

When components fail:

- Nodes can leave/join without stopping robot
- Flows continue with available devices
- Missing sensors return last known good value
- UI shows degraded state clearly

### Rolling Updates

Updates happen without stopping:

- New container versions deployed gradually
- Traffic shifts as health checks pass
- Rollback automatic on failures
- Firmware updates scheduled during idle

## Security Concepts

### Zero Trust Networking

Every connection authenticated:

- mTLS between services
- JWT tokens for API access
- Encrypted NATS connections
- No implicit trust

### Capability-Based Access

Permissions based on what you can do, not who you are:

- Nodes advertise capabilities
- Flows request capabilities
- Access granted to capability, not device

### Supply Chain Security

Trust but verify:

- Signed container images
- Reproducible builds
- SBOM for audit
- No phone-home telemetry

## Next Steps

Now that you understand the core concepts:

- Read the [Architecture](ARCHITECTURE.md) for technical details
- Follow the [Quickstart](QUICKSTART.md) to build your first robot
- Check the [HAL Specification](HAL_SPEC.md) to understand messages
- Join our community to ask questions and share projects
