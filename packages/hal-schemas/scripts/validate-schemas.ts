#!/usr/bin/env node

import { HALValidator } from '../src/validator';

/**
 * Validate all JSON schemas in the schemas directory
 */
function validateAllSchemas() {
  const validator = new HALValidator();
  const schemaIds = validator.getSchemaIds();
  
  console.log(`Found ${schemaIds.length} schemas to validate\n`);
  
  let hasErrors = false;
  
  for (const schemaId of schemaIds) {
    // Create a minimal valid example for each schema type
    const schemaPath = schemaId.split('/').slice(-2).join('/');
    let testData: any;
    
    if (schemaPath.includes('envelope')) {
      testData = {
        hal_major: 1,
        hal_minor: 0,
        schema: 'tafylabs/hal/test/test/1.0',
        device_id: 'test-device',
        caps: ['test.capability:v1.0'],
        ts: new Date().toISOString(),
        payload: {}
      };
    } else if (schemaPath.includes('differential/1.0')) {
      testData = {
        linear_meters_per_sec: 0.5,
        angular_rad_per_sec: 0.0
      };
    } else if (schemaPath.includes('differential-telemetry')) {
      testData = {
        actual_linear_meters_per_sec: 0.5,
        actual_angular_rad_per_sec: 0.0,
        odometry: {
          x_meters: 0,
          y_meters: 0,
          theta_rad: 0
        }
      };
    } else if (schemaPath.includes('range-tof')) {
      testData = {
        sensor_id: 'tof-front',
        range_meters: 1.5,
        quality: 95,
        status: 'ok'
      };
    } else if (schemaPath.includes('imu')) {
      testData = {
        acceleration: { 
          x_meters_per_sec2: 0, 
          y_meters_per_sec2: 0, 
          z_meters_per_sec2: 9.81 
        },
        angular_velocity: { 
          x_rad_per_sec: 0, 
          y_rad_per_sec: 0, 
          z_rad_per_sec: 0 
        }
      };
    } else if (schemaPath.includes('discovery')) {
      testData = {
        device_type: 'esp32',
        hardware_id: '00:11:22:33:44:55',
        firmware_version: '1.0.0',
        capabilities: ['motor.differential:v1.0']
      };
    } else if (schemaPath.includes('heartbeat')) {
      testData = {
        uptime_seconds: 3600,
        status: 'active',
        health: {
          cpu_percent: 25,
          memory_percent: 50,
          temperature_celsius: 35
        }
      };
    }
    
    const result = validator.validate(schemaId, testData);
    
    if (result.valid) {
      console.log(`✅ ${schemaId}`);
    } else {
      console.log(`❌ ${schemaId}`);
      console.log(`   Errors: ${JSON.stringify(result.errors, null, 2)}`);
      hasErrors = true;
    }
  }
  
  if (hasErrors) {
    console.log('\n❌ Schema validation failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All schemas are valid!');
  }
}

// Run validation
validateAllSchemas();