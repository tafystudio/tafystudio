# ESP32 Sensor Wiring Guide

This document describes the wiring and configuration for sensors supported by the Tafy ESP32 firmware.

## VL53L0X Time-of-Flight (ToF) Sensor

### Overview

The VL53L0X is a laser-ranging sensor that uses time-of-flight technology to measure distances from 30mm to 2000mm with millimeter resolution.

### Key Features

- **Range**: 30mm - 2000mm
- **Accuracy**: ±3% at best, ±5% typical
- **Field of View**: 25 degrees
- **Update Rate**: Up to 50Hz
- **Interface**: I2C (400kHz)

### Pin Connections

| VL53L0X Pin | ESP32 Pin | Function | Notes |
|-------------|-----------|----------|-------|
| VIN | 3.3V | Power | 2.6V - 3.5V |
| GND | GND | Ground | |
| SCL | GPIO 22 | I2C Clock | Pull-up required |
| SDA | GPIO 21 | I2C Data | Pull-up required |
| XSHUT | GPIO 23 | Shutdown | Optional, for multi-sensor |
| GPIO1 | - | Interrupt | Not used |

### Wiring Diagram

```text
    ESP32                        VL53L0X
 ┌─────────┐                  ┌─────────┐
 │         │                  │         │
 │ 3.3V    ├─────────────────►│ VIN     │
 │ GND     ├─────────────────►│ GND     │
 │ GPIO 22 ├─────────────────►│ SCL     │
 │ GPIO 21 ├─────────────────►│ SDA     │
 │ GPIO 23 ├─────────────────►│ XSHUT   │
 └─────────┘                  └─────────┘
             4.7kΩ ┃ ┃ 4.7kΩ
             ──────┃ ┃──────
                  3.3V
```

### I2C Pull-up Resistors

- Most VL53L0X modules include built-in pull-ups
- If not present, add 4.7kΩ resistors from SDA and SCL to 3.3V
- For long cables or multiple devices, use 2.2kΩ

## Firmware Configuration

### Default Settings

The sensor is configured with these defaults in `config.h`:

```cpp
// Hardware pins - Time of Flight sensor
#define TOF_SDA 21
#define TOF_SCL 22
#define TOF_XSHUT 23

// Sensor configuration
#define SENSOR_RANGE_MAX_MM 2000    // 2 meters
#define SENSOR_RANGE_MIN_MM 30      // 30mm minimum
#define SENSOR_CHANGE_THRESHOLD 50  // Report if change > 50mm

// Safety limits
#define EMERGENCY_STOP_DISTANCE_MM 100  // Stop if object closer than 100mm
```

### Measurement Modes

The sensor supports multiple measurement modes via NATS commands:

1. **Default Mode** (30ms, balanced)
   - Good for general robotics
   - 30Hz update rate
   - ±5% accuracy

2. **High Speed Mode** (20ms)
   - For fast obstacle detection
   - 50Hz update rate
   - Reduced accuracy

3. **High Accuracy Mode** (200ms)
   - For precise measurements
   - 5Hz update rate
   - ±3% accuracy

4. **Long Range Mode** (33ms)
   - Extended range measurements
   - Better in bright conditions

### Sensor Features

#### Median Filtering

- 5-sample median filter
- Removes noise spikes
- Smooths measurements

#### Calibration

- Linear offset calibration
- Scale factor adjustment
- Per-sensor calibration storage

#### Quality Metrics

- Signal strength monitoring
- Ambient light detection
- Confidence percentage (0-100%)

#### Emergency Stop

- Automatic motor stop when obstacle detected
- Configurable threshold (default 100mm)
- Override via `clear estop` command

## Serial Commands

Test and configure the sensor via serial monitor (115200 baud):

- `sensor` - Display current sensor status
- `calibrate <actual_mm>` - Calibrate using known distance
- `clear estop` - Clear emergency stop condition

Example output:

```text
> sensor
ToF Sensor Status:
  Range: 245 mm (raw)
  Filtered: 243 mm
  Quality: 100%
  Total readings: 1523
  Valid readings: 1520
  Timeouts: 3
```

## NATS Commands

Configure sensor via HAL commands:

### Change Measurement Mode

```json
{
  "hal_major": 1,
  "hal_minor": 0,
  "schema": "tafylabs/hal/sensor/range-tof/1.0",
  "device_id": "esp32-xxxx",
  "payload": {
    "mode": "high_accuracy"
  }
}
```

### Calibrate Sensor

```json
{
  "hal_major": 1,
  "hal_minor": 0,
  "schema": "tafylabs/hal/sensor/range-tof/1.0",
  "device_id": "esp32-xxxx",
  "payload": {
    "calibrate": {
      "actual_distance_mm": 500
    }
  }
}
```

### Set Manual Calibration

```json
{
  "hal_major": 1,
  "hal_minor": 0,
  "schema": "tafylabs/hal/sensor/range-tof/1.0",
  "device_id": "esp32-xxxx",
  "payload": {
    "calibration": {
      "offset": -5,
      "scale": 1.02
    }
  }
}
```

## Telemetry Output

The sensor publishes telemetry data at 10Hz:

```json
{
  "hal_major": 1,
  "hal_minor": 0,
  "schema": "tafylabs/hal/sensor/range-tof/1.0",
  "device_id": "esp32-xxxx",
  "ts": 123456789,
  "payload": {
    "sensor_id": "tof-front",
    "range_meters": 0.243,
    "raw_mm": 245,
    "filtered_mm": 243,
    "quality": 100,
    "status": "ok",
    "statistics": {
      "total_readings": 1523,
      "valid_readings": 1520,
      "timeouts": 3,
      "success_rate": 0.998
    },
    "calibration": {
      "offset": 0,
      "scale": 1.0
    }
  }
}
```

## Multiple Sensors

To use multiple VL53L0X sensors:

1. Connect each sensor's XSHUT to a different GPIO
2. Modify firmware to control XSHUT pins
3. Initialize sensors with different I2C addresses
4. Each sensor needs unique `sensor_id`

## Troubleshooting

### Sensor Not Detected

1. **Check I2C connections**: SDA to GPIO 21, SCL to GPIO 22
2. **Verify power**: VL53L0X needs 2.6-3.5V
3. **Test I2C bus**: Use I2C scanner sketch
4. **Check pull-ups**: Add external 4.7kΩ if needed

### Erratic Readings

1. **Cover glass**: Ensure protective glass is clean
2. **Target surface**: Dark/absorptive surfaces reduce range
3. **Ambient light**: Strong sunlight affects readings
4. **Power supply**: Use stable 3.3V supply

### Limited Range

1. **Target reflectivity**: White targets work best
2. **Angle of incidence**: Perpendicular is optimal
3. **Field of view**: 25° cone, ensure clear path
4. **Measurement mode**: Try long range mode

## Alternative Sensors

### HC-SR04 Ultrasonic

For budget builds, ultrasonic sensors can be used:

| HC-SR04 Pin | ESP32 Pin | Function |
|-------------|-----------|----------|
| VCC | 5V | Power |
| GND | GND | Ground |
| Trig | GPIO 25 | Trigger |
| Echo | GPIO 26 | Echo (via divider) |

**Note**: Echo pin needs voltage divider (5V → 3.3V)

### VL53L1X (Upgrade)

For longer range (up to 4m):

- Same pinout as VL53L0X
- Different initialization code
- Better ambient light immunity

## Safety Considerations

1. **Eye Safety**: Class 1 laser product, safe under all conditions
2. **Cover Glass**: Use appropriate cover glass for protection
3. **Temperature**: Operating range -20°C to 70°C
4. **ESD Protection**: Sensor is ESD sensitive, handle carefully

## Next Steps

1. Test sensor with different surfaces and distances
2. Calibrate for your specific mounting
3. Create obstacle avoidance behaviors in Node-RED
4. Combine with motor control for autonomous navigation
5. Add multiple sensors for 360° coverage
