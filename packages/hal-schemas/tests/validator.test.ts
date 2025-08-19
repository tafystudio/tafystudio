import { HALValidator } from '../src/validator';
import { createEnvelope, SCHEMAS, CAPABILITIES } from '../src';

describe('HAL Validator', () => {
  let validator: HALValidator;
  
  beforeAll(() => {
    validator = new HALValidator();
  });
  
  describe('Schema Loading', () => {
    it('should load all schemas', () => {
      const schemaIds = validator.getSchemaIds();
      expect(schemaIds.length).toBeGreaterThan(0);
      expect(schemaIds).toContain('https://tafy.studio/schemas/hal/common/envelope/1.0');
    });
  });
  
  describe('Envelope Validation', () => {
    it('should validate a valid envelope', () => {
      const envelope = createEnvelope(
        SCHEMAS.motor.differential,
        'test-device-001',
        [CAPABILITIES.motor.differential],
        { linear_meters_per_sec: 0.5, angular_rad_per_sec: 0 }
      );
      
      const result = validator.validate(
        'https://tafy.studio/schemas/hal/common/envelope/1.0',
        envelope
      );
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
    
    it('should reject invalid envelope', () => {
      const invalidEnvelope = {
        // Missing required fields
        device_id: 'test',
        payload: {},
      };
      
      const result = validator.validate(
        'https://tafy.studio/schemas/hal/common/envelope/1.0',
        invalidEnvelope
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
  
  describe('Motor Command Validation', () => {
    it('should validate valid differential motor command', () => {
      const command = {
        linear_meters_per_sec: 1.0,
        angular_rad_per_sec: 0.5,
        duration_ms: 1000,
        priority: 'normal',
      };
      
      const result = validator.validate(
        'https://tafy.studio/schemas/hal/motor/differential/1.0',
        command
      );
      
      expect(result.valid).toBe(true);
    });
    
    it('should reject command with invalid velocity', () => {
      const command = {
        linear_meters_per_sec: 20, // Exceeds max
        angular_rad_per_sec: 0,
      };
      
      const result = validator.validate(
        'https://tafy.studio/schemas/hal/motor/differential/1.0',
        command
      );
      
      expect(result.valid).toBe(false);
    });
  });
  
  describe('Complete Message Validation', () => {
    it('should validate complete HAL message', () => {
      const message = createEnvelope(
        SCHEMAS.sensor.rangeTof,
        'esp32-sensor-001',
        [CAPABILITIES.sensor.rangeTof],
        {
          sensor_id: 'tof-front',
          range_meters: 1.5,
          quality: 95,
          status: 'ok',
        }
      );
      
      const result = validator.validateMessage(message);
      
      if (!result.valid) {
        console.log('Validation errors:', JSON.stringify(result.errors, null, 2));
      }
      
      expect(result.valid).toBe(true);
    });
  });
});