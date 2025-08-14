"""
Pytest configuration and fixtures for hub-api tests
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
import sys
import os

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


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