"""
Custom exceptions and error handlers
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import structlog

logger = structlog.get_logger()


class TafyException(Exception):
    """Base exception for Tafy Studio"""
    def __init__(self, message: str, status_code: int = 500, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class DeviceNotFoundError(TafyException):
    """Device not found error"""
    def __init__(self, device_id: str):
        super().__init__(
            message=f"Device {device_id} not found",
            status_code=404,
            details={"device_id": device_id}
        )


class FlowNotFoundError(TafyException):
    """Flow not found error"""
    def __init__(self, flow_id: str):
        super().__init__(
            message=f"Flow {flow_id} not found",
            status_code=404,
            details={"flow_id": flow_id}
        )


class NATSConnectionError(TafyException):
    """NATS connection error"""
    def __init__(self, message: str = "Failed to connect to NATS"):
        super().__init__(
            message=message,
            status_code=503,
            details={"service": "nats"}
        )


async def tafy_exception_handler(request: Request, exc: TafyException):
    """Handle Tafy exceptions"""
    logger.error(
        "Tafy exception occurred",
        exception=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        path=request.url.path,
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "details": exc.details,
            "type": exc.__class__.__name__,
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    logger.warning(
        "Validation error",
        errors=exc.errors(),
        path=request.url.path,
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation failed",
            "details": exc.errors(),
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    logger.warning(
        "HTTP exception",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path,
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
        }
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.exception(
        "Unhandled exception occurred",
        exception=str(exc),
        path=request.url.path,
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
        }
    )


def add_exception_handlers(app):
    """Add exception handlers to the FastAPI app"""
    app.add_exception_handler(TafyException, tafy_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)