# Tafy Studio

A Robot Distributed Operation System (RDOS) that makes robotics accessible to everyone.

## What is Tafy Studio?

Tafy Studio is a comprehensive framework for building and operating robots. Unlike traditional approaches that treat robots as single computers with peripherals, Tafy Studio embraces the distributed nature of modern robotics—where multiple compute nodes work together as a cohesive system.

**Note:** We intentionally use "operation system" rather than "operating system." Tafy Studio orchestrates robot operations across distributed nodes; it is not an OS in the traditional sense.

## Project Status

🚧 **Early Development** - We're building the foundation for the 30-minute quick start experience.

### Current Progress:
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

- [Vision](docs/VISION.md) - Project philosophy and goals
- [Architecture](docs/ARCHITECTURE.md) - Technical design and structure
- [Concepts](docs/CONCEPTS.md) - Key terminology explained
- [Development Setup](docs/DEVELOPMENT_SETUP.md) - Get started contributing

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

# Install dependencies
npm install

# Start local development services
docker-compose -f docker-compose.dev.yml up -d

# Run development servers
npm run dev

# Access the Hub UI
open http://localhost:3000
```

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.
