import asyncio
import json
import uuid
from typing import Dict, Optional, TypeVar, Generic, Callable, Any
from datetime import datetime

from .types import HALMessageEnvelope

T = TypeVar('T', bound=HALMessageEnvelope)


class ReplyHandler:
    """Handler for pending replies"""
    def __init__(self, future: asyncio.Future, retries: int = 0):
        self.future = future
        self.retries = retries
        self.timer_handle: Optional[asyncio.TimerHandle] = None


class HALRequestReplyClient(Generic[T]):
    """Base class for HAL request/reply pattern"""
    
    def __init__(self, default_timeout: float = 5.0, default_retries: int = 0):
        self.pending_requests: Dict[str, ReplyHandler] = {}
        self.default_timeout = default_timeout
        self.default_retries = default_retries
    
    async def request(
        self,
        message: Dict[str, Any],
        timeout: Optional[float] = None,
        retries: Optional[int] = None
    ) -> T:
        """Send a request and wait for a reply"""
        correlation_id = str(uuid.uuid4())
        timeout = timeout or self.default_timeout
        retries = retries or self.default_retries
        
        # Add correlation ID to message
        request_message = {**message, "correlation_id": correlation_id}
        
        # Create future for reply
        loop = asyncio.get_event_loop()
        future = loop.create_future()
        handler = ReplyHandler(future, retries)
        
        # Set timeout
        async def timeout_handler():
            if correlation_id in self.pending_requests:
                del self.pending_requests[correlation_id]
                if handler.retries > 0:
                    # Retry
                    handler.retries -= 1
                    try:
                        result = await self.request(
                            message,
                            timeout=timeout,
                            retries=handler.retries
                        )
                        future.set_result(result)
                    except Exception as e:
                        future.set_exception(e)
                else:
                    future.set_exception(
                        TimeoutError(f"Request timeout after {timeout}s")
                    )
        
        handler.timer_handle = loop.call_later(timeout, lambda: asyncio.create_task(timeout_handler()))
        self.pending_requests[correlation_id] = handler
        
        # Send the request
        await self.send_request(request_message)
        
        return await future
    
    def handle_message(self, message: Dict[str, Any]) -> bool:
        """Handle an incoming message that might be a reply"""
        correlation_id = message.get("correlation_id")
        if not correlation_id:
            return False
        
        handler = self.pending_requests.get(correlation_id)
        if not handler:
            return False
        
        # Cancel timeout and remove from pending
        if handler.timer_handle:
            handler.timer_handle.cancel()
        del self.pending_requests[correlation_id]
        
        # Resolve the future
        handler.future.set_result(message)
        return True
    
    def create_reply(
        self,
        request: Dict[str, Any],
        reply_payload: Any,
        **overrides
    ) -> Dict[str, Any]:
        """Create a reply message for a request"""
        reply = {
            **request,
            **overrides,
            "payload": reply_payload,
            "ts": datetime.utcnow().isoformat() + "Z",
            "correlation_id": request.get("correlation_id")
        }
        return reply
    
    def cancel_all(self, reason: str = "Cancelled") -> None:
        """Cancel all pending requests"""
        for correlation_id, handler in list(self.pending_requests.items()):
            if handler.timer_handle:
                handler.timer_handle.cancel()
            handler.future.set_exception(Exception(reason))
        self.pending_requests.clear()
    
    async def send_request(self, message: Dict[str, Any]) -> None:
        """Override this method to implement actual message sending"""
        raise NotImplementedError("send_request must be implemented by subclass")


class NATSHALRequestReplyClient(HALRequestReplyClient):
    """NATS-specific implementation of request/reply client"""
    
    def __init__(
        self,
        nats_client,
        request_subject: str,
        default_timeout: float = 5.0,
        default_retries: int = 0
    ):
        super().__init__(default_timeout, default_retries)
        self.nats_client = nats_client
        self.request_subject = request_subject
        self._subscription = None
    
    async def send_request(self, message: Dict[str, Any]) -> None:
        """Send request via NATS"""
        data = json.dumps(message).encode()
        await self.nats_client.publish(self.request_subject, data)
    
    async def subscribe_to_replies(self, reply_subject: str) -> None:
        """Subscribe to reply subjects and handle incoming messages"""
        async def message_handler(msg):
            try:
                message = json.loads(msg.data.decode())
                self.handle_message(message)
            except Exception as e:
                print(f"Failed to parse reply message: {e}")
        
        self._subscription = await self.nats_client.subscribe(
            reply_subject,
            cb=message_handler
        )
    
    async def close(self) -> None:
        """Clean up subscriptions"""
        if self._subscription:
            await self._subscription.unsubscribe()
        self.cancel_all("Client closed")