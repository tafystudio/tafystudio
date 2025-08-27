"""Tests for ultrasonic driver."""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock

from src.config import Config
from src.driver import ultrasonicDriver


@pytest.fixture
def config():
    """Test configuration."""
    return Config(
        device_id="test-ultrasonic",
        sample_rate=10
    )


@pytest.fixture
def driver(config):
    """Test driver instance."""
    return ultrasonicDriver(config)


@pytest.mark.asyncio
async def test_driver_initialization(driver):
    """Test driver initialization."""
    assert driver.config.device_id == "test-ultrasonic"
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
