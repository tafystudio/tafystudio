"""
Test system endpoints
"""

import pytest
from fastapi.testclient import TestClient


def test_system_info(client: TestClient):
    """Test system info endpoint"""
    response = client.get("/api/v1/system/info")
    assert response.status_code == 200
    
    data = response.json()
    assert "version" in data
    assert "hostname" in data
    assert "platform" in data
    assert "python_version" in data
    assert "uptime_seconds" in data
    assert data["uptime_seconds"] >= 0


def test_system_health(client: TestClient):
    """Test system health endpoint"""
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data
    assert data["status"] in ["healthy", "degraded", "unhealthy"]
    assert "version" in data
    assert "checks" in data
    assert isinstance(data["checks"], dict)


def test_system_logs(client: TestClient):
    """Test system logs endpoint"""
    response = client.get("/api/v1/system/logs?limit=10")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 10
    
    if data:  # If there are logs
        log = data[0]
        assert "timestamp" in log
        assert "level" in log
        assert "message" in log
        assert "module" in log


def test_system_logs_filter_by_level(client: TestClient):
    """Test filtering logs by level"""
    response = client.get("/api/v1/system/logs?level=error")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    # All logs should be error level
    for log in data:
        assert log["level"] == "error"


def test_create_backup(client: TestClient):
    """Test backup creation"""
    response = client.post("/api/v1/system/backup")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "initiated"
    assert "backup_id" in data
    assert data["backup_id"].startswith("backup-")