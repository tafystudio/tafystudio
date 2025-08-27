"""Configuration management."""

import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

import yaml


@dataclass
class NATSConfig:
    """NATS configuration."""
    url: str = "nats://localhost:4222"
    reconnect_delay: float = 5.0
    max_reconnects: int = -1


@dataclass
class Config:
    """Driver configuration."""
    device_id: str
    sample_rate: int = 10
    nats: NATSConfig = None
    start_time: datetime = None
    
    def __post_init__(self):
        if self.nats is None:
            self.nats = NATSConfig()
        if self.start_time is None:
            self.start_time = datetime.now()
    
    @classmethod
    def load(cls) -> 'Config':
        """Load configuration from environment and file."""
        # Start with defaults
        config_data = {
            'device_id': os.getenv('TAFY_DEVICE_ID', 'ultrasonic-01'),
            'sample_rate': 10
        }
        
        # Load from config file
        config_file = os.getenv('TAFY_CONFIG_FILE', 'config/default.yaml')
        if Path(config_file).exists():
            with open(config_file, 'r') as f:
                file_config = yaml.safe_load(f)
                config_data.update(file_config)
        
        # Override with environment variables
        if nats_url := os.getenv('TAFY_NATS_URL'):
            config_data.setdefault('nats', {})['url'] = nats_url
        
        # Create NATS config
        nats_config = NATSConfig(**config_data.get('nats', {}))
        
        return cls(
            device_id=config_data['device_id'],
            sample_rate=config_data.get('sample_rate', 10),
            nats=nats_config
        )
