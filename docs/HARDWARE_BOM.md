# Tafy RDOS Hardware Bill of Materials

This document lists all the hardware components needed to build robots
compatible with Tafy RDOS. We provide configurations for different robot types
and budgets.

## Table of Contents

1. [Basic Differential Drive Robot](#basic-differential-drive-robot)
2. [Advanced Autonomous Robot](#advanced-autonomous-robot)
3. [Minimal Test Setup](#minimal-test-setup)
4. [Component Details](#component-details)
5. [Suppliers and Alternatives](#suppliers-and-alternatives)
6. [Cost Estimates](#cost-estimates)

## Basic Differential Drive Robot

This configuration provides a simple two-wheeled robot with obstacle avoidance.

### Required Components

| Component             | Quantity | Part Number/Spec        | Purpose                 | Est. Cost |
| --------------------- | -------- | ----------------------- | ----------------------- | --------- |
| **Compute Module**    | 1        | Raspberry Pi 4B (2GB+)  | Main computer           | $45-75    |
| **Microcontroller**   | 1        | ESP32-WROOM-32          | Motor control & sensors | $5-10     |
| **Motors**            | 2        | DC Gearmotor 6V, 200RPM | Locomotion              | $20-30    |
| **Motor Driver**      | 1        | L298N or DRV8833        | Motor control           | $5-10     |
| **Wheels**            | 2        | 65mm diameter           | Movement                | $10-15    |
| **Caster Wheel**      | 1        | Ball caster             | Balance                 | $3-5      |
| **Ultrasonic Sensor** | 1        | HC-SR04                 | Obstacle detection      | $3-5      |
| **Power Bank**        | 1        | 10,000mAh USB           | Pi power                | $15-25    |
| **Battery Pack**      | 1        | 4xAA holder             | Motor power             | $5-8      |
| **Jumper Wires**      | 1 set    | M-F, M-M, F-F           | Connections             | $5-10     |
| **Chassis**           | 1        | Acrylic/3D printed      | Structure               | $10-30    |

#### Total: ~$126-213

### Optional Upgrades

| Component  | Quantity | Part Number/Spec | Purpose               | Est. Cost |
| ---------- | -------- | ---------------- | --------------------- | --------- |
| USB Camera | 1        | Logitech C270    | Vision/color tracking | $25-35    |
| IMU        | 1        | MPU6050          | Orientation sensing   | $3-5      |
| Encoders   | 2        | Optical encoder  | Speed feedback        | $10-15    |
| RGB LED    | 1        | WS2812B strip    | Status indication     | $5-10     |

## Advanced Autonomous Robot

For advanced features like SLAM, computer vision, and multi-sensor fusion.

### Core Components

| Component            | Quantity | Part Number/Spec        | Purpose             | Est. Cost |
| -------------------- | -------- | ----------------------- | ------------------- | --------- |
| **Compute Module**   | 1        | NVIDIA Jetson Nano/Orin | AI processing       | $99-499   |
| **Microcontroller**  | 2        | ESP32 + Teensy 4.1      | Real-time control   | $25-40    |
| **Motors**           | 2        | DC Motor w/ encoder     | Precise control     | $40-60    |
| **Motor Driver**     | 1        | RoboClaw 2x7A           | Advanced control    | $60-80    |
| **LiDAR**            | 1        | RPLiDAR A1              | 360° scanning       | $99-150   |
| **Camera**           | 1        | Intel RealSense D435    | Depth sensing       | $180-250  |
| **ToF Sensors**      | 4        | VL53L0X                 | Close-range sensing | $40-60    |
| **Battery**          | 1        | 3S LiPo 5000mAh         | Main power          | $40-60    |
| **Power Management** | 1        | Buck converters + BMS   | Power distribution  | $20-30    |
| **Chassis**          | 1        | Aluminum frame          | Robust structure    | $50-100   |

#### Total: ~$653-1,329

## Minimal Test Setup

For software development and testing without a physical robot.

| Component                 | Quantity | Part Number/Spec | Purpose        | Est. Cost |
| ------------------------- | -------- | ---------------- | -------------- | --------- |
| **Raspberry Pi Zero 2 W** | 1        | With headers     | Compute        | $15       |
| **ESP32 DevKit**          | 1        | Any variant      | HAL testing    | $5        |
| **Breadboard**            | 1        | 830 points       | Prototyping    | $5        |
| **LEDs**                  | 5        | Various colors   | Output testing | $2        |
| **Resistors**             | 10       | 220Ω, 10kΩ       | LED/pullup     | $2        |
| **Push Buttons**          | 3        | Tactile switches | Input testing  | $2        |
| **Jumper Wires**          | 1 set    | Assorted         | Connections    | $5        |
| **USB Cables**            | 2        | Micro USB        | Power/data     | $5        |

### Total: ~$41

## Component Details

### Compute Modules

#### Raspberry Pi 4B

- **Why**: Best balance of performance, cost, and community support
- **Specs**: Quad-core ARM, 2-8GB RAM, WiFi, Ethernet
- **OS**: Raspberry Pi OS or Ubuntu Server
- **Notes**: Use heatsink for sustained loads

#### NVIDIA Jetson

- **Why**: GPU acceleration for AI/vision tasks
- **Options**:
  - Nano: Entry-level, good for learning
  - Xavier NX: Better performance
  - Orin: Latest, best performance
- **Notes**: Higher power consumption, needs cooling

### Microcontrollers

#### ESP32

- **Why**: WiFi built-in, dual-core, affordable
- **Best for**: Motor control, sensor reading, WiFi communication
- **Variants**:
  - WROOM-32: Basic module
  - CAM: Includes camera
  - S3: More GPIO, USB

#### Alternatives

- **Arduino Mega**: More I/O, no WiFi
- **Teensy 4.x**: Very fast, good for real-time
- **STM32**: Professional grade, complex

### Motors

#### DC Gearmotors

- **Voltage**: 6V typical (3-12V range)
- **RPM**: 100-300 for robots
- **Torque**: 2-5 kg·cm minimum
- **Encoders**: Recommended for precise control

#### Motor Drivers

- **L298N**: Classic, handles 2A per motor
- **DRV8833**: Smaller, more efficient
- **RoboClaw**: Advanced features, position control

### Sensors

#### Distance Sensing

- **HC-SR04**: Ultrasonic, 2-400cm range
- **VL53L0X**: ToF laser, 0-200cm, more accurate
- **Sharp IR**: Analog output, 10-80cm

#### Vision

- **USB Cameras**: Any UVC-compatible
- **Pi Camera**: Direct CSI connection
- **Intel RealSense**: Depth + RGB

### Power

#### Batteries

- **AA/18650**: Easy to find, safe
- **LiPo**: High capacity, needs care
- **Power Banks**: Convenient for Pi

#### Power Distribution

- **5V for Pi**: Buck converter or power bank
- **Motor voltage**: Separate battery recommended
- **Logic level**: 3.3V for ESP32, Pi GPIO

## Suppliers and Alternatives

### Online Retailers

1. **Adafruit**: Quality parts, good docs
2. **SparkFun**: Similar to Adafruit
3. **Amazon**: Fast shipping, varies quality
4. **AliExpress**: Cheapest, slow shipping
5. **Pololu**: Robotics specialty

### Local Options

- Electronics stores (Fry's, Micro Center)
- Hobby shops (RC parts)
- Makerspaces often sell basics

### Budget Alternatives

| Original       | Budget Alternative | Notes            |
| -------------- | ------------------ | ---------------- |
| Raspberry Pi 4 | Orange Pi, Rock Pi | Check OS support |
| ESP32 DevKit   | NodeMCU ESP8266    | Less capable     |
| L298N          | 2x L9110S          | Lower current    |
| HC-SR04        | HC-SR04P           | 3.3V compatible  |
| LiPo battery   | 6xAA pack          | Heavier, safer   |

## Cost Estimates

### By Budget

#### Student/Hobby ($50-100)

- Raspberry Pi Zero 2 W
- ESP32
- 2x cheap motors
- L298N driver
- HC-SR04
- Cardboard chassis
- USB power bank

#### Educator/Maker ($100-250)

- Raspberry Pi 4
- Quality motors with encoders
- Multiple sensors
- 3D printed chassis
- Proper battery system

#### Research/Commercial ($250+)

- Jetson or powerful compute
- Industrial motors
- Advanced sensors
- Aluminum chassis
- Professional power system

## Assembly Notes

### Tools Required

- Screwdriver set
- Soldering iron (optional)
- Hot glue gun
- Wire strippers
- Multimeter (recommended)

### Safety

- Always disconnect power when wiring
- Use proper battery handling for LiPo
- Add fuses for motor power
- Include emergency stop button

## Next Steps

1. Choose your budget and use case
2. Order components (allow 2-4 weeks for shipping)
3. See [WIRING_DIAGRAMS.md](WIRING_DIAGRAMS.md) for connections
4. Follow [ASSEMBLY_GUIDE.md](ASSEMBLY_GUIDE.md) for build instructions
5. Use [QUICKSTART.md](../packages/node-red-contrib-tafy/docs/QUICKSTART.md) for
   software setup

## Community Builds

Share your build at:

- Discord: [tafy.studio/discord](https://tafy.studio/discord)
- Forum: [forum.tafy.studio](https://forum.tafy.studio)
- Gallery: Tag #TafyRobot on social media

## FAQ

**Q: Can I use Arduino instead of ESP32?** A: Yes, but you'll need separate WiFi
module. ESP32 is recommended.

**Q: What about stepper motors?** A: Supported but need different drivers
(A4988, DRV8825).

**Q: Minimum budget?** A: ~$41 for testing, ~$100 for moving robot.

**Q: 3D printer required?** A: No, use cardboard, wood, or buy chassis.

**Q: Power everything from one battery?** A: Possible but not recommended.
Separate motor power prevents brownouts.
