package scaffold

import "fmt"

func (g *DriverGenerator) generatePythonDriver(data TemplateData) error {
	files := map[string]string{
		"README.md":                pythonReadmeTemplate,
		"driver.yaml":              pythonDriverYamlTemplate,
		"Dockerfile":               pythonDockerfileTemplate,
		"Makefile":                 pythonMakefileTemplate,
		"pyproject.toml":           pythonPyprojectTemplate,
		"requirements.txt":         pythonRequirementsTemplate,
		"src/__init__.py":          "",
		"src/main.py":              pythonMainTemplate,
		"src/driver.py":            pythonDriverTemplate,
		"src/hal.py":               pythonHALTemplate,
		"src/config.py":            pythonConfigTemplate,
		"config/default.yaml":      pythonDefaultConfigTemplate,
		".gitignore":               pythonGitignoreTemplate,
		"tests/__init__.py":        "",
		"tests/test_driver.py":     pythonTestTemplate,
	}

	for filename, tmpl := range files {
		if err := g.writeTemplate(filename, tmpl, data); err != nil {
			return fmt.Errorf("failed to write %s: %w", filename, err)
		}
	}

	return nil
}

const pythonReadmeTemplate = `# {{.Name}} Driver

{{.Description}}

## Overview

This is a HAL-compliant {{.Type}} driver for Tafy RDOS. It provides the capability: ` + "`{{.HALCapability}}`" + `

## Features

- HAL v1.0 compliant messaging
- NATS-based communication  
- Prometheus metrics
- Health monitoring
- Docker container support
- Type hints and async/await

## Quick Start

1. Install dependencies:
   ` + "```bash" + `
   uv pip install -r requirements.txt
   ` + "```" + `

2. Run locally:
   ` + "```bash" + `
   make run
   ` + "```" + `

3. Run tests:
   ` + "```bash" + `
   make test
   ` + "```" + `

## Configuration

See ` + "`config/default.yaml`" + ` for available configuration options.

## HAL Messages

### Published Topics
- ` + "`hal.v1.{{.Type}}.{{.NameLower}}.data`" + ` - {{.TypeCapitalized}} data
- ` + "`hal.v1.device.telemetry`" + ` - Device telemetry

### Subscribed Topics  
- ` + "`hal.v1.{{.Type}}.{{.NameLower}}.cmd`" + ` - Commands
- ` + "`hal.v1.device.config`" + ` - Configuration updates

## License

Apache 2.0
`

const pythonDriverYamlTemplate = `hal:
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

const pythonDockerfileTemplate = `FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 tafy && chown -R tafy:tafy /app
USER tafy

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["python", "-m", "src.main"]
`

const pythonMakefileTemplate = `.PHONY: run test lint format clean docker-build docker-push help

DRIVER_NAME := {{.NameLower}}
IMAGE_NAME := tafylabs/driver-{{.NameLower}}
VERSION := 0.1.0

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	uv pip install -r requirements.txt

install-dev: ## Install development dependencies
	uv pip install -r requirements.txt
	uv pip install pytest pytest-asyncio pytest-cov ruff mypy

run: ## Run the driver locally
	TAFY_DEVICE_ID={{.NameLower}}-01 \
	TAFY_NATS_URL=nats://localhost:4222 \
	python -m src.main

test: ## Run tests
	pytest tests/ -v

test-coverage: ## Run tests with coverage
	pytest tests/ -v --cov=src --cov-report=html

lint: ## Run linter
	ruff check src/ tests/

format: ## Format code
	ruff format src/ tests/

type-check: ## Run type checking
	mypy src/

clean: ## Clean build artifacts
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov .mypy_cache

docker-build: ## Build Docker image
	docker build -t $(IMAGE_NAME):$(VERSION) .
	docker tag $(IMAGE_NAME):$(VERSION) $(IMAGE_NAME):latest

docker-push: docker-build ## Push Docker image
	docker push $(IMAGE_NAME):$(VERSION)
	docker push $(IMAGE_NAME):latest

dev-server: ## Run with auto-reload for development
	watchmedo auto-restart --directory=./src --pattern="*.py" --recursive python -- -m src.main
`

const pythonPyprojectTemplate = `[project]
name = "{{.NameLower}}-driver"
version = "0.1.0"
description = "{{.Description}}"
readme = "README.md"
requires-python = ">=3.11"
license = {text = "Apache-2.0"}

dependencies = [
    "nats-py>=2.7.0",
    "pyyaml>=6.0",
    "prometheus-client>=0.19.0",
    "aiohttp>=3.9.1",
    "pydantic>=2.5.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=4.1.0",
    "ruff>=0.1.0",
    "mypy>=1.7.0",
    "watchdog>=3.0.0",
]

[tool.ruff]
line-length = 88
target-version = "py311"

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
`

const pythonRequirementsTemplate = `nats-py>=2.7.0
pyyaml>=6.0
prometheus-client>=0.19.0
aiohttp>=3.9.1
pydantic>=2.5.0
`

const pythonMainTemplate = `#!/usr/bin/env python3
"""{{.Name}} driver main entry point."""

import asyncio
import logging
import signal
import sys
from typing import Optional

from src.config import Config
from src.driver import {{.Name}}Driver

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def main() -> None:
    """Main entry point."""
    # Load configuration
    try:
        config = Config.load()
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        sys.exit(1)

    # Create driver
    driver = {{.Name}}Driver(config)
    
    # Setup signal handlers
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, driver.stop)

    # Run driver
    logger.info(f"Starting {{.Name}} driver (ID: {config.device_id})")
    try:
        await driver.run()
    except Exception as e:
        logger.error(f"Driver failed: {e}")
        sys.exit(1)
    finally:
        await driver.cleanup()

    logger.info("Driver stopped")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
`

const pythonDriverTemplate = `"""{{.Name}} driver implementation."""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import nats
from aiohttp import web
from prometheus_client import Counter, Gauge, generate_latest

from .config import Config
from .hal import HALMessage

logger = logging.getLogger(__name__)


class {{.Name}}Driver:
    """{{.Name}} {{.Type}} driver."""

    def __init__(self, config: Config) -> None:
        self.config = config
        self.nc: Optional[nats.NATS] = None
        self.js: Optional[nats.JetStreamContext] = None
        self._running = False
        
        # Metrics
        self.messages_published = Counter(
            'tafy_driver_messages_published_total',
            'Total messages published',
            ['driver']
        )
        self.messages_failed = Counter(
            'tafy_driver_messages_failed_total', 
            'Total failed messages',
            ['driver']
        )
        {{if eq .Type "sensor"}}self.readings = Gauge(
            'tafy_sensor_{{.NameLower}}_value',
            'Current {{.Name}} sensor reading'
        ){{end}}
        
        # HTTP server
        self.app = web.Application()
        self._setup_routes()

    def _setup_routes(self) -> None:
        """Setup HTTP routes."""
        self.app.router.add_get('/health', self._health_handler)
        self.app.router.add_get('/metrics', self._metrics_handler)

    async def run(self) -> None:
        """Run the driver."""
        # Connect to NATS
        self.nc = await nats.connect(self.config.nats.url)
        self.js = self.nc.jetstream()
        
        # Subscribe to commands
        await self.nc.subscribe(
            f"hal.v1.{{.Type}}.{{.NameLower}}.cmd",
            cb=self._handle_command
        )
        
        # Start HTTP server
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', 8080)
        asyncio.create_task(site.start())
        
        # Main loop
        self._running = True
        interval = 1.0 / self.config.sample_rate
        
        while self._running:
            try:
                await self._process_loop()
                await asyncio.sleep(interval)
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                self.messages_failed.labels(driver='{{.NameLower}}').inc()

    {{if eq .Type "sensor"}}
    async def _process_loop(self) -> None:
        """Read sensor and publish data."""
        # TODO: Read from actual hardware
        value = 42.0  # Replace with actual sensor reading
        
        # Update metric
        self.readings.set(value)
        
        # Create HAL message
        message = HALMessage(
            hal_major=1,
            hal_minor=0,
            schema="tafylabs/hal/{{.Type}}/{{.NameLower}}/1.0",
            device_id=self.config.device_id,
            caps=["{{.HALCapability}}:v1.0"],
            ts=datetime.now(timezone.utc).isoformat(),
            payload={
                "value": value,
                "unit": "TODO"
            }
        )
        
        # Publish
        await self.nc.publish(
            "hal.v1.{{.Type}}.{{.NameLower}}.data",
            json.dumps(message.model_dump()).encode()
        )
        self.messages_published.labels(driver='{{.NameLower}}').inc()
    {{else}}
    async def _process_loop(self) -> None:
        """Main processing loop for {{.Type}}."""
        # TODO: Implement main processing loop
        pass
    {{end}}

    async def _handle_command(self, msg: nats.Msg) -> None:
        """Handle incoming commands."""
        try:
            data = json.loads(msg.data.decode())
            command = HALMessage(**data)
            
            # TODO: Handle commands based on payload
            logger.info(f"Received command: {command.payload}")
            
            # Send acknowledgment
            ack = HALMessage(
                hal_major=1,
                hal_minor=0,
                schema="tafylabs/hal/{{.Type}}/{{.NameLower}}/ack/1.0",
                device_id=self.config.device_id,
                caps=["{{.HALCapability}}:v1.0"],
                ts=datetime.now(timezone.utc).isoformat(),
                payload={
                    "status": "ok",
                    "command": command.payload
                }
            )
            
            await self.nc.publish(
                f"hal.v1.{{.Type}}.{{.NameLower}}.ack",
                json.dumps(ack.model_dump()).encode()
            )
            
        except Exception as e:
            logger.error(f"Failed to handle command: {e}")

    async def _health_handler(self, request: web.Request) -> web.Response:
        """Health check handler."""
        return web.json_response({
            "status": "healthy",
            "device_id": self.config.device_id,
            "uptime": (datetime.now() - self.config.start_time).total_seconds()
        })

    async def _metrics_handler(self, request: web.Request) -> web.Response:
        """Prometheus metrics handler."""
        metrics = generate_latest()
        return web.Response(
            body=metrics,
            content_type="text/plain; version=0.0.4"
        )

    def stop(self) -> None:
        """Stop the driver."""
        self._running = False

    async def cleanup(self) -> None:
        """Cleanup resources."""
        if self.nc and self.nc.is_connected:
            await self.nc.close()
`

const pythonHALTemplate = `"""HAL message definitions."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class HALMessage(BaseModel):
    """HAL message envelope."""
    
    hal_major: int = Field(..., description="HAL major version")
    hal_minor: int = Field(..., description="HAL minor version")
    schema: str = Field(..., description="Message schema identifier")
    device_id: str = Field(..., description="Device ID")
    caps: List[str] = Field(default_factory=list, description="Device capabilities")
    ts: str = Field(..., description="ISO 8601 timestamp")
    payload: Dict[str, Any] = Field(..., description="Message payload")
`

const pythonConfigTemplate = `"""Configuration management."""

import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

import yaml


@dataclass
class NATSConfig:
    """NATS configuration."""
    url: str = "nats://localhost:4222"
    reconnect_delay: float = 5.0
    max_reconnects: int = -1


@dataclass
class Config:
    """Driver configuration."""
    device_id: str
    sample_rate: int = 10
    nats: NATSConfig = None
    start_time: datetime = None
    
    def __post_init__(self):
        if self.nats is None:
            self.nats = NATSConfig()
        if self.start_time is None:
            self.start_time = datetime.now()
    
    @classmethod
    def load(cls) -> 'Config':
        """Load configuration from environment and file."""
        # Start with defaults
        config_data = {
            'device_id': os.getenv('TAFY_DEVICE_ID', '{{.NameLower}}-01'),
            'sample_rate': 10
        }
        
        # Load from config file
        config_file = os.getenv('TAFY_CONFIG_FILE', 'config/default.yaml')
        if Path(config_file).exists():
            with open(config_file, 'r') as f:
                file_config = yaml.safe_load(f)
                config_data.update(file_config)
        
        # Override with environment variables
        if nats_url := os.getenv('TAFY_NATS_URL'):
            config_data.setdefault('nats', {})['url'] = nats_url
        
        # Create NATS config
        nats_config = NATSConfig(**config_data.get('nats', {}))
        
        return cls(
            device_id=config_data['device_id'],
            sample_rate=config_data.get('sample_rate', 10),
            nats=nats_config
        )
`

const pythonDefaultConfigTemplate = `device_id: "{{.NameLower}}-01"
sample_rate: 10

nats:
  url: "nats://localhost:4222"
  reconnect_delay: 5
  max_reconnects: -1

hardware:
  # TODO: Add hardware-specific configuration
`

const pythonGitignoreTemplate = `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.env
.venv

# Testing
.coverage
.pytest_cache/
htmlcov/
.tox/
.hypothesis/

# Type checking
.mypy_cache/
.dmypy.json
dmypy.json

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build
build/
dist/
*.egg-info/
pip-wheel-metadata/

# Local config
config/local.yaml
`

const pythonTestTemplate = `"""Tests for {{.Name}} driver."""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock

from src.config import Config
from src.driver import {{.Name}}Driver


@pytest.fixture
def config():
    """Test configuration."""
    return Config(
        device_id="test-{{.NameLower}}",
        sample_rate=10
    )


@pytest.fixture
def driver(config):
    """Test driver instance."""
    return {{.Name}}Driver(config)


@pytest.mark.asyncio
async def test_driver_initialization(driver):
    """Test driver initialization."""
    assert driver.config.device_id == "test-{{.NameLower}}"
    assert driver.config.sample_rate == 10
    assert driver._running is False


@pytest.mark.asyncio
async def test_health_endpoint(driver):
    """Test health check endpoint."""
    request = Mock()
    response = await driver._health_handler(request)
    
    assert response.status == 200
    # TODO: Add more health check tests


# TODO: Add more tests
`