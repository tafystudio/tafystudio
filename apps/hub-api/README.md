# Hub API - Tafy Studio Backend

The Hub API is the FastAPI-based backend service for Tafy Studio, providing the control plane API for robot fleet management, device orchestration, and flow deployment.

## Overview

The Hub API serves as the central management interface for:

- Device registration and management
- Flow creation and deployment
- Real-time telemetry and monitoring
- User authentication and authorization
- NATS messaging coordination
- WebSocket connections for real-time updates

## Features

- **RESTful API**: Comprehensive REST endpoints for all operations
- **WebSocket Support**: Real-time bidirectional communication
- **NATS Integration**: Pub/sub messaging for distributed communication
- **Database Backed**: PostgreSQL for persistent storage
- **Redis Caching**: High-performance caching layer
- **OpenAPI Documentation**: Auto-generated API documentation
- **Prometheus Metrics**: Built-in observability

## Getting Started

### Prerequisites

- Python 3.11 or higher
- PostgreSQL 14+
- Redis 6+
- NATS server

### Installation

```bash
# Install uv package manager
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment
uv venv

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -e .

# Install development dependencies
uv pip install -e ".[dev]"
```

### Configuration

Configure via environment variables or `.env` file:

```bash
# .env.local
DATABASE_URL=postgresql://user:pass@localhost/tafydb
REDIS_URL=redis://localhost:6379
NATS_URL=nats://localhost:4222
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=["http://localhost:3000"]
```

### Running

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Project Structure

```text
hub-api/
├── app/
│   ├── api/            # API endpoints
│   │   ├── v1/         # API v1 routes
│   │   └── deps.py     # Dependencies
│   ├── core/           # Core functionality
│   │   ├── config.py   # Configuration
│   │   ├── nats.py     # NATS client
│   │   └── security.py # Auth/security
│   ├── db/             # Database
│   │   ├── base.py     # Base classes
│   │   └── session.py  # DB sessions
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   ├── services/       # Business logic
│   └── main.py         # Application entry
├── alembic/            # Database migrations
├── tests/              # Test suite
├── docs/               # Sphinx documentation
└── pyproject.toml      # Project metadata
```

## API Documentation

Once running, access the interactive API documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI Schema: `http://localhost:8000/openapi.json`

## Key Endpoints

### Devices

- `GET /api/v1/devices` - List all devices
- `POST /api/v1/devices` - Register new device
- `GET /api/v1/devices/{id}` - Get device details
- `DELETE /api/v1/devices/{id}` - Remove device

### Flows

- `GET /api/v1/flows` - List flows
- `POST /api/v1/flows` - Create flow
- `PUT /api/v1/flows/{id}` - Update flow
- `POST /api/v1/flows/{id}/deploy` - Deploy flow

### System

- `GET /api/v1/health` - Health check
- `GET /api/v1/metrics` - Prometheus metrics
- `WS /api/v1/ws` - WebSocket connection

## Database

### Migrations

```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one revision
alembic downgrade -1
```

### Models

Key database models:

- `Device` - Registered nodes and devices
- `Flow` - Node-RED flow definitions
- `Capability` - Hardware capabilities
- `Telemetry` - Time-series telemetry data

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_devices.py

# Run integration tests
pytest -m integration
```

## Development

### Code Style

The project uses:

- `black` for code formatting
- `isort` for import sorting
- `flake8` for linting
- `mypy` for type checking

```bash
# Format code
black app tests

# Sort imports
isort app tests

# Run linting
flake8 app tests

# Type checking
mypy app
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

## Deployment

### Docker

```bash
# Build image
docker build -t tafystudio/hub-api:latest .

# Run container
docker run -d \
  --name hub-api \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e NATS_URL=nats://... \
  tafystudio/hub-api:latest
```

### Kubernetes

See the Helm chart in `/charts/hub/` for Kubernetes deployment.

## Monitoring

- Health endpoint: `/api/v1/health`
- Metrics endpoint: `/api/v1/metrics` (Prometheus format)
- Structured logging with correlation IDs
- OpenTelemetry support (when enabled)

## Contributing

See the main project [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](../../LICENSE) for details.
