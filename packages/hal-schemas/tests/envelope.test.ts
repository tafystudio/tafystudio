import { describe, it, expect } from '@jest/globals';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load schema
const schemaPath = join(__dirname, '../schemas/common/envelope.json');
const envelopeSchema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

// Setup AJV
const ajv = new Ajv({ strict: true });
addFormats(ajv);

describe('HAL Envelope Schema', () => {
  const validate = ajv.compile(envelopeSchema);

  it('should validate a correct envelope', () => {
    const validEnvelope = {
      hal_major: 1,
      hal_minor: 0,
      schema: 'tafylabs/hal/motor/differential/1.0',
      device_id: 'esp32-test-001',
      caps: ['motor.differential:v1.0', 'sensor.range-tof:v1.0'],
      ts: '2024-03-14T10:30:00.000Z',
      payload: {
        left_speed: 0.5,
        right_speed: 0.5,
      },
    };

    const valid = validate(validEnvelope);
    expect(valid).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('should accept optional fields', () => {
    const envelopeWithOptionals = {
      hal_major: 1,
      hal_minor: 0,
      schema: 'tafylabs/hal/motor/differential/1.0',
      device_id: 'esp32-test-001',
      caps: ['motor.differential:v1.0'],
      ts: '2024-03-14T10:30:00.000Z',
      payload: {},
      seq: 42,
      correlation_id: 'req-123-456',
    };

    const valid = validate(envelopeWithOptionals);
    expect(valid).toBe(true);
  });

  it('should reject missing required fields', () => {
    const invalidEnvelope = {
      hal_major: 1,
      // Missing hal_minor
      schema: 'tafylabs/hal/motor/differential/1.0',
      device_id: 'esp32-test-001',
      caps: ['motor.differential:v1.0'],
      ts: '2024-03-14T10:30:00.000Z',
      payload: {},
    };

    const valid = validate(invalidEnvelope);
    expect(valid).toBe(false);
    expect(validate.errors).toBeDefined();
    expect(validate.errors![0].message).toContain('required property');
  });

  it('should validate device_id format', () => {
    const testCases = [
      { device_id: 'esp32-001', valid: true },
      { device_id: 'ESP32_001', valid: true },
      { device_id: 'device_name-123', valid: true },
      { device_id: 'device name', valid: false }, // spaces not allowed
      { device_id: 'device@name', valid: false }, // @ not allowed
      { device_id: '', valid: false }, // empty string
      { device_id: 'a'.repeat(65), valid: false }, // too long
    ];

    testCases.forEach(({ device_id, valid: expectedValid }) => {
      const envelope = {
        hal_major: 1,
        hal_minor: 0,
        schema: 'tafylabs/hal/motor/differential/1.0',
        device_id,
        caps: ['motor.differential:v1.0'],
        ts: '2024-03-14T10:30:00.000Z',
        payload: {},
      };

      const isValid = validate(envelope);
      expect(isValid).toBe(expectedValid);
    });
  });

  it('should validate capability format', () => {
    const testCases = [
      { caps: ['motor.differential:v1.0'], valid: true },
      { caps: ['sensor.range-tof:v1.0'], valid: true },
      { caps: ['motor.differential:v1.0', 'sensor.imu:v2.1'], valid: true },
      { caps: ['motor.differential'], valid: false }, // missing version
      { caps: ['motor.differential:1.0'], valid: false }, // missing v prefix
      { caps: ['Motor.Differential:v1.0'], valid: false }, // uppercase
      { caps: [], valid: true }, // empty array is valid
    ];

    testCases.forEach(({ caps, valid: expectedValid }) => {
      const envelope = {
        hal_major: 1,
        hal_minor: 0,
        schema: 'tafylabs/hal/motor/differential/1.0',
        device_id: 'test-device',
        caps,
        ts: '2024-03-14T10:30:00.000Z',
        payload: {},
      };

      const isValid = validate(envelope);
      expect(isValid).toBe(expectedValid);
    });
  });

  it('should validate schema format', () => {
    const testCases = [
      { schema: 'tafylabs/hal/motor/differential/1.0', valid: true },
      { schema: 'custom-org/hal/sensor/range/2.1', valid: true },
      { schema: 'org/hal/type/subtype/1.0', valid: true },
      { schema: 'org/HAL/type/subtype/1.0', valid: false }, // uppercase
      { schema: 'org/hal/type/subtype/v1.0', valid: false }, // v prefix
      { schema: 'org/hal/type/subtype/1', valid: false }, // missing minor
      { schema: 'motor/differential/1.0', valid: false }, // missing prefix
    ];

    testCases.forEach(({ schema, valid: expectedValid }) => {
      const envelope = {
        hal_major: 1,
        hal_minor: 0,
        schema,
        device_id: 'test-device',
        caps: ['motor.differential:v1.0'],
        ts: '2024-03-14T10:30:00.000Z',
        payload: {},
      };

      const isValid = validate(envelope);
      expect(isValid).toBe(expectedValid);
    });
  });

  it('should validate timestamp format', () => {
    const testCases = [
      { ts: '2024-03-14T10:30:00.000Z', valid: true },
      { ts: '2024-03-14T10:30:00Z', valid: true },
      { ts: '2024-03-14T10:30:00+00:00', valid: true },
      { ts: '2024-03-14 10:30:00', valid: false }, // not ISO 8601
      { ts: '2024-03-14', valid: false }, // date only
      { ts: '', valid: false }, // empty string
    ];

    testCases.forEach(({ ts, valid: expectedValid }) => {
      const envelope = {
        hal_major: 1,
        hal_minor: 0,
        schema: 'tafylabs/hal/motor/differential/1.0',
        device_id: 'test-device',
        caps: ['motor.differential:v1.0'],
        ts,
        payload: {},
      };

      const isValid = validate(envelope);
      expect(isValid).toBe(expectedValid);
    });
  });

  it('should reject additional properties', () => {
    const envelopeWithExtra = {
      hal_major: 1,
      hal_minor: 0,
      schema: 'tafylabs/hal/motor/differential/1.0',
      device_id: 'test-device',
      caps: ['motor.differential:v1.0'],
      ts: '2024-03-14T10:30:00.000Z',
      payload: {},
      extra_field: 'should not be here', // This should cause validation to fail
    };

    const valid = validate(envelopeWithExtra);
    expect(valid).toBe(false);
    expect(validate.errors![0].message).toContain('additional properties');
  });

  it('should validate version numbers', () => {
    const testCases = [
      { hal_major: 1, hal_minor: 0, valid: true },
      { hal_major: 2, hal_minor: 5, valid: true },
      { hal_major: 0, hal_minor: 0, valid: false }, // major must be >= 1
      { hal_major: -1, hal_minor: 0, valid: false }, // negative
      { hal_major: 1.5, hal_minor: 0, valid: false }, // float
      { hal_major: 1, hal_minor: -1, valid: false }, // negative minor
    ];

    testCases.forEach(({ hal_major, hal_minor, valid: expectedValid }) => {
      const envelope = {
        hal_major,
        hal_minor,
        schema: 'tafylabs/hal/motor/differential/1.0',
        device_id: 'test-device',
        caps: ['motor.differential:v1.0'],
        ts: '2024-03-14T10:30:00.000Z',
        payload: {},
      };

      const isValid = validate(envelope);
      expect(isValid).toBe(expectedValid);
    });
  });
});