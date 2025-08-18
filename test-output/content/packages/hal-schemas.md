# HAL Schemas

Hardware Abstraction Layer (HAL) schemas for Tafy Studio, providing standardized message formats for robot communication.

## Overview

This package contains JSON Schema definitions for all HAL messages, along with TypeScript and Python type definitions generated from these schemas.

## Structure

```text
schemas/
├── common/          # Common schemas (envelope)
├── motor/           # Motor control schemas
├── sensor/          # Sensor data schemas
└── system/          # System messages (discovery, heartbeat)

src/                 # TypeScript source
├── index.ts         # Main exports and utilities
├── validator.ts     # JSON Schema validator
└── types/           # Generated TypeScript types

python/              # Generated Python types
└── tafy_hal_schemas/
```

## Usage

### TypeScript

```typescript
import { createEnvelope, SCHEMAS, CAPABILITIES, HALValidator } from '@tafy/hal-schemas';

// Create a motor command message
const message = createEnvelope(
  SCHEMAS.motor.differential,
  'esp32-motor-001',
  [CAPABILITIES.motor.differential],
  {
    linear_meters_per_sec: 0.5,
    angular_rad_per_sec: 0.0,
  }
);

// Validate messages
const validator = new HALValidator();
const result = validator.validateMessage(message);
```

### Python

```python
from tafy_hal_schemas import Envelope, Differential

# Create a motor command
command = Differential(
    linear_meters_per_sec=0.5,
    angular_rad_per_sec=0.0
)
```

## Development

### Generate Types

```bash
# Generate TypeScript types
pnpm run generate:types

# Generate Python types
pnpm run generate:python

# Generate both
pnpm run build
```

### Validate Schemas

```bash
# Validate all schemas
pnpm run validate

# Run tests
pnpm test
```

## Schema Versioning

HAL uses semantic versioning for schemas:

- Major version: Breaking changes
- Minor version: Backward compatible additions

Schema IDs follow the pattern: `tafylabs/hal/{domain}/{type}/{major}.{minor}`

## License

Apache 2.0
