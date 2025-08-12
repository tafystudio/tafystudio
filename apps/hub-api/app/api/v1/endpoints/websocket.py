"""
WebSocket endpoints for real-time communication
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import structlog

router = APIRouter()
logger = structlog.get_logger()

# Active WebSocket connections
active_connections: Set[WebSocket] = set()


@router.websocket("/events")
async def websocket_events(websocket: WebSocket):
    """WebSocket endpoint for real-time events"""
    await websocket.accept()
    active_connections.add(websocket)
    
    try:
        logger.info("WebSocket client connected")
        
        # Send initial connection message
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "message": "Connected to Tafy Hub"
        })
        
        # Keep connection alive and handle messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            elif message.get("type") == "subscribe":
                # TODO: Implement topic subscription
                topic = message.get("topic")
                logger.info("Client subscribed to topic", topic=topic)
                await websocket.send_json({
                    "type": "subscribed",
                    "topic": topic
                })
                
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error("WebSocket error", error=str(e))
    finally:
        active_connections.discard(websocket)


async def broadcast_event(event: Dict):
    """Broadcast event to all connected WebSocket clients"""
    disconnected = set()
    
    for connection in active_connections:
        try:
            await connection.send_json(event)
        except:
            disconnected.add(connection)
            
    # Remove disconnected clients
    for conn in disconnected:
        active_connections.discard(conn)