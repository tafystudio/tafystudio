# ESP32 Motor Control Wiring Guide

This document describes the wiring requirements for connecting differential drive motors to the Tafy ESP32 node.

## Hardware Requirements

### Motor Driver

- **Recommended**: L298N Dual H-Bridge Motor Driver or similar
- **Alternative**: TB6612FNG (more efficient, smaller)
- **Requirements**:
  - Dual channel (for differential drive)
  - PWM speed control
  - Direction control
  - Current rating suitable for your motors

### Motors

- **Type**: DC motors with gearbox
- **Voltage**: 6-12V typical
- **Current**: Check motor driver compatibility

### Power Supply

- **Motor Power**: Separate power supply recommended (6-12V depending on motors)
- **Logic Power**: 5V from motor driver or separate regulator
- **ESP32 Power**: 3.3V (usually provided via USB or onboard regulator)

## Pin Connections

### ESP32 to Motor Driver

| ESP32 Pin | Motor Driver Pin | Function |
|-----------|------------------|----------|
| GPIO 25   | Left Motor PWM/ENA | Left motor speed control |
| GPIO 26   | Left Motor IN1 | Left motor direction 1 |
| GPIO 27   | Left Motor IN2 | Left motor direction 2 |
| GPIO 32   | Right Motor PWM/ENB | Right motor speed control |
| GPIO 33   | Right Motor IN3 | Right motor direction 1 |
| GPIO 34   | Right Motor IN4 | Right motor direction 2 |
| GND       | GND | Common ground |

### Motor Driver to Motors

| Motor Driver | Connection |
|--------------|------------|
| Left Motor OUT1/OUT2 | Left motor terminals |
| Right Motor OUT3/OUT4 | Right motor terminals |
| Motor Power + | Battery/Power supply positive (6-12V) |
| Motor Power - | Battery/Power supply negative |

### Optional Encoder Connections

If using motors with encoders:

| ESP32 Pin | Encoder Signal | Function |
|-----------|----------------|----------|
| GPIO 35   | Left Encoder A | Left motor encoder channel A |
| GPIO 36   | Left Encoder B | Left motor encoder channel B |
| GPIO 39   | Right Encoder A | Right motor encoder channel A |
| GPIO 4    | Right Encoder B | Right motor encoder channel B |

Note: Set `ENCODERS_ENABLED` to `true` in `config.h` if using encoders.

## Wiring Diagram

```text
                    ESP32                           L298N Motor Driver
                 ┌─────────┐                       ┌─────────────────┐
                 │         │                       │                 │
                 │ GPIO 25 ├──────────────────────►│ ENA (PWM)       │
                 │ GPIO 26 ├──────────────────────►│ IN1             │
                 │ GPIO 27 ├──────────────────────►│ IN2             │
                 │         │                       │                 │──► Left Motor
                 │ GPIO 32 ├──────────────────────►│ ENB (PWM)       │
                 │ GPIO 33 ├──────────────────────►│ IN3             │
                 │ GPIO 34 ├──────────────────────►│ IN4             │
                 │         │                       │                 │──► Right Motor
                 │   GND   ├──────────────────────►│ GND             │
                 └─────────┘                       │                 │
                                                   │ +12V ◄──────────┤ Battery +
                                                   │ GND  ◄──────────┤ Battery -
                                                   └─────────────────┘
```

## Safety Considerations

1. **Power Isolation**: Always use separate power supplies for motors and logic
2. **Common Ground**: Connect all grounds together (ESP32, motor driver, power supplies)
3. **Flyback Diodes**: Ensure motor driver has flyback diodes (most do)
4. **Current Limiting**: Use appropriate fuses or current limiting
5. **Emergency Stop**: The firmware includes software emergency stop functionality

## Configuration

### Motor Parameters

Edit these values in the firmware to match your robot:

```cpp
// In motor_controller.cpp constructor:
wheelBase(0.2),        // Distance between wheels in meters
wheelRadius(0.035),    // Wheel radius in meters
maxLinearVel(1.0),     // Maximum linear velocity in m/s
maxAngularVel(2.0),    // Maximum angular velocity in rad/s
rampRate(200.0)        // Acceleration rate in percent/second
```

### Testing

1. **Without Motors**: Test direction signals with LEDs first
2. **With Motors Elevated**: Test with wheels off the ground
3. **Low Speed Test**: Start with reduced max speeds
4. **Emergency Stop**: Test emergency stop functionality

## Troubleshooting

### Motors Don't Move

- Check power connections and voltage
- Verify PWM frequency compatibility
- Test with serial commands: `motor 50 50`

### Motors Move Incorrectly

- Swap motor wires if direction is reversed
- Adjust `MOTOR_DEADZONE` if motors don't start smoothly
- Check PWM resolution and frequency settings

### Erratic Behavior

- Add capacitors across motor terminals (0.1µF ceramic)
- Ensure solid ground connections
- Check for adequate power supply current

## Serial Commands

Test motor control via serial monitor (115200 baud):

- `motor <left> <right>` - Set motor speeds (-100 to 100)
- `motor 50 50` - Move forward at 50% speed
- `motor -50 50` - Rotate left
- `motor 0 0` - Stop

## Next Steps

Once motors are working:

1. Calibrate wheel parameters (measure actual wheelBase and wheelRadius)
2. Test differential drive commands via NATS
3. Implement obstacle avoidance with ToF sensor
4. Create teleop flow in Node-RED
