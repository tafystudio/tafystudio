"""ultrasonic driver implementation."""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import nats
from aiohttp import web
from prometheus_client import Counter, Gauge, generate_latest

from .config import Config
from .hal import HALMessage

logger = logging.getLogger(__name__)


class ultrasonicDriver:
    """ultrasonic sensor driver."""

    def __init__(self, config: Config) -> None:
        self.config = config
        self.nc: Optional[nats.NATS] = None
        self.js: Optional[nats.JetStreamContext] = None
        self._running = False
        
        # Metrics
        self.messages_published = Counter(
            'tafy_driver_messages_published_total',
            'Total messages published',
            ['driver']
        )
        self.messages_failed = Counter(
            'tafy_driver_messages_failed_total', 
            'Total failed messages',
            ['driver']
        )
        self.readings = Gauge(
            'tafy_sensor_ultrasonic_value',
            'Current ultrasonic sensor reading'
        )
        
        # HTTP server
        self.app = web.Application()
        self._setup_routes()

    def _setup_routes(self) -> None:
        """Setup HTTP routes."""
        self.app.router.add_get('/health', self._health_handler)
        self.app.router.add_get('/metrics', self._metrics_handler)

    async def run(self) -> None:
        """Run the driver."""
        # Connect to NATS
        self.nc = await nats.connect(self.config.nats.url)
        self.js = self.nc.jetstream()
        
        # Subscribe to commands
        await self.nc.subscribe(
            f"hal.v1.sensor.ultrasonic.cmd",
            cb=self._handle_command
        )
        
        # Start HTTP server
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', 8080)
        asyncio.create_task(site.start())
        
        # Main loop
        self._running = True
        interval = 1.0 / self.config.sample_rate
        
        while self._running:
            try:
                await self._process_loop()
                await asyncio.sleep(interval)
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                self.messages_failed.labels(driver='ultrasonic').inc()

    
    async def _process_loop(self) -> None:
        """Read sensor and publish data."""
        # TODO: Read from actual hardware
        value = 42.0  # Replace with actual sensor reading
        
        # Update metric
        self.readings.set(value)
        
        # Create HAL message
        message = HALMessage(
            hal_major=1,
            hal_minor=0,
            schema="tafylabs/hal/sensor/ultrasonic/1.0",
            device_id=self.config.device_id,
            caps=["sensor.ultrasonic:v1.0"],
            ts=datetime.now(timezone.utc).isoformat(),
            payload={
                "value": value,
                "unit": "TODO"
            }
        )
        
        # Publish
        await self.nc.publish(
            "hal.v1.sensor.ultrasonic.data",
            json.dumps(message.model_dump()).encode()
        )
        self.messages_published.labels(driver='ultrasonic').inc()
    

    async def _handle_command(self, msg: nats.Msg) -> None:
        """Handle incoming commands."""
        try:
            data = json.loads(msg.data.decode())
            command = HALMessage(**data)
            
            # TODO: Handle commands based on payload
            logger.info(f"Received command: {command.payload}")
            
            # Send acknowledgment
            ack = HALMessage(
                hal_major=1,
                hal_minor=0,
                schema="tafylabs/hal/sensor/ultrasonic/ack/1.0",
                device_id=self.config.device_id,
                caps=["sensor.ultrasonic:v1.0"],
                ts=datetime.now(timezone.utc).isoformat(),
                payload={
                    "status": "ok",
                    "command": command.payload
                }
            )
            
            await self.nc.publish(
                f"hal.v1.sensor.ultrasonic.ack",
                json.dumps(ack.model_dump()).encode()
            )
            
        except Exception as e:
            logger.error(f"Failed to handle command: {e}")

    async def _health_handler(self, request: web.Request) -> web.Response:
        """Health check handler."""
        return web.json_response({
            "status": "healthy",
            "device_id": self.config.device_id,
            "uptime": (datetime.now() - self.config.start_time).total_seconds()
        })

    async def _metrics_handler(self, request: web.Request) -> web.Response:
        """Prometheus metrics handler."""
        metrics = generate_latest()
        return web.Response(
            body=metrics,
            content_type="text/plain; version=0.0.4"
        )

    def stop(self) -> None:
        """Stop the driver."""
        self._running = False

    async def cleanup(self) -> None:
        """Cleanup resources."""
        if self.nc and self.nc.is_connected:
            await self.nc.close()
