"""
API v1 router aggregation
"""

from fastapi import APIRouter
from app.api.v1.endpoints import devices, flows, system, websocket

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(devices.router, prefix="/devices", tags=["devices"])
api_router.include_router(flows.router, prefix="/flows", tags=["flows"])
api_router.include_router(system.router, prefix="/system", tags=["system"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])