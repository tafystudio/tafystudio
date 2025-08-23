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

- **k3d** (5.5+) - Local Kubernetes for testing
- **kubectl** (1.28+) - Kubernetes CLI
- **helm** (3.10+) - Kubernetes package manager
- **VS Code** - With recommended extensions
- **Playwright** - Cross-browser testing for WebSerial

### Installing Package Managers

```bash
# Install all required tools
make install-tools

# Or manually:
# Install pnpm
npm install -g pnpm

# Install uv (Python)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Installing Kubernetes Tools

These tools are required for local development with Node-RED and NATS:

#### All Platforms (using official scripts)

```bash
# Install k3d
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/$(uname -s | tr '[:upper:]' '[:lower:]')/$(uname -m)/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
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
# Add Node.js repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install basic tools
sudo apt update
sudo apt install -y nodejs golang python3 python3-pip docker.io

# Install Kubernetes tools via snap
sudo snap install helm --classic
sudo snap install kubectl --classic

# Install k3d
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

# Install pnpm
npm install -g pnpm

# Install uv for Python
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### Windows (WSL2)

```bash
# Use the Linux instructions above in WSL2
# Ensure Docker Desktop is installed and WSL2 integration is enabled
```

### Verify Installation

After installing the tools, verify they're working:

```bash
# Check versions
node --version      # Should be 20+
pnpm --version      # Should be 9+
go version          # Should be 1.23+
python3 --version   # Should be 3.11+
docker --version    # Should be 20+
k3d version         # Should be 5.5+
kubectl version --client  # Should be 1.28+
helm version        # Should be 3.10+
```

## Repository Setup

### 1. Clone the Repository

```bash
git clone https://github.com/tafystudio/tafystudio.git
cd tafystudio
```

### 2. Initialize Monorepo

```bash
# Install all dependencies
make install

# Or manually:
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
# Create cluster (if make command doesn't exist yet)
k3d cluster create tafy-dev --servers 1 --agents 2

# Or use make command if available
make cluster-create

# Check cluster status
kubectl get nodes
kubectl cluster-info

# Delete cluster when done
k3d cluster delete tafy-dev
# or
make cluster-delete
```

### Deploy Core Services

```bash
# Add Helm repos
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm repo add traefik https://helm.traefik.io/traefik
helm repo update

# Deploy NATS
helm install nats nats/nats -f charts/nats/values.yaml \
  --create-namespace --namespace tafy-system

# Deploy Node-RED
helm install node-red ./charts/node-red --namespace tafy-system

# Check deployments
kubectl get all -n tafy-system
```

### Node-RED Development

For visual robot programming with Node-RED:

```bash
# Port forward to access Node-RED UI
kubectl port-forward service/node-red-tafy-node-red 1880:1880 -n tafy-system

# Access Node-RED at http://localhost:1880
# Access Dashboard at http://localhost:1880/ui

# To develop custom nodes
cd packages/node-red-contrib-tafy
pnpm install
pnpm run build
```

### Running Services Locally

For rapid development, run services outside Kubernetes:

```bash
# Start infrastructure services with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Run all services in development mode
make dev

# Or run individual services:
make dev-ui      # Run Hub UI
make dev-api     # Run Hub API  
make dev-agent   # Run tafyd agent

# Forward ports from Kubernetes cluster
make port-forward

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
make build

# Build specific components
make build-ui      # Build hub-ui
make build-api     # Build hub-api
make build-agent   # Build tafyd agent

# Build Docker images
make docker-build      # Local architecture only
make docker-build-all  # Multi-arch (amd64, arm64)

# Push images to registry
make docker-push
```

## Testing

### Test Automation

We use automated testing across all components with Jest (React), pytest (Python), and standard Go testing.

```bash
# Run all tests
make test

# Run unit tests only  
make test-unit

# Run integration tests
make test-integration

# Run tests with coverage
make test-coverage

# Run tests in watch mode
make test-watch

# Run tests in Docker
make docker-test
```

### Component-Specific Testing

```bash
# Hub UI (Jest + Playwright)
cd apps/hub-ui
pnpm test              # Run tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage

# WebSerial browser testing
pnpm exec playwright install  # Install browsers (first time)
make test-webserial-mock      # Test without hardware
make test-webserial          # Test with ESP32 connected

# Hub API (pytest)
cd apps/hub-api
source .venv/bin/activate
pytest                 # Run tests
pytest -v              # Verbose
pytest --cov           # With coverage

# tafyd (Go test)
cd apps/tafyd
go test ./...          # Run all tests
go test -v ./...       # Verbose
go test -race ./...    # Race detection
go test -cover ./...   # With coverage
```

### CI/CD Test Pipeline

Tests automatically run on GitHub Actions for:

- Multiple Node.js versions (20, 22)
- Multiple Python versions (3.11, 3.12)
- Go 1.23
- Integration tests with Docker Compose
- Coverage reporting to Codecov
- Cross-browser testing with Playwright (Chrome, Edge, Firefox, Safari)

## Code Style

### Linting and Code Quality

```bash
# Run all linters
make lint

# Format all code
make format

# Run TypeScript type checking
make typecheck

# Run security vulnerability scans
make security-scan
```

### Formatting

We use:

- **Prettier** for TypeScript/JavaScript
- **Black** for Python
- **gofmt** for Go

### Frontend Notes

- **Tailwind CSS v4**: We use Tailwind CSS v4 which requires the `@tailwindcss/postcss` plugin. This is already configured in the hub-ui project.

```bash
# Install git pre-commit hooks
make install-hooks
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

#### WebSerial Testing

```bash
# Browser not found
pnpm exec playwright install chromium

# Permission denied on Linux
sudo usermod -a -G dialout $USER  # Then logout/login

# ESP32 not detected
ls /dev/tty.usbserial-* || ls /dev/ttyUSB*  # Check device
```

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

### Development

```bash
# Check if all tools are installed
make check-tools

# Update all dependencies to latest
make update-deps

# View logs from Kubernetes services
make logs
```

### Cleaning

```bash
# Clean build artifacts
make clean

# Deep clean (includes node_modules)
make clean-deep
```

### CI/CD Helpers

```bash
# Commands used by GitHub Actions
make ci-lint      # Run linters
make ci-test      # Run unit tests
make ci-build     # Build all packages
```

### Kubernetes Operations

```bash
# Deploy to local cluster
make deploy-dev

# Check cluster status
make cluster-status

# Forward ports for local access
make port-forward
```

### Complete Makefile Reference

Run `make help` to see all available commands with descriptions.

## Troubleshooting

### k3d Issues

#### k3d command not found

```bash
# Reinstall k3d
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
# Add to PATH if needed
export PATH=$PATH:/usr/local/bin
```

#### Cannot connect to Docker

```bash
# Ensure Docker is running
docker info

# On macOS, start Docker Desktop
# On Linux, start Docker service
sudo systemctl start docker
```

### kubectl Issues

#### kubectl: command not found

```bash
# Reinstall kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/$(uname -s | tr '[:upper:]' '[:lower:]')/$(uname -m)/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

#### The connection to the server localhost:xxxx was refused

```bash
# Check if cluster is running
k3d cluster list

# Create cluster if needed
k3d cluster create tafy-dev --servers 1 --agents 2

# Update kubeconfig
k3d kubeconfig merge tafy-dev --kubeconfig-switch-context
```

### Helm Issues

#### Error: Kubernetes cluster unreachable

```bash
# Check cluster connection
kubectl cluster-info

# Set correct context
kubectl config current-context
kubectl config use-context k3d-tafy-dev
```

#### Repository not found

```bash
# Re-add helm repositories
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm repo update
```

### Node-RED Access Issues

#### Cannot access <http://localhost:1880>

```bash
# Check if pod is running
kubectl get pods -n tafy-system

# Check logs
kubectl logs -n tafy-system deployment/node-red-tafy-node-red

# Restart port forwarding
kubectl port-forward service/node-red-tafy-node-red 1880:1880 -n tafy-system
```

### NATS Connection Issues

#### NATS not reachable from Node-RED

```bash
# Check NATS pods
kubectl get pods -n tafy-system | grep nats

# Test NATS connection
kubectl exec -it nats-box-xxx -n tafy-system -- nats sub ">"

# Check service DNS
kubectl exec -it node-red-pod-xxx -n tafy-system -- nslookup nats.tafy-system.svc.cluster.local
```

## Getting Help

- Check existing issues on GitHub
- Join our Discord community
- Read the architecture docs
- Ask in the #development channel

Remember: when in doubt, ask! We're here to help you contribute successfully.
