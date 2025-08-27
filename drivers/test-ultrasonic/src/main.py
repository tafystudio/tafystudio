#!/usr/bin/env python3
"""ultrasonic driver main entry point."""

import asyncio
import logging
import signal
import sys
from typing import Optional

from src.config import Config
from src.driver import ultrasonicDriver

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def main() -> None:
    """Main entry point."""
    # Load configuration
    try:
        config = Config.load()
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        sys.exit(1)

    # Create driver
    driver = ultrasonicDriver(config)
    
    # Setup signal handlers
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, driver.stop)

    # Run driver
    logger.info(f"Starting ultrasonic driver (ID: {config.device_id})")
    try:
        await driver.run()
    except Exception as e:
        logger.error(f"Driver failed: {e}")
        sys.exit(1)
    finally:
        await driver.cleanup()

    logger.info("Driver stopped")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
