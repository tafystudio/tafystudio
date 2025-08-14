"""
Flow management endpoints for Node-RED integration
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
import structlog

from app.schemas.flow import FlowCreate, FlowUpdate, FlowResponse, FlowDeploy
from app.services.flow_service import flow_service

router = APIRouter()
logger = structlog.get_logger()


@router.get("/", response_model=List[FlowResponse])
async def list_flows(
    deployed_only: bool = Query(False, description="Only show deployed flows")
):
    """List available flows"""
    return await flow_service.list_flows(deployed_only=deployed_only)


@router.get("/{flow_id}", response_model=FlowResponse)
async def get_flow(flow_id: str):
    """Get flow details"""
    flow = await flow_service.get_flow(flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow


@router.post("/", response_model=FlowResponse)
async def create_flow(flow_data: FlowCreate):
    """Create a new flow"""
    return await flow_service.create_flow(flow_data)


@router.patch("/{flow_id}", response_model=FlowResponse)
async def update_flow(flow_id: str, update_data: FlowUpdate):
    """Update flow configuration"""
    flow = await flow_service.update_flow(flow_id, update_data)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow


@router.post("/{flow_id}/deploy", response_model=FlowResponse)
async def deploy_flow(flow_id: str, deploy_data: FlowDeploy = Body(default=FlowDeploy())):
    """Deploy flow to devices"""
    flow = await flow_service.deploy_flow(flow_id, deploy_data.target_nodes)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow


@router.delete("/{flow_id}/undeploy", response_model=FlowResponse)
async def undeploy_flow(flow_id: str):
    """Undeploy a running flow"""
    flow = await flow_service.undeploy_flow(flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found or not deployed")
    return flow