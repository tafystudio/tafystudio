# Tafy Studio Architecture

## Overview

Tafy Studio is a Robot Distributed Operation System (RDOS) built on modern cloud-native technologies adapted for edge
robotics. It provides a complete stack from hardware abstraction to visual programming, enabling rapid robot
development and deployment.

## Core Architecture Principles

1. **Distributed First**: Robots are multi-node systems, not monoliths
2. **Message-Driven**: All communication via pub/sub and request/reply patterns
3. **Container-Native**: Every component runs in containers orchestrated by k3s
4. **Schema-Driven**: Strongly typed messages with evolution support
5. **Local-First**: Full functionality without internet connectivity

## System Layers

### 1. Infrastructure Layer

#### Orchestration

- **k3s**: Lightweight Kubernetes for edge devices
- **Helm**: Package management for deploying components
- **Container Runtime**: Multi-architecture support (arm64/amd64)

#### Networking

- **mDNS/Avahi**: Local device discovery
- **Traefik**: Ingress controller (included with k3s)
- **CoreDNS**: Service discovery within cluster

### 2. Messaging Layer

#### NATS Core

- Central nervous system for all robot communication
- Topics organized by capability: `hal.v1.motor.cmd`, `hal.v1.sensor.range`
- Request/reply for command/response patterns
- Pub/sub for streaming telemetry

#### NATS JetStream (Phase 3+)

- Persistent message streams
- KV store for configuration and device registry
- Object store for firmware, models, logs

#### Peer-to-Peer (Future)

- libp2p for robot-to-robot communication
- NAT traversal for cloud connectivity
- Circuit relay for difficult network environments

### 3. Hardware Abstraction Layer (HAL)

#### Message Schema

- JSON Schema (initially), Protobuf (future)
- Versioned schemas with migration support
- Self-describing messages with capability declaration

#### Driver Model

- Containerized drivers for Linux devices
- Firmware templates for microcontrollers
- Automatic capability detection and binding

#### Standard Capabilities

- Motor control (differential, servo, stepper)
- Sensors (range, IMU, temperature, GPS)
- Cameras (USB, CSI, IP)
- Actuators (gripper, LED, relay)

### 4. Control Plane

#### Hub Services

- **Hub UI**: Next.js web interface
- **Hub API**: FastAPI backend (BFF pattern)
- **Device Registry**: Tracks all discovered devices
- **Flow Engine**: Node-RED runtime with custom nodes

#### Node Agent (`tafyd`)

- Go service running on each compute node
- Handles device discovery and heartbeat
- Manages driver containers
- Reports telemetry and health

### 5. User Experience Layer

#### Visual Programming

- Node-RED for flow-based programming
- Curated palette of robot-specific nodes
- Pre-built flows for common behaviors

#### Web Technologies

- WebSerial for flashing firmware
- WebRTC for video streaming
- WebSocket for real-time updates

#### SDKs

- TypeScript SDK for web development
- Python SDK for research/education
- Go SDK for system components

## Component Architecture

### Monorepo Structure

```plaintext
tafystudio/
├── apps/
│   ├── hub-ui/          # Next.js frontend
│   ├── hub-api/         # FastAPI backend
│   ├── tafyd/           # Go node agent
│   └── bootstrapd/      # Pre-k3s bootstrap
├── packages/
│   ├── sdk-ts/          # TypeScript SDK
│   ├── sdk-python/      # Python SDK
│   ├── hal-schemas/     # Message schemas
│   └── node-red-contrib-tafy/  # Custom nodes
├── firmware/
│   ├── esp32/           # ESP32 templates
│   └── templates/       # Other MCU templates
├── drivers/
│   ├── motor-pwm/       # PWM motor driver
│   ├── camera-usb/      # USB camera driver
│   └── ...              # Additional drivers
└── charts/
    ├── hub/             # Hub Helm chart
    ├── nats/            # NATS configuration
    └── node-red/        # Node-RED deployment
```

### Deployment Architecture

#### Single Node

- All services on one device (Raspberry Pi)
- k3s in single-node mode
- Suitable for simple robots

#### Multi-Node Cluster

- Hub on primary node
- Compute nodes join via k3s token
- Automatic workload distribution
- GPU nodes for vision/AI workloads

#### Hybrid Cloud (Future)

- NATS leaf nodes for cloud bridge
- Remote monitoring and control
- Selective data synchronization

## Key Design Decisions

### Why k3s?

- Lightweight (~50MB binary)
- Built for edge/ARM devices
- Includes batteries (ingress, DNS, load balancer)
- Standard Kubernetes API

### Why NATS?

- Minimal footprint (~15MB)
- Built-in clustering
- Multiple messaging patterns
- Integrated persistence (JetStream)

### Why Go?

- Single binary deployment
- Excellent cross-compilation
- Low memory footprint
- Strong standard library

### Why Node-RED?

- Proven visual programming
- Extensive node ecosystem
- Embeddable runtime
- Soft real-time sufficient

## Communication Patterns

### Device Discovery

```plaintext
MCU powers on → mDNS broadcast → Agent discovers → 
Registers in NATS KV → Hub UI updates → Available in flows
```

### Command/Response

```plaintext
Flow sends command → NATS request → Driver receives →
Executes → Replies with result → Flow continues
```

### Telemetry Streaming

```plaintext
Sensor reads → Driver publishes → NATS topic →
Multiple subscribers → Dashboard, logging, algorithms
```

### Firmware Updates

```plaintext
New firmware available → Hub notifies → User approves →
Download to agent → Flash device → Verify → Report success
```

## Security Model

### Network Security

- TLS everywhere (NATS, HTTPS)
- mTLS for service-to-service
- Network isolation via k3s

### Access Control

- OIDC integration for users
- RBAC for permissions
- Service accounts for automation

### Supply Chain

- Signed container images (cosign)
- SBOM generation
- Dependency scanning

## Performance Targets

### Latency

- Local message passing: <5ms
- Command/response: <20ms
- Video streaming: <100ms
- Suitable for soft real-time control

### Scalability

- Single node: 10+ drivers
- Multi-node: 50+ devices
- Message throughput: 10k msgs/sec

### Resource Usage

- Hub services: <500MB RAM
- Node agent: <50MB RAM
- NATS: <100MB RAM
- Leaves headroom for user workloads

## Future Architecture Evolution

### Phase 1: MVP

- Core messaging and discovery
- Basic HAL implementation
- Three working demos

### Phase 2: Production

- Persistent messaging (JetStream)
- Multi-node clustering
- GPU workload scheduling

### Phase 3: Scale

- P2P robot swarms
- Cloud federation
- Advanced AI/ML pipelines

### Phase 4: Enterprise

- Multi-tenancy
- Audit logging
- Compliance features
