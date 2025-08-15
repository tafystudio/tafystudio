"""
Test flow endpoints
"""

import pytest
from fastapi.testclient import TestClient



def test_create_flow(client: TestClient):
    """Test flow creation"""
    flow_data = {
        "name": "Test Flow",
        "description": "A test flow for unit testing",
        "config": {
            "nodes": [
                {"id": "1", "type": "input", "data": {}},
                {"id": "2", "type": "output", "data": {}}
            ],
            "edges": [
                {"source": "1", "target": "2"}
            ]
        },
        "target_nodes": ["node-001", "node-002"],
        "metadata": {"category": "test"}
    }
    
    response = client.post("/api/v1/flows/", json=flow_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == flow_data["name"]
    assert data["deployed"] is False
    assert data["version"] == 1
    assert "id" in data



def test_list_flows(client: TestClient):
    """Test listing flows"""
    # Create a flow first
    flow_data = {
        "name": "Test Flow 2",
        "config": {}
    }
    client.post("/api/v1/flows/", json=flow_data)
    
    # List all flows
    response = client.get("/api/v1/flows/")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1



def test_get_flow(client: TestClient):
    """Test getting specific flow"""
    # Create flow
    flow_data = {
        "name": "Test Flow 3",
        "config": {"test": True}
    }
    create_response = client.post("/api/v1/flows/", json=flow_data)
    flow_id = create_response.json()["id"]
    
    # Get the flow
    response = client.get(f"/api/v1/flows/{flow_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == flow_id
    assert data["name"] == flow_data["name"]



def test_update_flow(client: TestClient):
    """Test updating flow"""
    # Create flow
    flow_data = {
        "name": "Original Flow",
        "config": {"version": 1}
    }
    create_response = client.post("/api/v1/flows/", json=flow_data)
    flow_id = create_response.json()["id"]
    
    # Update flow
    update_data = {
        "name": "Updated Flow",
        "config": {"version": 2}
    }
    response = client.patch(f"/api/v1/flows/{flow_id}", json=update_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == "Updated Flow"
    assert data["config"]["version"] == 2
    assert data["version"] == 2  # Version should increment



def test_deploy_flow(client: TestClient):
    """Test deploying flow"""
    # Create flow
    flow_data = {
        "name": "Deployable Flow",
        "config": {"ready": True},
        "target_nodes": ["node-001"]
    }
    create_response = client.post("/api/v1/flows/", json=flow_data)
    flow_id = create_response.json()["id"]
    
    # Deploy flow
    deploy_data = {}  # Use default target nodes
    response = client.post(f"/api/v1/flows/{flow_id}/deploy", json=deploy_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["deployed"] is True
    assert data["deployed_at"] is not None



def test_undeploy_flow(client: TestClient):
    """Test undeploying flow"""
    # Create and deploy flow
    flow_data = {
        "name": "Undeployable Flow",
        "config": {},
        "target_nodes": ["node-001"]
    }
    create_response = client.post("/api/v1/flows/", json=flow_data)
    flow_id = create_response.json()["id"]
    
    # Deploy first
    client.post(f"/api/v1/flows/{flow_id}/deploy", json={})
    
    # Undeploy
    response = client.delete(f"/api/v1/flows/{flow_id}/undeploy")
    assert response.status_code == 200
    
    data = response.json()
    assert data["deployed"] is False
    assert data["deployed_at"] is None