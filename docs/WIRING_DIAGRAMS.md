# Tafy RDOS Wiring Diagrams

This document provides wiring diagrams for connecting hardware components to
build Tafy RDOS compatible robots.

> **SAFETY FIRST**: Always disconnect power before making connections.
> Double-check polarity. Use appropriate fuses.

## Table of Contents

1. [Basic Motor Control Setup](#basic-motor-control-setup)
2. [Sensor Connections](#sensor-connections)
3. [Complete Robot Wiring](#complete-robot-wiring)
4. [Power Distribution](#power-distribution)
5. [Common Issues](#common-issues)

## Basic Motor Control Setup

### ESP32 to L298N Motor Driver

```text
ESP32 DevKit                L298N Motor Driver
┌─────────────┐            ┌──────────────────┐
│         GPIO12├──────────┤IN1  (Motor A)    │
│         GPIO14├──────────┤IN2               │
│         GPIO27├──────────┤IN3  (Motor B)    │
│         GPIO26├──────────┤IN4               │
│         GPIO13├──────────┤ENA  (PWM Speed A)│
│         GPIO25├──────────┤ENB  (PWM Speed B)│
│           GND├───────────┤GND               │
└─────────────┘            │                  │
                           │   OUT1 ──── Motor A +
                           │   OUT2 ──── Motor A -
                           │   OUT3 ──── Motor B +
                           │   OUT4 ──── Motor B -
                           │                  │
                           │   +12V ← Battery Pack
                           │   GND  ← Battery GND
                           │   +5V  → ESP32 VIN (optional)
                           └──────────────────┘
```

### Pin Definitions

```c
// In ESP32 firmware
#define MOTOR_A_IN1  12
#define MOTOR_A_IN2  14
#define MOTOR_B_IN1  27
#define MOTOR_B_IN2  26
#define MOTOR_A_PWM  13
#define MOTOR_B_PWM  25
```

### Alternative: DRV8833 (Lower Power)

```text
ESP32                    DRV8833
┌─────────────┐         ┌────────────┐
│         GPIO12├────────┤AIN1        │
│         GPIO14├────────┤AIN2        │
│         GPIO27├────────┤BIN1        │
│         GPIO26├────────┤BIN2        │
│          3.3V├─────────┤VCC         │
│           GND├─────────┤GND         │
└─────────────┘         │            │
                        │ AOUT1/2 → Motor A
                        │ BOUT1/2 → Motor B
                        │            │
                        │ VMOT ← Battery (2.7-10.8V)
                        └────────────┘
```

## Sensor Connections

### HC-SR04 Ultrasonic Sensor

```text
ESP32                    HC-SR04
┌─────────────┐         ┌──────────┐
│          5V*├─────────┤VCC       │
│         GPIO5├─────────┤Trig      │
│         GPIO18├─────────┤Echo      │
│           GND├─────────┤GND       │
└─────────────┘         └──────────┘

* Note: Use voltage divider for Echo pin (5V → 3.3V):
  Echo ──[2.2kΩ]──┬──[3.3kΩ]── GND
                   │
                   └→ GPIO18
```

### VL53L0X ToF Sensor (I2C)

```text
ESP32                    VL53L0X
┌─────────────┐         ┌──────────┐
│          3.3V├─────────┤VIN       │
│         GPIO21├─────────┤SDA       │
│         GPIO22├─────────┤SCL       │
│           GND├─────────┤GND       │
└─────────────┘         └──────────┘

Multiple sensors: Use XSHUT pins with different addresses
```

### MPU6050 IMU (I2C)

```text
ESP32                    MPU6050
┌─────────────┐         ┌──────────┐
│          3.3V├─────────┤VCC       │
│         GPIO21├─────────┤SDA       │
│         GPIO22├─────────┤SCL       │
│           GND├─────────┤GND       │
└─────────────┘         │          │
                        │ Optional:│
                        │ INT → GPIO│
                        └──────────┘

I2C Pull-ups: 4.7kΩ on SDA/SCL to 3.3V
```

## Complete Robot Wiring

### Basic Differential Drive Robot

```text
                           Raspberry Pi 4
                         ┌───────────────┐
                         │               │ USB → Camera
                         │               │ USB → Power Bank
                         │               │
                         │               │ GPIO → Status LED
                         │               │
                         └───────┬───────┘
                                 │ USB
                                 ↓
                           ESP32 DevKit
┌─────────┐              ┌──────────────┐              ┌─────────┐
│ Battery ├──────────────┤              ├──────────────┤ L298N   │
│  Pack   │              │              │              │ Motor   │
│  (6V)   │              │   GPIO Pins  │              │ Driver  │
└─────────┘              │              │              └────┬────┘
                         │              │                   │
┌─────────┐              │   I2C Bus    │              ┌────┴────┐
│MPU6050  ├──────────────┤              │              │ Motors  │
└─────────┘              │              │              │ (2x)    │
                         │              │              └─────────┘
┌─────────┐              │              │
│VL53L0X  ├──────────────┤              │
│(Front)  │              │              │
└─────────┘              │              │
                         │              │
┌─────────┐              │              │
│HC-SR04  ├──────────────┤              │
│(Side)   │              └──────────────┘
└─────────┘
```

### Pin Assignment Table

| Function        | ESP32 Pin | Connected To     | Notes     |
| --------------- | --------- | ---------------- | --------- |
| Motor A IN1     | GPIO12    | L298N IN1        | Direction |
| Motor A IN2     | GPIO14    | L298N IN2        | Direction |
| Motor A PWM     | GPIO13    | L298N ENA        | Speed     |
| Motor B IN1     | GPIO27    | L298N IN3        | Direction |
| Motor B IN2     | GPIO26    | L298N IN4        | Direction |
| Motor B PWM     | GPIO25    | L298N ENB        | Speed     |
| I2C SDA         | GPIO21    | MPU6050, VL53L0X | Data      |
| I2C SCL         | GPIO22    | MPU6050, VL53L0X | Clock     |
| Ultrasonic Trig | GPIO5     | HC-SR04          | Output    |
| Ultrasonic Echo | GPIO18    | HC-SR04          | Input     |
| Status LED      | GPIO2     | Built-in LED     | Output    |
| Emergency Stop  | GPIO0     | Button to GND    | Input     |

## Power Distribution

### Dual Power System (Recommended)

```text
┌─────────────┐                    ┌─────────────┐
│ USB Power   │                    │ Battery Pack│
│   Bank      │                    │  (4xAA=6V)  │
│  (5V, 2A+)  │                    │     or      │
└──────┬──────┘                    │ 2S LiPo 7.4V│
       │                           └──────┬──────┘
       │ USB-C                            │
       ↓                                  │
┌─────────────┐                           │
│ Raspberry   │                           │
│    Pi 4     │                           │
└──────┬──────┘                           │
       │ USB                              │
       ↓                                  ↓
┌─────────────┐                    ┌─────────────┐
│   ESP32     │                    │   L298N     │
│  (Logic)    │                    │ Motor Driver│
└─────────────┘                    │             │
                                   │ Motors get  │
                                   │ full battery│
                                   │   voltage   │
                                   └─────────────┘
```

### Single Battery with Buck Converter

```text
         ┌─────────────┐
         │ 3S LiPo     │
         │ (11.1V nom) │
         └──────┬──────┘
                │
        ┌───────┴───────┐
        │               │
        ↓               ↓
┌─────────────┐  ┌─────────────┐
│ Buck Conv.  │  │   L298N     │
│ 11V → 5V    │  │ (Direct)    │
└──────┬──────┘  └─────────────┘
       │
   ┌───┴────┐
   ↓        ↓
┌──────┐ ┌──────┐
│ Pi 4 │ │ESP32 │
└──────┘ └──────┘
```

### Power Budget

| Component      | Voltage | Current (Typical) | Current (Max) |
| -------------- | ------- | ----------------- | ------------- |
| Raspberry Pi 4 | 5V      | 600mA             | 3A            |
| ESP32          | 3.3V/5V | 80mA              | 250mA         |
| Motor (each)   | 6V      | 200mA             | 1A            |
| HC-SR04        | 5V      | 15mA              | 20mA          |
| VL53L0X        | 3.3V    | 20mA              | 40mA          |
| MPU6050        | 3.3V    | 4mA               | 10mA          |

**Total**: ~1.2A @ 5V (logic) + 2A @ 6V (motors)

## Common Issues

### 1. Motors Don't Move

- Check battery voltage (should be >5V for 6V motors)
- Verify motor driver has power LED on
- Test with multimeter across motor terminals
- Check enable pins (ENA/ENB) are connected

### 2. ESP32 Keeps Resetting

- Insufficient power - use separate power for motors
- Add capacitors: 100µF across motor power
- Check for shorts in wiring

### 3. Sensors Not Detected (I2C)

- Add pull-up resistors (4.7kΩ) on SDA/SCL
- Check with I2C scanner sketch
- Verify 3.3V power to sensors
- Common addresses:
  - MPU6050: 0x68 or 0x69
  - VL53L0X: 0x29 (default)

### 4. Ultrasonic Reading 0 or Max

- Check voltage divider on Echo pin
- Ensure clear path in front of sensor
- Minimum range is ~2cm

### 5. WiFi Connection Issues

- Keep ESP32 antenna away from motors
- Add ferrite beads on motor wires
- Use shielded cable for long runs

## Best Practices

### Wire Management

- Use different colors:
  - Red: Positive power
  - Black: Ground
  - Yellow: PWM signals
  - Green: I2C SDA
  - Blue: I2C SCL
  - Orange: Digital I/O
- Label connections
- Use heat shrink tubing
- Keep motor wires twisted

### EMI Reduction

- Separate motor and logic power
- Add 0.1µF ceramic capacitors across motors
- Keep high-current wires away from sensors
- Use ferrite beads on motor leads

### Safety

- Include emergency stop button
- Add fuses:
  - 3A for Raspberry Pi
  - 5A for motor circuit
- Use polarized connectors
- Insulate all connections

## Testing Procedure

1. **Power Off Test**
   - Check all connections with multimeter
   - Verify no shorts between power and ground

2. **Logic Power Test**
   - Power only Raspberry Pi and ESP32
   - Check voltage levels
   - Test I2C communication

3. **Sensor Test**
   - Run I2C scanner
   - Test each sensor individually

4. **Motor Test**
   - Start with low PWM (30%)
   - Test one motor at a time
   - Check direction control

5. **Integration Test**
   - Run complete system
   - Monitor power consumption
   - Check for overheating

## Next Steps

1. Complete wiring following these diagrams
2. Upload ESP32 firmware from `/firmware/esp32/`
3. Configure HAL for your specific pinout
4. Follow software setup in
   [QUICKSTART.md](../packages/node-red-contrib-tafy/docs/QUICKSTART.md)
5. Test with example flows

## Need Help?

- Forum: [forum.tafy.studio](https://forum.tafy.studio)
- Discord: [tafy.studio/discord](https://tafy.studio/discord)
- Check voltage with multimeter before asking
- Provide photos of your wiring for help
