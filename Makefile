.PHONY: help install build dev test lint format clean docker-build docker-push deploy-dev

# Default target
help:
	@echo "Tafy Studio Development Commands"
	@echo "================================"
	@echo "install       - Install all dependencies"
	@echo "build         - Build all packages"
	@echo "dev           - Run development servers"
	@echo "test          - Run all tests"
	@echo "lint          - Run linters"
	@echo "format        - Format code"
	@echo "clean         - Clean build artifacts"
	@echo "docker-build  - Build Docker images"
	@echo "docker-push   - Push Docker images"
	@echo "deploy-dev    - Deploy to local k3s cluster"

# Install dependencies
install:
	pnpm install
	cd apps/hub-api && uv pip sync requirements.txt
	cd apps/tafyd && go mod download

# Build all packages
build:
	pnpm run build

# Run development servers
dev:
	pnpm run dev

# Run tests
test:
	pnpm run test

# Run linters
lint:
	pnpm run lint

# Format code
format:
	pnpm run format

# Clean build artifacts
clean:
	pnpm run clean
	find . -name "dist" -type d -exec rm -rf {} +
	find . -name ".next" -type d -exec rm -rf {} +
	find . -name "__pycache__" -type d -exec rm -rf {} +
	find . -name "*.pyc" -delete

# Build Docker images
docker-build:
	docker build -t tafystudio/hub-ui:latest apps/hub-ui
	docker build -t tafystudio/hub-api:latest apps/hub-api
	docker build -t tafystudio/tafyd:latest apps/tafyd

# Build multi-arch Docker images
docker-build-multiarch:
	docker buildx build --platform linux/amd64,linux/arm64 -t tafystudio/hub-ui:latest apps/hub-ui
	docker buildx build --platform linux/amd64,linux/arm64 -t tafystudio/hub-api:latest apps/hub-api
	docker buildx build --platform linux/amd64,linux/arm64 -t tafystudio/tafyd:latest apps/tafyd

# Push Docker images
docker-push:
	docker push tafystudio/hub-ui:latest
	docker push tafystudio/hub-api:latest
	docker push tafystudio/tafyd:latest

# Deploy to local k3s cluster
deploy-dev:
	helm upgrade --install nats charts/nats -f charts/nats/values-dev.yaml
	helm upgrade --install hub charts/hub -f charts/hub/values-dev.yaml
	helm upgrade --install node-red charts/node-red -f charts/node-red/values-dev.yaml

# Local k3s cluster management
cluster-create:
	k3d cluster create tafy-dev \
		--servers 1 \
		--agents 2 \
		--port 9080:80@loadbalancer \
		--port 9443:443@loadbalancer \
		--registry-create tafy-registry:5000

cluster-delete:
	k3d cluster delete tafy-dev

# Utility targets
.PHONY: update-deps security-scan
update-deps:
	pnpm update -r
	cd apps/hub-api && uv pip compile requirements.in -o requirements.txt --upgrade
	cd apps/tafyd && go get -u ./...

security-scan:
	pnpm audit
	cd apps/hub-api && uv pip audit