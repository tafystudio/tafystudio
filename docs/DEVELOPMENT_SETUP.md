# Tafy Studio Development Setup

## Overview

This guide helps developers set up their environment for contributing to Tafy Studio. We use a monorepo structure with multiple languages and target multiple architectures.

## Prerequisites

### Required Tools
- **Node.js** 20+ and pnpm 9+
- **Go** 1.23+
- **Python** 3.11+ with uv
- **Docker** with buildx plugin
- **Git** 2.30+

### Recommended Tools
- **k3d** - Local Kubernetes for testing
- **kubectl** - Kubernetes CLI
- **helm** - Kubernetes package manager
- **VS Code** - With recommended extensions

### Installing Package Managers
```bash
# Install pnpm
npm install -g pnpm

# Install uv (Python)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Platform-Specific

#### macOS
```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install tools
brew install node go python@3.11 helm k3d kubectl
brew install --cask docker visual-studio-code
```

#### Linux (Ubuntu/Debian)
```bash
# Add repositories
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -

# Install tools
sudo apt update
sudo apt install -y nodejs golang python3 python3-pip docker.io
sudo snap install helm --classic
sudo snap install kubectl --classic

# Install k3d
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
```

## Repository Setup

### 1. Clone the Repository
```bash
git clone https://github.com/tafystudio/tafystudio.git
cd tafystudio
```

### 2. Initialize Monorepo
```bash
# Install dependencies with pnpm
pnpm install
```

### 3. Environment Configuration
```bash
# Create environment files (if needed)
echo "NATS_URL=nats://localhost:4222" > apps/hub-api/.env
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > apps/hub-ui/.env.local
```

## Development Workflow

### Local Kubernetes Cluster

Start a local k3s cluster for development:

```bash
# Create cluster with registry
k3d cluster create tafy-dev \
  --servers 1 \
  --agents 2 \
  --port 9080:80@loadbalancer \
  --port 9443:443@loadbalancer \
  --registry-create tafy-registry:5000 \
  --k3s-arg "--disable=traefik@server:0"

# Verify cluster
kubectl get nodes
```

### Deploy Core Services

```bash
# Add Helm repos
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm repo add traefik https://helm.traefik.io/traefik
helm repo update

# Install NATS
helm install nats nats/nats \
  --set cluster.enabled=true \
  --set cluster.replicas=1

# Install Traefik
helm install traefik traefik/traefik \
  --set ports.web.port=9080 \
  --set ports.websecure.port=9443

# Deploy Tafy services
make deploy-dev
```

### Running Services Locally

For rapid development, run services outside Kubernetes:

```bash
# Start infrastructure services with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Run all services in development mode (using Turborepo)
pnpm run dev

# Or run individual services:

# Terminal 1: Run Hub UI
cd apps/hub-ui
pnpm run dev

# Terminal 2: Run Hub API
cd apps/hub-api
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .
uvicorn main:app --reload

# Terminal 3: Run Node Agent
cd apps/tafyd
go run . --debug

# Access services:
# Hub UI: http://localhost:3000
# Hub API: http://localhost:8000
# API Docs: http://localhost:8000/docs
# NATS Monitor: http://localhost:8222
# Node-RED: http://localhost:1880
```

### Building Components

```bash
# Build everything
turbo build

# Build specific app
turbo build --filter=hub-ui

# Build with watching
turbo dev

# Build Docker images
make docker-build

# Build for multiple architectures
make docker-build-multiarch
```

## Testing

### Unit Tests
```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm test --filter=sdk-ts

# Run with coverage
pnpm test:coverage
```

### Integration Tests
```bash
# Run integration tests (requires local cluster)
make test-integration

# Run HAL compliance tests
cd tests/hal-compliance
go test ./...
```

### E2E Tests
```bash
# Run end-to-end tests
cd tests/e2e
npm run test:e2e
```

## Code Style

### Linting
```bash
# Run all linters
turbo lint

# Fix auto-fixable issues
turbo lint:fix

# Type checking
turbo typecheck
```

### Formatting
We use:
- **Prettier** for TypeScript/JavaScript
- **Black** for Python
- **gofmt** for Go

### Frontend Notes
- **Tailwind CSS v4**: We use Tailwind CSS v4 which requires the `@tailwindcss/postcss` plugin. This is already configured in the hub-ui project.

```bash
# Format all code
turbo format

# Check formatting
turbo format:check
```

## Working with Different Components

### Hub UI (Next.js)
```bash
cd apps/hub-ui
npm run dev           # Start dev server
npm run build         # Production build
npm run storybook     # Component development
```

### Hub API (FastAPI)
```bash
cd apps/hub-api
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements-dev.txt
uvicorn main:app --reload
```

### Node Agent (Go)
```bash
cd apps/tafyd
go mod download
go run . --debug      # Run with debug logging
go build             # Build binary
```

### Firmware (PlatformIO)
```bash
cd firmware/esp32
pio run              # Build all environments
pio run -e esp32dev  # Build specific board
pio run -t upload    # Flash to connected board
pio device monitor   # Serial monitor
```

### Node-RED Nodes
```bash
cd packages/node-red-contrib-tafy
npm link             # Link for local development
cd ~/.node-red       # Or your Node-RED user directory
npm link @tafy/node-red-contrib-tafy
```

## Debugging

### VS Code Launch Configurations
The repository includes launch configurations for:
- Hub UI (Next.js debugging)
- Hub API (Python debugging)
- Node Agent (Go debugging with Delve)
- Jest tests

### Remote Debugging
For debugging on actual hardware:

```bash
# Forward ports from remote device
ssh -L 9229:localhost:9229 pi@raspberrypi.local

# Or use kubectl for k8s pods
kubectl port-forward pod/hub-api-xxx 5678:5678
```

### Common Issues

#### Port Conflicts
```bash
# Find what's using a port
lsof -i :4222  # macOS/Linux
netstat -ano | findstr :4222  # Windows

# Kill process using port
kill -9 <PID>
```

#### Docker Build Issues
```bash
# Clean Docker cache
docker system prune -a

# Build with no cache
docker build --no-cache .

# Check buildx
docker buildx ls
```

#### NATS Connection Issues
```bash
# Test NATS connection
nats-cli ping

# Monitor NATS traffic
nats-cli sub ">"
```

## Making Changes

### Feature Development
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following code style
3. Write/update tests
4. Update documentation
5. Run `turbo test lint typecheck`
6. Commit with conventional commits
7. Push and create PR

### Commit Convention
We use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `test:` Test only
- `refactor:` Code change that neither fixes nor adds
- `chore:` Build process or auxiliary tool changes

### Pull Request Process
1. PR title follows conventional commit format
2. Description explains what and why
3. All CI checks pass
4. At least one review approval
5. Squash and merge

## Performance Profiling

### Go Services
```bash
# CPU profiling
go test -cpuprofile=cpu.prof -bench=.
go tool pprof cpu.prof

# Memory profiling
go test -memprofile=mem.prof -bench=.
go tool pprof mem.prof
```

### Node.js Services
```bash
# Start with profiling
node --inspect apps/hub-api/dist/index.js

# Connect Chrome DevTools
# Navigate to chrome://inspect
```

## Release Process

### Version Bumps
```bash
# Bump version (follows semver)
npm run version:patch  # 1.0.0 -> 1.0.1
npm run version:minor  # 1.0.0 -> 1.1.0
npm run version:major  # 1.0.0 -> 2.0.0
```

### Building Release Artifacts
```bash
# Build all release artifacts
make release

# Sign images
make sign-images

# Generate SBOM
make sbom
```

## Useful Commands

```bash
# Watch logs from all services
kubectl logs -f -l app=tafy --all-containers

# SSH into k3d node
docker exec -it k3d-tafy-dev-agent-0 sh

# Clean everything
make clean
k3d cluster delete tafy-dev

# Update all dependencies
make update-deps

# Generate API clients from OpenAPI
make generate-api-clients

# Run security scan
make security-scan
```

## Getting Help

- Check existing issues on GitHub
- Join our Discord community
- Read the architecture docs
- Ask in the #development channel

Remember: when in doubt, ask! We're here to help you contribute successfully.