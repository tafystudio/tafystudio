package scaffold

import "fmt"

func (g *DriverGenerator) generateGoDriver(data TemplateData) error {
	files := map[string]string{
		"README.md":         goReadmeTemplate,
		"driver.yaml":       goDriverYamlTemplate,
		"Dockerfile":        goDockerfileTemplate,
		"Makefile":          goMakefileTemplate,
		"go.mod":            goModTemplate,
		"main.go":           goMainTemplate,
		"internal/driver/driver.go": goDriverTemplate,
		"internal/hal/messages.go":  goHALTemplate,
		"internal/config/config.go": goConfigTemplate,
		"config/default.yaml":       goDefaultConfigTemplate,
		".gitignore":        goGitignoreTemplate,
	}

	for filename, tmpl := range files {
		if err := g.writeTemplate(filename, tmpl, data); err != nil {
			return fmt.Errorf("failed to write %s: %w", filename, err)
		}
	}

	// Create empty directories
	dirs := []string{"test", "examples", "scripts", "docs"}
	for _, dir := range dirs {
		if err := g.createEmptyDir(dir); err != nil {
			return fmt.Errorf("failed to create directory %s: %w", dir, err)
		}
	}

	return nil
}

func (g *DriverGenerator) createEmptyDir(dir string) error {
	path := fmt.Sprintf("%s/%s/.gitkeep", g.Output, dir)
	return g.writeTemplate(path, "", TemplateData{})
}

const goReadmeTemplate = `# {{.Name}} Driver

{{.Description}}

## Overview

This is a HAL-compliant {{.Type}} driver for Tafy RDOS. It provides the capability: `+"`{{.HALCapability}}`"+`

## Features

- HAL v1.0 compliant messaging
- NATS-based communication
- Prometheus metrics
- Health monitoring
- Docker container support

## Quick Start

1. Build the driver:
   `+"```bash"+`
   make build
   `+"```"+`

2. Run locally:
   `+"```bash"+`
   make run
   `+"```"+`

3. Run tests:
   `+"```bash"+`
   make test
   `+"```"+`

## Configuration

See `+"`config/default.yaml`"+` for available configuration options.

## HAL Messages

### Published Topics
- `+"`hal.v1.{{.Type}}.{{.NameLower}}.data`"+` - {{.TypeCapitalized}} data
- `+"`hal.v1.device.telemetry`"+` - Device telemetry

### Subscribed Topics  
- `+"`hal.v1.{{.Type}}.{{.NameLower}}.cmd`"+` - Commands
- `+"`hal.v1.device.config`"+` - Configuration updates

## License

Apache 2.0
`

const goDriverYamlTemplate = `hal:
  version: "1.0"
  capability: "{{.HALCapability}}"
  
device:
  name: "{{.Name}} {{.TypeCapitalized}}"
  manufacturer: "Generic"
  model: "{{.NameUpper}}-01"
  
interfaces:
  - type: "GPIO"
    pins:
      - name: "data"
        number: 23
        direction: "input"

messages:
  publish:
    - topic: "hal.v1.{{.Type}}.{{.NameLower}}.data"
      schema: "{{.NameLower}}_data.json"
    - topic: "hal.v1.device.telemetry"
      schema: "device_telemetry.json"
      
  subscribe:
    - topic: "hal.v1.{{.Type}}.{{.NameLower}}.cmd"
      schema: "{{.NameLower}}_command.json"

configuration:
  - name: "sample_rate"
    type: "integer"
    default: 10
    min: 1
    max: 100
    unit: "Hz"
    description: "Data sampling rate"
`

const goDockerfileTemplate = `# Build stage
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git make

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o driver .

# Runtime stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copy binary
COPY --from=builder /app/driver .
COPY --from=builder /app/config ./config

# Run as non-root
USER 1000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./driver"]
`

const goMakefileTemplate = `.PHONY: build run test clean docker-build docker-push help

DRIVER_NAME := {{.NameLower}}
IMAGE_NAME := tafylabs/driver-{{.NameLower}}
VERSION := 0.1.0

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build the driver binary
	go build -o driver .

run: ## Run the driver locally
	TAFY_DEVICE_ID={{.NameLower}}-01 \
	TAFY_NATS_URL=nats://localhost:4222 \
	go run .

test: ## Run tests
	go test -v ./...

test-integration: ## Run integration tests
	@echo "TODO: Add integration tests"

clean: ## Clean build artifacts
	rm -f driver
	go clean

docker-build: ## Build Docker image
	docker build -t $(IMAGE_NAME):$(VERSION) .
	docker tag $(IMAGE_NAME):$(VERSION) $(IMAGE_NAME):latest

docker-push: docker-build ## Push Docker image
	docker push $(IMAGE_NAME):$(VERSION)
	docker push $(IMAGE_NAME):latest

lint: ## Run linters
	golangci-lint run

fmt: ## Format code
	go fmt ./...
`

const goModTemplate = `module github.com/tafystudio/driver-{{.NameLower}}

go 1.23

require (
	github.com/nats-io/nats.go v1.31.0
	github.com/prometheus/client_golang v1.17.0
	gopkg.in/yaml.v3 v3.0.1
)
`

const goMainTemplate = `package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/tafystudio/driver-{{.NameLower}}/internal/config"
	"github.com/tafystudio/driver-{{.NameLower}}/internal/driver"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Create driver
	d, err := driver.New(cfg)
	if err != nil {
		log.Fatalf("Failed to create driver: %v", err)
	}

	// Setup signal handling
	ctx, cancel := context.WithCancel(context.Background())
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Shutdown signal received")
		cancel()
	}()

	// Run driver
	log.Printf("Starting {{.Name}} driver (ID: %s)", cfg.DeviceID)
	if err := d.Run(ctx); err != nil {
		log.Fatalf("Driver failed: %v", err)
	}

	log.Println("Driver stopped")
}
`

const goDriverTemplate = `package driver

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	
	"github.com/tafystudio/driver-{{.NameLower}}/internal/config"
	"github.com/tafystudio/driver-{{.NameLower}}/internal/hal"
)

type Driver struct {
	cfg    *config.Config
	nc     *nats.Conn
	js     nats.JetStreamContext
	
	// Metrics
	messagesPublished prometheus.Counter
	messagesFailed    prometheus.Counter
	{{if eq .Type "sensor"}}readings          prometheus.Gauge{{end}}
}

func New(cfg *config.Config) (*Driver, error) {
	// Connect to NATS
	nc, err := nats.Connect(cfg.NATS.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	// Get JetStream context
	js, err := nc.JetStream()
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("failed to get JetStream: %w", err)
	}

	d := &Driver{
		cfg: cfg,
		nc:  nc,
		js:  js,
	}

	// Initialize metrics
	d.initMetrics()

	// Start HTTP server for metrics/health
	go d.startHTTPServer()

	return d, nil
}

func (d *Driver) Run(ctx context.Context) error {
	defer d.nc.Close()

	// Subscribe to commands
	sub, err := d.nc.Subscribe(fmt.Sprintf("hal.v1.{{.Type}}.{{.NameLower}}.cmd"), d.handleCommand)
	if err != nil {
		return fmt.Errorf("failed to subscribe: %w", err)
	}
	defer sub.Unsubscribe()

	// Main loop
	ticker := time.NewTicker(time.Second / time.Duration(d.cfg.SampleRate))
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			if err := d.{{if eq .Type "sensor"}}readAndPublish{{else}}processLoop{{end}}(); err != nil {
				log.Printf("Error in main loop: %v", err)
				d.messagesFailed.Inc()
			}
		}
	}
}

{{if eq .Type "sensor"}}
func (d *Driver) readAndPublish() error {
	// TODO: Read from actual hardware
	value := 42.0 // Replace with actual sensor reading
	
	// Update metric
	d.readings.Set(value)

	// Create HAL message
	msg := hal.Message{
		HALMajor:  1,
		HALMinor:  0,
		Schema:    "tafylabs/hal/{{.Type}}/{{.NameLower}}/1.0",
		DeviceID:  d.cfg.DeviceID,
		Caps:      []string{"{{.HALCapability}}:v1.0"},
		Timestamp: time.Now(),
		Payload: map[string]interface{}{
			"value": value,
			"unit":  "TODO",
		},
	}

	// Publish
	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	if err := d.nc.Publish("hal.v1.{{.Type}}.{{.NameLower}}.data", data); err != nil {
		return fmt.Errorf("failed to publish: %w", err)
	}

	d.messagesPublished.Inc()
	return nil
}
{{else}}
func (d *Driver) processLoop() error {
	// TODO: Implement main processing loop for {{.Type}}
	return nil
}
{{end}}

func (d *Driver) handleCommand(msg *nats.Msg) {
	var cmd hal.Message
	if err := json.Unmarshal(msg.Data, &cmd); err != nil {
		log.Printf("Failed to unmarshal command: %v", err)
		return
	}

	// TODO: Handle commands based on payload
	log.Printf("Received command: %+v", cmd.Payload)

	// Send acknowledgment
	ack := hal.Message{
		HALMajor:  1,
		HALMinor:  0,
		Schema:    "tafylabs/hal/{{.Type}}/{{.NameLower}}/ack/1.0",
		DeviceID:  d.cfg.DeviceID,
		Caps:      []string{"{{.HALCapability}}:v1.0"},
		Timestamp: time.Now(),
		Payload: map[string]interface{}{
			"status":  "ok",
			"command": cmd.Payload,
		},
	}

	if data, err := json.Marshal(ack); err == nil {
		d.nc.Publish(fmt.Sprintf("hal.v1.{{.Type}}.{{.NameLower}}.ack"), data)
	}
}

func (d *Driver) initMetrics() {
	d.messagesPublished = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "tafy_driver_messages_published_total",
		Help: "Total number of messages published",
		ConstLabels: prometheus.Labels{
			"driver": "{{.NameLower}}",
		},
	})
	
	d.messagesFailed = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "tafy_driver_messages_failed_total",
		Help: "Total number of failed messages",
		ConstLabels: prometheus.Labels{
			"driver": "{{.NameLower}}",
		},
	})

	{{if eq .Type "sensor"}}
	d.readings = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "tafy_sensor_{{.NameLower}}_value",
		Help: "Current {{.Name}} sensor reading",
	})
	{{end}}

	prometheus.MustRegister(d.messagesPublished)
	prometheus.MustRegister(d.messagesFailed)
	{{if eq .Type "sensor"}}prometheus.MustRegister(d.readings){{end}}
}

func (d *Driver) startHTTPServer() {
	http.Handle("/metrics", promhttp.Handler())
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "healthy",
			"device_id": d.cfg.DeviceID,
			"uptime":    time.Since(d.cfg.StartTime).Seconds(),
		})
	})

	log.Printf("Starting HTTP server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Printf("HTTP server failed: %v", err)
	}
}
`

const goHALTemplate = `package hal

import "time"

// Message represents a HAL message envelope
type Message struct {
	HALMajor  int         `+"`json:\"hal_major\"`"+`
	HALMinor  int         `+"`json:\"hal_minor\"`"+`
	Schema    string      `+"`json:\"schema\"`"+`
	DeviceID  string      `+"`json:\"device_id\"`"+`
	Caps      []string    `+"`json:\"caps\"`"+`
	Timestamp time.Time   `+"`json:\"ts\"`"+`
	Payload   interface{} `+"`json:\"payload\"`"+`
}
`

const goConfigTemplate = `package config

import (
	"fmt"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	DeviceID   string    `+"`yaml:\"device_id\"`"+`
	SampleRate int       `+"`yaml:\"sample_rate\"`"+`
	StartTime  time.Time
	
	NATS struct {
		URL            string        `+"`yaml:\"url\"`"+`
		ReconnectDelay time.Duration `+"`yaml:\"reconnect_delay\"`"+`
		MaxReconnects  int           `+"`yaml:\"max_reconnects\"`"+`
	} `+"`yaml:\"nats\"`"+`

	Hardware struct {
		// TODO: Add hardware-specific configuration
	} `+"`yaml:\"hardware\"`"+`
}

func Load() (*Config, error) {
	cfg := &Config{
		StartTime: time.Now(),
	}

	// Load from environment first
	cfg.DeviceID = os.Getenv("TAFY_DEVICE_ID")
	if cfg.DeviceID == "" {
		cfg.DeviceID = "{{.NameLower}}-01"
	}

	// Load config file
	configFile := os.Getenv("TAFY_CONFIG_FILE")
	if configFile == "" {
		configFile = "config/default.yaml"
	}

	data, err := os.ReadFile(configFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("failed to parse config: %w", err)
	}

	// Override with environment variables
	if natsURL := os.Getenv("TAFY_NATS_URL"); natsURL != "" {
		cfg.NATS.URL = natsURL
	}

	return cfg, nil
}
`

const goDefaultConfigTemplate = `device_id: "{{.NameLower}}-01"
sample_rate: 10

nats:
  url: "nats://localhost:4222"
  reconnect_delay: 5s
  max_reconnects: -1

hardware:
  # TODO: Add hardware-specific configuration
`

const goGitignoreTemplate = `# Binaries
driver
*.exe
*.dll
*.so
*.dylib

# Test binary
*.test

# Output of the go coverage tool
*.out

# Dependency directories
vendor/

# Go workspace file
go.work

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Local config
config/local.yaml
.env
`