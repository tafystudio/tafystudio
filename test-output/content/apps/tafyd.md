# Tafyd - Tafy Node Agent

Tafyd is the Go-based node agent for the Tafy Studio Robot Distributed Operation System (RDOS). It runs on each compute node in a robot cluster,
managing local resources and facilitating communication between hardware and the control plane.

## Overview

Tafyd acts as the local orchestrator on each node (MCU, Raspberry Pi, Jetson, x86), providing:

- Hardware abstraction layer (HAL) message routing
- Local resource management and monitoring
- NATS messaging integration
- Health checking and telemetry reporting
- Container/process lifecycle management

## Architecture

Tafyd follows a modular architecture:

- **Core**: Main agent loop and lifecycle management
- **HAL**: Hardware abstraction layer implementation
- **Transport**: NATS messaging and communication
- **Monitor**: Resource monitoring and telemetry
- **Registry**: Service and capability registration

## Getting Started

### Prerequisites

- Go 1.21 or higher
- NATS server (or connection to cluster)
- Linux-based operating system (Ubuntu, Debian, Alpine)

### Installation

```bash
# Build from source
go build -o tafyd ./cmd/tafyd

# Run with default configuration
./tafyd

# Run with custom NATS server
./tafyd --nats-url nats://localhost:4222
```

### Configuration

Tafyd can be configured via:

1. Command-line flags
2. Environment variables
3. Configuration file (`/etc/tafy/tafyd.yaml`)

Key configuration options:

```yaml
# tafyd.yaml
nats:
  url: nats://localhost:4222
  cluster: tafy-cluster
  
node:
  id: auto  # Auto-generate node ID
  name: robot-node-1
  capabilities:
    - motor.differential:v1.0
    - sensor.range:v1.0
    
telemetry:
  interval: 10s
  enabled: true
```

## Development

### Building

```bash
# Build for current platform
go build -o tafyd ./cmd/tafyd

# Cross-compile for ARM64 (Jetson/Pi)
GOOS=linux GOARCH=arm64 go build -o tafyd-arm64 ./cmd/tafyd

# Build with version info
go build -ldflags "-X main.version=v0.1.0" -o tafyd ./cmd/tafyd
```

### Testing

```bash
# Run unit tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run integration tests
go test -tags=integration ./...
```

### Project Structure

```text
tafyd/
├── cmd/
│   └── tafyd/        # Main application entry point
├── pkg/
│   ├── agent/        # Core agent implementation
│   ├── hal/          # Hardware abstraction layer
│   ├── transport/    # NATS messaging
│   └── monitor/      # Telemetry and monitoring
├── go.mod
├── go.sum
└── Dockerfile
```

## Deployment

### Docker

```bash
# Build Docker image
docker build -t tafystudio/tafyd:latest .

# Run container
docker run -d \
  --name tafyd \
  --network host \
  -v /etc/tafy:/etc/tafy \
  tafystudio/tafyd:latest
```

### Systemd

```ini
# /etc/systemd/system/tafyd.service
[Unit]
Description=Tafy Node Agent
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/tafyd
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## API

Tafyd exposes a local API for health checks and debugging:

- `GET /health` - Health check endpoint
- `GET /metrics` - Prometheus metrics
- `GET /debug/pprof` - Go profiling data (debug mode only)

## Contributing

See the main project [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](../../LICENSE) for details.
