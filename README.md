# Tafy Studio

[![CI](https://github.com/tafystudio/tafystudio/actions/workflows/ci.yml/badge.svg)](https://github.com/tafystudio/tafystudio/actions/workflows/ci.yml)
[![Tests](https://github.com/tafystudio/tafystudio/actions/workflows/test.yml/badge.svg)](https://github.com/tafystudio/tafystudio/actions/workflows/test.yml)
[![Docs](https://github.com/tafystudio/tafystudio/actions/workflows/docs.yml/badge.svg)](https://github.com/tafystudio/tafystudio/actions/workflows/docs.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A Robot Distributed Operation System (RDOS) that makes robotics accessible to everyone.

## What is Tafy Studio?

Tafy Studio is a comprehensive framework for building and operating robots. Unlike traditional approaches that treat robots as single computers with peripherals,
Tafy Studio embraces the distributed nature of modern robotics—where multiple compute nodes work together as a cohesive system.

**Note:** We intentionally use "operation system" rather than "operating system." Tafy Studio orchestrates robot operations across distributed nodes; it is not an OS in the traditional sense.

## Project Status

🚧 **Early Development** - We're building the foundation for the 30-minute quick start experience.

### Current Progress

- ✅ Monorepo structure with Turborepo
- ✅ Hub UI (Next.js) - Basic structure
- ✅ Hub API (FastAPI) - Core endpoints
- ✅ Node Agent (Go) - Device discovery
- ✅ CI/CD Pipeline - Multi-arch builds
- 🚧 HAL implementation - In progress
- 🚧 ESP32 firmware - Coming soon
- 🚧 Node-RED integration - Coming soon

## Key Features

- **30-Minute Quick Start**: From installation to moving robot in under 30 minutes
- **Plug-and-Play Hardware**: Automatic discovery and configuration of devices
- **Visual Programming**: Build complex behaviors without writing code
- **Distributed Architecture**: Seamlessly scale from one to many compute nodes
- **Local-First Design**: Full functionality without internet connectivity

## Documentation

### Getting Started

- [Vision](docs/VISION.md) - Project philosophy and goals
- [Concepts](docs/CONCEPTS.md) - Key terminology explained
- [Architecture](docs/ARCHITECTURE.md) - Technical design and structure

### Building Robots

- [Hardware BOM](docs/HARDWARE_BOM.md) - Parts list for different robot types
- [Wiring Diagrams](docs/WIRING_DIAGRAMS.md) - How to connect components
- [Assembly Guide](docs/ASSEMBLY_GUIDE.md) - Step-by-step build instructions
- [Node-RED Quick Start](packages/node-red-contrib-tafy/docs/QUICKSTART.md) - Program your robot in 30 minutes

### Development

- [Development Setup](docs/DEVELOPMENT_SETUP.md) - Get started contributing
- [Driver Development](docs/DRIVER_DEVELOPMENT.md) - Create HAL-compliant hardware drivers
- [Testing Guide](docs/TESTING.md) - Testing strategy and practices
- [Security Policy](docs/SECURITY.md) - Security practices and vulnerability reporting

## Quick Start

### For Users (Coming Soon)

```bash
# Install Tafy Studio
curl -fsSL get.tafy.sh | bash

# Access the Hub UI
open https://tafy.local
```

### For Developers

```bash
# Clone the repository
git clone https://github.com/tafystudio/tafystudio.git
cd tafystudio

# Install required tools
make install-tools

# Install dependencies
make install

# Start local development services
docker-compose -f docker-compose.dev.yml up -d

# Run development servers
make dev

# Run tests
make test

# Access the Hub UI
open http://localhost:3000

# See all available commands
make help
```

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.
