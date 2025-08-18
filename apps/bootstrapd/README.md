# Bootstrapd - Pre-K3s Bootstrap Service

Bootstrapd is a lightweight service that prepares nodes for joining a Tafy Studio robot cluster. It handles initial device provisioning,
network configuration, and k3s installation before the main Tafy agent (tafyd) takes over.

## Overview

Bootstrapd provides:

- **Zero-touch provisioning**: Automatic node discovery and setup
- **Network configuration**: mDNS, DHCP, and network interface setup
- **Security bootstrapping**: Initial certificate and key generation
- **K3s installation**: Automated k3s setup and cluster joining
- **Hardware detection**: Capability discovery and registration
- **Minimal footprint**: Designed to run on resource-constrained devices

## Architecture

Bootstrapd is designed to be:

- **Stateless**: No persistent storage required
- **Idempotent**: Safe to run multiple times
- **Lightweight**: Minimal dependencies
- **Cross-platform**: Runs on ARM, ARM64, and x86_64

## Workflow

1. **Discovery Phase**
   - Announces presence via mDNS
   - Listens for hub discovery
   - Establishes initial connection

2. **Configuration Phase**
   - Receives configuration from hub
   - Sets up networking
   - Configures system parameters

3. **Installation Phase**
   - Downloads and installs k3s
   - Joins k3s cluster
   - Installs tafyd as k3s workload

4. **Handoff Phase**
   - Verifies tafyd is running
   - Transfers control to tafyd
   - Optionally self-removes

## Getting Started

### Prerequisites

- Linux-based OS (Ubuntu, Debian, Alpine, Raspbian)
- Network connectivity
- Root or sudo access

### Installation

#### Quick Install (curl)

```bash
curl -sfL https://get.tafy.studio/bootstrap | sh -
```

#### Manual Installation

```bash
# Download latest release
wget https://github.com/tafystudio/tafystudio/releases/latest/download/bootstrapd-linux-arm64

# Make executable
chmod +x bootstrapd-linux-arm64

# Run with sudo
sudo ./bootstrapd-linux-arm64
```

### Configuration

Bootstrapd can be configured via:

1. **Environment variables**
2. **Command-line flags**
3. **Auto-discovery from hub**

#### Environment Variables

```bash
# Hub discovery
TAFY_HUB_URL=http://hub.tafy.local:8000
TAFY_HUB_TOKEN=optional-pre-shared-token

# Network configuration
TAFY_INTERFACE=eth0
TAFY_HOSTNAME=robot-node-1

# K3s configuration
TAFY_K3S_VERSION=v1.29.0+k3s1
TAFY_K3S_TOKEN=cluster-join-token
TAFY_K3S_URL=https://hub.tafy.local:6443

# Bootstrap behavior
TAFY_SELF_REMOVE=true
TAFY_SKIP_K3S=false
```

#### Command-line Flags

```bash
bootstrapd \
  --hub-url http://hub.tafy.local:8000 \
  --interface eth0 \
  --hostname robot-pi-1 \
  --debug
```

## Features

### Auto-discovery

Bootstrapd uses mDNS to announce itself and discover the hub:

```text
_tafy-node._tcp.local.    -> Node announcement
_tafy-hub._tcp.local.     -> Hub discovery
```

### Hardware Detection

Automatically detects and reports:

- CPU architecture and cores
- Memory capacity
- Network interfaces
- GPIO availability (Raspberry Pi)
- I2C/SPI devices
- USB devices

### Network Configuration

- Configures static IP if provided
- Sets up mDNS hostname
- Configures DNS servers
- Manages firewall rules

### Security

- Generates unique node ID
- Creates node certificate
- Establishes secure connection to hub
- Manages k3s join tokens

## Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/tafystudio/tafystudio
cd tafystudio/apps/bootstrapd

# Build for current platform
go build -o bootstrapd

# Cross-compile for Raspberry Pi
GOOS=linux GOARCH=arm64 go build -o bootstrapd-linux-arm64

# Build minimal static binary
CGO_ENABLED=0 GOOS=linux go build -a -ldflags '-extldflags "-static"' -o bootstrapd-static
```

### Testing

```bash
# Run unit tests
go test ./...

# Run integration tests
go test -tags=integration ./...

# Test in Docker
docker build -t bootstrapd-test .
docker run --rm --privileged bootstrapd-test
```

## Deployment Methods

### Systemd Service

```ini
# /etc/systemd/system/bootstrapd.service
[Unit]
Description=Tafy Bootstrap Service
Before=k3s.service
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/bootstrapd
RemainAfterExit=yes
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Cloud-init

```yaml
#cloud-config
runcmd:
  - curl -sfL https://get.tafy.studio/bootstrap | sh -
```

### Raspberry Pi Imager

Custom image with bootstrapd pre-installed for true zero-touch setup.

## Supported Platforms

- **Raspberry Pi**: All models (Pi Zero to Pi 5)
- **NVIDIA Jetson**: Nano, Xavier NX, Orin
- **x86_64**: Intel NUC, standard PCs
- **ARM SBCs**: Orange Pi, Rock Pi, etc.

## Troubleshooting

### Common Issues

1. **Cannot find hub**
   - Check network connectivity
   - Verify hub is running
   - Check mDNS/Avahi service

2. **K3s installation fails**
   - Verify internet connectivity
   - Check disk space
   - Review k3s requirements

3. **Permission denied**
   - Run with sudo
   - Check SELinux/AppArmor policies

### Debug Mode

```bash
# Enable debug logging
bootstrapd --debug

# Dry run (no changes)
bootstrapd --dry-run

# Skip k3s installation
bootstrapd --skip-k3s
```

### Logs

```bash
# View logs
journalctl -u bootstrapd

# Follow logs
journalctl -u bootstrapd -f
```

## Contributing

See the main project [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](../../LICENSE) for details.
