"""
Flow management service for Node-RED flows
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import structlog

from app.schemas.flow import FlowCreate, FlowUpdate, FlowResponse
from app.core.nats import nats_client

logger = structlog.get_logger()


class FlowService:
    """Service for managing Node-RED flows"""
    
    def __init__(self):
        self._flows: Dict[str, Dict[str, Any]] = {}
    
    async def create_flow(self, flow_data: FlowCreate) -> FlowResponse:
        """Create a new flow"""
        flow_id = str(uuid.uuid4())
        flow = {
            "id": flow_id,
            "name": flow_data.name,
            "description": flow_data.description,
            "config": flow_data.config,
            "target_nodes": flow_data.target_nodes,
            "flow_metadata": flow_data.flow_metadata,
            "deployed": False,
            "deployed_at": None,
            "version": 1,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        self._flows[flow_id] = flow
        
        logger.info("Flow created", flow_id=flow_id, name=flow_data.name)
        return FlowResponse(**flow)
    
    async def get_flow(self, flow_id: str) -> Optional[FlowResponse]:
        """Get flow by ID"""
        flow = self._flows.get(flow_id)
        if flow:
            return FlowResponse(**flow)
        return None
    
    async def update_flow(self, flow_id: str, update_data: FlowUpdate) -> Optional[FlowResponse]:
        """Update flow"""
        flow = self._flows.get(flow_id)
        if not flow:
            return None
        
        # Update fields
        update_dict = update_data.model_dump(exclude_unset=True)
        if update_dict:
            flow.update(update_dict)
            flow["updated_at"] = datetime.utcnow()
            flow["version"] += 1
            
            # If config changed and flow is deployed, mark as needing redeploy
            if "config" in update_dict and flow["deployed"]:
                flow["deployed"] = False
                flow["deployed_at"] = None
        
        logger.info("Flow updated", flow_id=flow_id, version=flow["version"])
        return FlowResponse(**flow)
    
    async def list_flows(self, deployed_only: bool = False) -> List[FlowResponse]:
        """List all flows"""
        flows = list(self._flows.values())
        
        if deployed_only:
            flows = [f for f in flows if f["deployed"]]
        
        return [FlowResponse(**f) for f in flows]
    
    async def deploy_flow(self, flow_id: str, target_nodes: Optional[List[str]] = None) -> Optional[FlowResponse]:
        """Deploy flow to nodes"""
        flow = self._flows.get(flow_id)
        if not flow:
            return None
        
        # Use specified nodes or flow's default targets
        nodes = target_nodes or flow["target_nodes"]
        if not nodes:
            logger.error("No target nodes specified for deployment", flow_id=flow_id)
            return None
        
        # Publish deployment command
        deployment = {
            "flow_id": flow_id,
            "config": flow["config"],
            "version": flow["version"],
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        for node in nodes:
            subject = f"node.{node}.flow.deploy"
            await nats_client.publish(subject, deployment)
        
        # Update flow status
        flow["deployed"] = True
        flow["deployed_at"] = datetime.utcnow()
        flow["updated_at"] = datetime.utcnow()
        
        logger.info("Flow deployed", flow_id=flow_id, nodes=nodes)
        return FlowResponse(**flow)
    
    async def undeploy_flow(self, flow_id: str) -> Optional[FlowResponse]:
        """Undeploy flow from nodes"""
        flow = self._flows.get(flow_id)
        if not flow or not flow["deployed"]:
            return None
        
        # Publish undeploy command
        undeploy_cmd = {
            "flow_id": flow_id,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        for node in flow["target_nodes"]:
            subject = f"node.{node}.flow.undeploy"
            await nats_client.publish(subject, undeploy_cmd)
        
        # Update flow status
        flow["deployed"] = False
        flow["deployed_at"] = None
        flow["updated_at"] = datetime.utcnow()
        
        logger.info("Flow undeployed", flow_id=flow_id)
        return FlowResponse(**flow)


# Singleton instance
flow_service = FlowService()