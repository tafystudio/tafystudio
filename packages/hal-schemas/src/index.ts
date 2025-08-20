/**
 * HAL Schema Definitions and Utilities
 */

export const HAL_VERSION = {
  major: 1,
  minor: 0,
} as const;

export const SCHEMAS = {
  common: {
    envelope: 'tafylabs/hal/common/envelope/1.0',
  },
  motor: {
    differential: 'tafylabs/hal/motor/differential/1.0',
    differentialTelemetry: 'tafylabs/hal/motor/differential-telemetry/1.0',
  },
  sensor: {
    rangeTof: 'tafylabs/hal/sensor/range-tof/1.0',
    imu: 'tafylabs/hal/sensor/imu/1.0',
  },
  system: {
    discovery: 'tafylabs/hal/system/discovery/1.0',
    heartbeat: 'tafylabs/hal/system/heartbeat/1.0',
  },
} as const;

export const CAPABILITIES = {
  motor: {
    differential: 'motor.differential:v1.0',
  },
  sensor: {
    rangeTof: 'sensor.range-tof:v1.0',
    imu: 'sensor.imu:v1.0',
  },
  system: {
    discovery: 'system.discovery:v1.0',
    heartbeat: 'system.heartbeat:v1.0',
  },
} as const;

export const NATS_SUBJECTS = {
  // Command subjects (hub -> device)
  motor: {
    differential: 'hal.v1.motor.differential.cmd',
  },
  
  // Data subjects (device -> hub)
  sensor: {
    rangeTof: 'hal.v1.sensor.range.tof.data',
    imu: 'hal.v1.sensor.imu.data',
  },
  
  // Telemetry subjects (device -> hub)
  telemetry: {
    motor: 'hal.v1.motor.differential.telemetry',
  },
  
  // System subjects
  system: {
    discovery: 'hal.v1.system.discovery',
    heartbeat: 'hal.v1.system.heartbeat',
  },
} as const;

/**
 * Create a HAL message envelope
 */
export function createEnvelope<T extends object>(
  schema: string,
  deviceId: string,
  capabilities: string[],
  payload: T,
  options?: {
    seq?: number;
    correlationId?: string;
  }
) {
  return {
    hal_major: HAL_VERSION.major,
    hal_minor: HAL_VERSION.minor,
    schema,
    device_id: deviceId,
    caps: capabilities,
    ts: new Date().toISOString(),
    payload,
    ...(options?.seq !== undefined && { seq: options.seq }),
    ...(options?.correlationId && { correlation_id: options.correlationId }),
  };
}

/**
 * Parse a capability string into its components
 */
export function parseCapability(capability: string): {
  domain: string;
  type: string;
  version: { major: number; minor: number };
} {
  const match = capability.match(/^([a-z0-9-]+)\.([a-z0-9-]+):v(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid capability format: ${capability}`);
  }
  
  return {
    domain: match[1],
    type: match[2],
    version: {
      major: parseInt(match[3], 10),
      minor: parseInt(match[4], 10),
    },
  };
}

/**
 * Check if a device supports a specific capability
 */
export function hasCapability(
  deviceCapabilities: string[],
  requiredCapability: string
): boolean {
  return deviceCapabilities.includes(requiredCapability);
}

/**
 * Get NATS subject for a schema
 */
export function getSubjectForSchema(schema: string): string | undefined {
  // This is a simplified implementation
  // In practice, you'd have a more sophisticated mapping
  if (schema.includes('motor/differential/')) {
    return NATS_SUBJECTS.motor.differential;
  }
  if (schema.includes('sensor/range-tof/')) {
    return NATS_SUBJECTS.sensor.rangeTof;
  }
  if (schema.includes('sensor/imu/')) {
    return NATS_SUBJECTS.sensor.imu;
  }
  if (schema.includes('system/discovery/')) {
    return NATS_SUBJECTS.system.discovery;
  }
  if (schema.includes('system/heartbeat/')) {
    return NATS_SUBJECTS.system.heartbeat;
  }
  if (schema.includes('motor/differential-telemetry/')) {
    return NATS_SUBJECTS.telemetry.motor;
  }
  
  return undefined;
}

// Re-export generated types (will be created by json-schema-to-typescript)
export * from './types';

// Export request-reply functionality
export * from './request-reply';