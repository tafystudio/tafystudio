# Troubleshooting Guide

This guide helps you resolve common issues when working with Tafy Studio.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Development Environment](#development-environment)
- [Runtime Errors](#runtime-errors)
- [Networking Issues](#networking-issues)
- [Hardware Communication](#hardware-communication)
- [Kubernetes/k3s Issues](#kubernetesk3s-issues)
- [NATS Messaging](#nats-messaging)

## Installation Issues

### Package Manager Not Found

**Problem**: `pnpm: command not found` or `uv: command not found`

**Solution**:

```bash
# Install pnpm
npm install -g pnpm

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Go Version Mismatch

**Problem**: Go version is below 1.21

**Solution**:

```bash
# Check current version
go version

# Install latest Go from https://go.dev/dl/
# Or use your package manager:
brew install go  # macOS
sudo apt install golang-go  # Ubuntu
```

### Node.js Version Too Old

**Problem**: Node.js version is below 20.0.0

**Solution**:

```bash
# Install Node.js 20+ using nvm
nvm install 20
nvm use 20
```

## Development Environment

### Turborepo Build Failures

**Problem**: `turbo build` fails with cache errors

**Solution**:

```bash
# Clear Turborepo cache
turbo daemon clean
rm -rf .turbo
pnpm run clean
pnpm install
pnpm run build
```

### TypeScript Type Errors

**Problem**: Type checking fails in VS Code or during build

**Solution**:

1. Ensure dependencies are installed: `pnpm install`
2. Restart TypeScript server in VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
3. Check for version mismatches in package.json files

### Python Environment Issues

**Problem**: Python dependencies not found or version conflicts

**Solution**:

```bash
cd apps/hub-api
# Remove existing environment
rm -rf .venv
# Recreate with uv
uv venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uv pip install -r requirements.txt
```

## Runtime Errors

### Hub API Won't Start

**Problem**: FastAPI server fails to start

**Solution**:

1. Check port 8080 is available: `lsof -i :8080`
2. Verify environment variables: `cp .env.example .env`
3. Check database connection: `uv run alembic upgrade head`
4. Review logs: `uv run uvicorn app.main:app --reload --log-level debug`

### Hub UI Build Errors

**Problem**: Next.js build or dev server fails

**Solution**:

```bash
cd apps/hub-ui
rm -rf .next node_modules
pnpm install
pnpm run dev
```

### tafyd Agent Connection Issues

**Problem**: Go agent fails to connect to NATS

**Solution**:

1. Verify NATS is running: `kubectl get pods -n tafy-system`
2. Check NATS URL in config: `NATS_URL=nats://localhost:4222`
3. Test connection: `nats-cli server check`

## Networking Issues

### Cannot Access Hub UI

**Problem**: Cannot access <http://localhost:3000>

**Solution**:

1. Check if port is in use: `lsof -i :3000`
2. Verify the dev server is running: `cd apps/hub-ui && pnpm run dev`
3. Try accessing <http://127.0.0.1:3000> instead

### k3s Services Unreachable

**Problem**: Cannot access services in k3s cluster

**Solution**:

```bash
# Check cluster status
k3d cluster list
kubectl get nodes

# Restart cluster if needed
k3d cluster stop tafy-dev
k3d cluster start tafy-dev

# Check service endpoints
kubectl get svc -A
```

## Hardware Communication

### ESP32 Not Detected

**Problem**: Cannot flash or communicate with ESP32

**Solution**:

1. Check USB connection and drivers
2. Verify serial port permissions:

   ```bash
   # Linux/macOS
   ls -la /dev/tty*
   sudo usermod -a -G dialout $USER
   # Logout and login again
   ```

3. Use correct serial port in PlatformIO config

### HAL Messages Not Received

**Problem**: Hardware messages not appearing in NATS

**Solution**:

1. Check device is connected to WiFi
2. Verify NATS subjects match HAL spec
3. Use NATS CLI to debug:

   ```bash
   nats sub "hal.v1.>"
   ```

## Kubernetes/k3s Issues

### k3d Cluster Creation Fails

**Problem**: `k3d cluster create` fails

**Solution**:

1. Check Docker is running: `docker info`
2. Remove existing cluster: `k3d cluster delete tafy-dev`
3. Check port availability: `lsof -i :6443`
4. Create with verbose logging: `k3d cluster create tafy-dev -v`

### Pods Stuck in Pending State

**Problem**: Kubernetes pods won't start

**Solution**:

```bash
# Check pod events
kubectl describe pod <pod-name>

# Check node resources
kubectl top nodes

# Check persistent volume claims
kubectl get pvc -A
```

## NATS Messaging

### Message Flow Issues

**Problem**: Messages not routing between services

**Solution**:

1. Check NATS server logs: `kubectl logs -n tafy-system deployment/nats`
2. Verify subject hierarchies match HAL spec
3. Use NATS monitoring: `nats server report connections`

### JetStream Not Working

**Problem**: JetStream features unavailable

**Solution**:

```bash
# Check if JetStream is enabled
nats server info

# Enable JetStream in Helm values
helm upgrade nats nats/nats --set nats.jetstream.enabled=true
```

## Getting Help

If you're still experiencing issues:

1. Check existing [GitHub Issues](https://github.com/tafystudio/tafystudio/issues)
2. Join our [Discord community](https://discord.gg/tafystudio)
3. File a bug report with:
   - System information: `make debug-info`
   - Error logs
   - Steps to reproduce

For security issues, please email [security@tafy.studio](mailto:security@tafy.studio) instead of creating a public issue.
