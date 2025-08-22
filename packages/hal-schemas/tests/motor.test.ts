import { describe, it, expect } from '@jest/globals';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load schemas
const motorDiffPath = join(__dirname, '../schemas/motor/differential.json');
const motorTelemetryPath = join(__dirname, '../schemas/motor/differential-telemetry.json');

const motorDiffSchema = JSON.parse(readFileSync(motorDiffPath, 'utf-8'));
const motorTelemetrySchema = JSON.parse(readFileSync(motorTelemetryPath, 'utf-8'));

// Setup AJV
const ajv = new Ajv({ strict: true });
addFormats(ajv);

describe('Motor Differential Schema', () => {
  const validate = ajv.compile(motorDiffSchema);

  it('should validate correct motor commands', () => {
    const validCommands = [
      {
        linear_meters_per_sec: 0.5,
        angular_rad_per_sec: 0,
      },
      {
        linear_meters_per_sec: 0,
        angular_rad_per_sec: 1.57, // 90 degrees/sec
      },
      {
        linear_meters_per_sec: 1.0,
        angular_rad_per_sec: 0.5,
        duration_ms: 1000,
      },
    ];

    validCommands.forEach(command => {
      const valid = validate(command);
      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    });
  });

  it('should validate velocity bounds', () => {
    const testCases = [
      { linear_meters_per_sec: 5.0, angular_rad_per_sec: 3.0, valid: true },
      { linear_meters_per_sec: -5.0, angular_rad_per_sec: -3.0, valid: true },
      { linear_meters_per_sec: 11.0, angular_rad_per_sec: 0, valid: false }, // exceeds max
      { linear_meters_per_sec: 0, angular_rad_per_sec: 7.0, valid: false }, // exceeds max angular
      { linear_meters_per_sec: -11.0, angular_rad_per_sec: 0, valid: false }, // exceeds min
    ];

    testCases.forEach(({ linear_meters_per_sec, angular_rad_per_sec, valid: expectedValid }) => {
      const command = { linear_meters_per_sec, angular_rad_per_sec };
      const isValid = validate(command);
      expect(isValid).toBe(expectedValid);
    });
  });

  it('should require both velocities', () => {
    const invalidCommands = [
      { linear_meters_per_sec: 0.5 }, // missing angular
      { angular_rad_per_sec: 0.5 }, // missing linear
      {}, // empty object
    ];

    invalidCommands.forEach(command => {
      const valid = validate(command);
      expect(valid).toBe(false);
      expect(validate.errors).toBeDefined();
    });
  });

  it('should validate optional fields', () => {
    const commandWithOptionals = {
      linear_meters_per_sec: 1.0,
      angular_rad_per_sec: 0,
      duration_ms: 5000,
      acceleration_meters_per_sec2: 2.0,
      angular_acceleration_rad_per_sec2: 1.5,
      priority: 'high',
    };

    const valid = validate(commandWithOptionals);
    expect(valid).toBe(true);
  });

  it('should validate priority enum', () => {
    const testCases = [
      { priority: 'low', valid: true },
      { priority: 'normal', valid: true },
      { priority: 'high', valid: true },
      { priority: 'emergency', valid: true },
      { priority: 'urgent', valid: false }, // not in enum
      { priority: 'LOW', valid: false }, // case sensitive
    ];

    testCases.forEach(({ priority, valid: expectedValid }) => {
      const command = {
        linear_meters_per_sec: 0,
        angular_rad_per_sec: 0,
        priority,
      };
      const isValid = validate(command);
      expect(isValid).toBe(expectedValid);
    });
  });
});

describe('Motor Telemetry Schema', () => {
  const validate = ajv.compile(motorTelemetrySchema);

  it('should validate correct telemetry data', () => {
    const validTelemetry = {
      actual_linear_meters_per_sec: 0.5,
      actual_angular_rad_per_sec: 0.1,
      odometry: {
        x_meters: 1.5,
        y_meters: 0.3,
        theta_rad: 0.785, // 45 degrees
      },
    };

    const valid = validate(validTelemetry);
    expect(valid).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('should validate with all optional fields', () => {
    const fullTelemetry = {
      actual_linear_meters_per_sec: 0.5,
      actual_angular_rad_per_sec: 0,
      commanded_linear_meters_per_sec: 0.5,
      commanded_angular_rad_per_sec: 0,
      odometry: {
        x_meters: 1.0,
        y_meters: 0,
        theta_rad: 0,
        distance_meters: 1.0,
      },
      wheel_velocities: {
        left_meters_per_sec: 0.5,
        right_meters_per_sec: 0.5,
      },
      current_draw_amps: 2.5,
      temperature_celsius: 35.5,
      status: 'moving',
    };

    const valid = validate(fullTelemetry);
    expect(valid).toBe(true);
  });

  it('should require odometry', () => {
    const telemetryWithoutOdometry = {
      actual_linear_meters_per_sec: 0,
      actual_angular_rad_per_sec: 0,
      // missing odometry
    };

    const valid = validate(telemetryWithoutOdometry);
    expect(valid).toBe(false);
    expect(validate.errors).toBeDefined();
  });

  it('should validate status enum', () => {
    const testCases = [
      { status: 'idle', valid: true },
      { status: 'moving', valid: true },
      { status: 'stalled', valid: true },
      { status: 'error', valid: true },
      { status: 'emergency_stop', valid: true },
      { status: 'stopped', valid: false }, // not in enum
    ];

    testCases.forEach(({ status, valid: expectedValid }) => {
      const telemetry = {
        actual_linear_meters_per_sec: 0,
        actual_angular_rad_per_sec: 0,
        odometry: { x_meters: 0, y_meters: 0, theta_rad: 0 },
        status,
      };
      const isValid = validate(telemetry);
      expect(isValid).toBe(expectedValid);
    });
  });

  it('should validate current draw is non-negative', () => {
    const telemetryWithNegativeCurrent = {
      actual_linear_meters_per_sec: 0,
      actual_angular_rad_per_sec: 0,
      odometry: { x_meters: 0, y_meters: 0, theta_rad: 0 },
      current_draw_amps: -1.0, // negative current
    };

    const valid = validate(telemetryWithNegativeCurrent);
    expect(valid).toBe(false);
  });
});