"""
Pytest configuration and fixtures for hub-api tests
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_db

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def mock_nats_client(monkeypatch):
    """Mock NATS client for all tests"""
    # Create a mock NATS client
    mock_client = MagicMock()
    mock_client.connect = AsyncMock()
    mock_client.close = AsyncMock()
    mock_client.is_connected = True
    mock_client.publish = AsyncMock()
    mock_client.subscribe = AsyncMock()
    
    # Patch the nats_client in the module
    monkeypatch.setattr("app.core.nats.nats_client", mock_client)
    
    return mock_client


@pytest.fixture
def anyio_backend():
    """Configure async backend for pytest-asyncio"""
    return "asyncio"


@pytest.fixture
def db():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db: Session):
    """Create a test client with database override."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_settings():
    """Override settings for testing."""
    settings = get_settings()
    settings.ENVIRONMENT = "test"
    settings.DATABASE_URL = SQLALCHEMY_DATABASE_URL
    return settings


@pytest.fixture
def sample_device_data():
    """Sample device data for testing."""
    return {
        "device_id": "test-esp32-001",
        "node_id": "node-001",
        "device_type": "esp32",
        "capabilities": ["motor.differential:v1.0", "sensor.range:v1.0"],
        "metadata": {
            "firmware_version": "1.0.0",
            "hardware_version": "rev-a"
        }
    }


@pytest.fixture
def sample_flow_data():
    """Sample flow data for testing."""
    return {
        "name": "Test Navigation Flow",
        "flow_id": "nav-flow-001",
        "flow_definition": {
            "nodes": [
                {
                    "id": "sensor-1",
                    "type": "sensor.range",
                    "config": {"topic": "hal.v1.sensor.range.data"}
                },
                {
                    "id": "motor-1",
                    "type": "motor.differential",
                    "config": {"topic": "hal.v1.motor.cmd"}
                }
            ],
            "connections": [
                {"from": "sensor-1", "to": "motor-1"}
            ]
        },
        "metadata": {
            "created_by": "test-user",
            "version": "1.0"
        }
    }