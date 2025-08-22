import { describe, it, expect } from '@jest/globals';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load schemas
const rangeTofPath = join(__dirname, '../schemas/sensor/range-tof.json');
const imuPath = join(__dirname, '../schemas/sensor/imu.json');

const rangeTofSchema = JSON.parse(readFileSync(rangeTofPath, 'utf-8'));
const imuSchema = JSON.parse(readFileSync(imuPath, 'utf-8'));

// Setup AJV
const ajv = new Ajv({ strict: true });
addFormats(ajv);

describe('Range ToF Sensor Schema', () => {
  const validate = ajv.compile(rangeTofSchema);

  it('should validate correct range data', () => {
    const validRangeData = {
      sensor_id: 'tof_front',
      range_meters: 1.5,
      quality: 95,
    };

    const valid = validate(validRangeData);
    expect(valid).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('should validate with optional fields', () => {
    const fullData = {
      sensor_id: 'tof_front',
      range_meters: 0.5,
      quality: 90,
      min_range_meters: 0.02,
      max_range_meters: 4.0,
      field_of_view_deg: 25,
      ambient_light_level: 100,
      temperature_celsius: 25.5,
      status: 'ok',
      raw_value: 12345,
    };

    const valid = validate(fullData);
    expect(valid).toBe(true);
  });

  it('should validate range bounds', () => {
    const testCases = [
      { range_meters: 0, valid: true },
      { range_meters: 5.0, valid: true },
      { range_meters: 10.0, valid: true },
      { range_meters: 10.1, valid: false }, // exceeds max
      { range_meters: -0.1, valid: false }, // negative
    ];

    testCases.forEach(({ range_meters, valid: expectedValid }) => {
      const data = { 
        sensor_id: 'test',
        range_meters,
        quality: 50,
      };
      const isValid = validate(data);
      expect(isValid).toBe(expectedValid);
    });
  });

  it('should validate quality percentage', () => {
    const testCases = [
      { quality: 0, valid: true },
      { quality: 50, valid: true },
      { quality: 100, valid: true },
      { quality: 101, valid: false }, // exceeds max
      { quality: -1, valid: false }, // negative
    ];

    testCases.forEach(({ quality, valid: expectedValid }) => {
      const data = { 
        sensor_id: 'test',
        range_meters: 1.0,
        quality,
      };
      const isValid = validate(data);
      expect(isValid).toBe(expectedValid);
    });
  });

  it('should require all mandatory fields', () => {
    const invalidData = [
      { range_meters: 1.0, quality: 90 }, // missing sensor_id
      { sensor_id: 'test', quality: 90 }, // missing range_meters
      { sensor_id: 'test', range_meters: 1.0 }, // missing quality
    ];

    invalidData.forEach(data => {
      const valid = validate(data);
      expect(valid).toBe(false);
    });
  });

  it('should validate status enum values', () => {
    const testCases = [
      { status: 'ok', valid: true },
      { status: 'out_of_range', valid: true },
      { status: 'low_signal', valid: true },
      { status: 'high_ambient_light', valid: true },
      { status: 'error', valid: true },
      { status: 'warning', valid: false }, // not in enum
    ];

    testCases.forEach(({ status, valid: expectedValid }) => {
      const data = {
        sensor_id: 'test',
        range_meters: 1.0,
        quality: 90,
        status,
      };
      const isValid = validate(data);
      expect(isValid).toBe(expectedValid);
    });
  });
});

describe('IMU Sensor Schema', () => {
  const validate = ajv.compile(imuSchema);

  it('should validate correct IMU data', () => {
    const validImuData = {
      acceleration: {
        x_meters_per_sec2: 0.1,
        y_meters_per_sec2: -0.2,
        z_meters_per_sec2: 9.8,
      },
      angular_velocity: {
        x_rad_per_sec: 0.01,
        y_rad_per_sec: -0.02,
        z_rad_per_sec: 0.03,
      },
    };

    const valid = validate(validImuData);
    expect(valid).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('should validate with optional magnetic field', () => {
    const imuWithMag = {
      acceleration: {
        x_meters_per_sec2: 0,
        y_meters_per_sec2: 0,
        z_meters_per_sec2: 9.8,
      },
      angular_velocity: {
        x_rad_per_sec: 0,
        y_rad_per_sec: 0,
        z_rad_per_sec: 0,
      },
      magnetic_field: {
        x_gauss: 0.25,
        y_gauss: -0.05,
        z_gauss: 0.35,
      },
    };

    const valid = validate(imuWithMag);
    expect(valid).toBe(true);
  });

  it('should validate with orientation data', () => {
    const imuWithOrientation = {
      acceleration: {
        x_meters_per_sec2: 0,
        y_meters_per_sec2: 0,
        z_meters_per_sec2: 9.8,
      },
      angular_velocity: {
        x_rad_per_sec: 0,
        y_rad_per_sec: 0,
        z_rad_per_sec: 0,
      },
      orientation: {
        quaternion: { w: 1.0, x: 0, y: 0, z: 0 },
        euler: {
          roll_rad: 0,
          pitch_rad: 0,
          yaw_rad: 0,
        },
      },
    };

    const valid = validate(imuWithOrientation);
    expect(valid).toBe(true);
  });

  it('should validate temperature', () => {
    const imuWithTemp = {
      acceleration: {
        x_meters_per_sec2: 0,
        y_meters_per_sec2: 0,
        z_meters_per_sec2: 9.8,
      },
      angular_velocity: {
        x_rad_per_sec: 0,
        y_rad_per_sec: 0,
        z_rad_per_sec: 0,
      },
      temperature_celsius: 25.5,
    };

    const valid = validate(imuWithTemp);
    expect(valid).toBe(true);
  });

  it('should require core fields', () => {
    const invalidData = [
      {
        // missing acceleration
        angular_velocity: {
          x_rad_per_sec: 0,
          y_rad_per_sec: 0,
          z_rad_per_sec: 0,
        },
      },
      {
        acceleration: {
          x_meters_per_sec2: 0,
          y_meters_per_sec2: 0,
          z_meters_per_sec2: 9.8,
        },
        // missing angular_velocity
      },
    ];

    invalidData.forEach(data => {
      const valid = validate(data);
      expect(valid).toBe(false);
    });
  });

  it('should validate calibration status', () => {
    const imuWithCalibration = {
      acceleration: {
        x_meters_per_sec2: 0,
        y_meters_per_sec2: 0,
        z_meters_per_sec2: 9.8,
      },
      angular_velocity: {
        x_rad_per_sec: 0,
        y_rad_per_sec: 0,
        z_rad_per_sec: 0,
      },
      calibration_status: {
        system: 3,
        accelerometer: 3,
        gyroscope: 2,
        magnetometer: 1,
      },
    };

    const valid = validate(imuWithCalibration);
    expect(valid).toBe(true);
  });

  it('should validate calibration status bounds', () => {
    const invalidCalibration = {
      acceleration: {
        x_meters_per_sec2: 0,
        y_meters_per_sec2: 0,
        z_meters_per_sec2: 9.8,
      },
      angular_velocity: {
        x_rad_per_sec: 0,
        y_rad_per_sec: 0,
        z_rad_per_sec: 0,
      },
      calibration_status: {
        system: 4, // exceeds max of 3
      },
    };

    const valid = validate(invalidCalibration);
    expect(valid).toBe(false);
  });
});