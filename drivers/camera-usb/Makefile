# Camera USB Driver Makefile

# Variables
BINARY_NAME := camera-driver
DOCKER_IMAGE := tafy/camera-usb
VERSION := $(shell git describe --tags --always --dirty)
GO_FILES := $(shell find . -type f -name '*.go' -not -path "./vendor/*")

# Build flags
LDFLAGS := -ldflags "-X main.version=${VERSION}"
GOFLAGS := -mod=readonly

.PHONY: all build clean test docker-build docker-push deploy help

# Default target
all: build

# Build the binary
build:
	@echo "Building ${BINARY_NAME}..."
	go build ${GOFLAGS} ${LDFLAGS} -o ${BINARY_NAME} ./cmd/camera-driver

# Clean build artifacts
clean:
	@echo "Cleaning..."
	go clean
	rm -f ${BINARY_NAME}

# Run tests
test:
	@echo "Running tests..."
	go test ${GOFLAGS} -v -race ./...

# Run linting
lint:
	@echo "Running linter..."
	golangci-lint run

# Format code
fmt:
	@echo "Formatting code..."
	go fmt ./...

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy

# Build Docker image
docker-build:
	@echo "Building Docker image..."
	docker build -t ${DOCKER_IMAGE}:${VERSION} -t ${DOCKER_IMAGE}:latest .

# Push Docker image
docker-push: docker-build
	@echo "Pushing Docker image..."
	docker push ${DOCKER_IMAGE}:${VERSION}
	docker push ${DOCKER_IMAGE}:latest

# Deploy to Kubernetes
deploy:
	@echo "Deploying to Kubernetes..."
	kubectl apply -f deploy/camera-driver.yaml

# Run locally
run: build
	@echo "Running ${BINARY_NAME}..."
	./${BINARY_NAME}

# Run with live reload
dev:
	@echo "Running with live reload..."
	air -c .air.toml

# Generate mocks
mocks:
	@echo "Generating mocks..."
	mockgen -source=internal/camera/camera.go -destination=internal/camera/mocks/camera_mock.go

# Show help
help:
	@echo "Available targets:"
	@echo "  build        - Build the binary"
	@echo "  clean        - Clean build artifacts"
	@echo "  test         - Run tests"
	@echo "  lint         - Run linter"
	@echo "  fmt          - Format code"
	@echo "  deps         - Download dependencies"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-push  - Push Docker image"
	@echo "  deploy       - Deploy to Kubernetes"
	@echo "  run          - Run locally"
	@echo "  dev          - Run with live reload"
	@echo "  mocks        - Generate mocks"
	@echo "  help         - Show this help"