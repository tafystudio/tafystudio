# Tafy RDOS Robot Assembly Guide

This guide walks you through assembling a basic differential drive robot for
Tafy RDOS.

## Before You Start

### Required Documents

- [HARDWARE_BOM.md](HARDWARE_BOM.md) - Parts list
- [WIRING_DIAGRAMS.md](WIRING_DIAGRAMS.md) - Connection diagrams
- [QUICKSTART.md](../packages/node-red-contrib-tafy/docs/QUICKSTART.md) -
  Software setup

### Tools Needed

- Phillips screwdriver
- Wire strippers
- Soldering iron (optional)
- Hot glue gun
- Multimeter
- Computer for programming

### Time Required

- Mechanical assembly: 1-2 hours
- Wiring: 1-2 hours
- Software setup: 30 minutes
- Testing: 30 minutes
- **Total: 3-5 hours**

## Step 1: Chassis Assembly (30 minutes)

### Option A: Acrylic Kit

1. Remove protective film from acrylic pieces
2. Attach motors to side brackets using included screws
3. Mount wheels on motor shafts
4. Assemble frame using spacers and screws
5. Attach caster wheel at front

### Option B: 3D Printed

1. Print chassis files from `/hardware/chassis/`
2. Clean up prints, remove supports
3. Press-fit motors into holders
4. Attach wheels
5. Screw on caster wheel

### Option C: Cardboard Prototype

1. Cut base from sturdy cardboard (20x15cm)
2. Hot glue motors to sides
3. Add wheels
4. Tape ping pong ball as caster

### Tip: Motor Placement

- Motors should be parallel
- Leave 10-15cm between wheels
- Center of gravity toward wheels

## Step 2: Mount Electronics (30 minutes)

### Raspberry Pi Mounting

1. Use standoffs to elevate Pi 5mm above chassis
2. Position for easy access to ports
3. Leave room for cooling
4. Secure with M2.5 screws

### ESP32 Mounting

1. Use breadboard for prototyping OR
2. Solder to perfboard for permanent install
3. Position near motor driver
4. Keep USB port accessible

### Motor Driver

1. Mount L298N with heat sink facing up
2. Position close to motors (short wires)
3. Use standoffs or double-sided tape
4. Ensure good airflow

### Battery Placement

1. Motor battery pack: Low and centered
2. Pi power bank: Above motor battery
3. Secure with velcro straps
4. Balance weight distribution

## Step 3: Wiring - Power (45 minutes)

> ⚠️ **ALWAYS disconnect batteries when wiring!**

### Motor Power Circuit

1. Battery pack positive → L298N +12V
2. Battery pack negative → L298N GND
3. Add switch in positive line
4. Optional: Add 5A fuse

### Logic Power

1. USB power bank → Raspberry Pi USB-C
2. Raspberry Pi USB → ESP32 micro USB
3. Alternative: L298N +5V → ESP32 VIN (if jumper enabled)

### Ground Connections

1. Connect all grounds together:
   - L298N GND
   - ESP32 GND
   - Battery pack negative
   - Raspberry Pi GND (via GPIO)

## Step 4: Wiring - Motors (30 minutes)

### Motor A (Left)

1. Motor red wire → L298N OUT1
2. Motor black wire → L298N OUT2
3. Note: Swap if direction reversed

### Motor B (Right)

1. Motor red wire → L298N OUT3
2. Motor black wire → L298N OUT4
3. Note: Swap if direction reversed

### Control Signals

Follow pinout from [WIRING_DIAGRAMS.md](WIRING_DIAGRAMS.md):

```text
ESP32 → L298N
GPIO12 → IN1
GPIO14 → IN2
GPIO27 → IN3
GPIO26 → IN4
GPIO13 → ENA
GPIO25 → ENB
GND → GND
```

### Cable Management

1. Twist motor wires together
2. Route away from sensors
3. Use zip ties or tape
4. Keep wires short as possible

## Step 5: Sensor Installation (30 minutes)

### Ultrasonic Sensor (HC-SR04)

1. Mount at front, 10-20cm above ground
2. Angle slightly downward (5-10°)
3. Wire according to diagram
4. Add voltage divider for Echo pin!

### Optional: Side Sensors

1. Mount at 45° angles
2. Height same as front sensor
3. Check detection overlap

### Optional: IMU

1. Mount flat, arrow pointing forward
2. Away from motors (magnetic interference)
3. Secure firmly (no vibration)

## Step 6: Pre-Power Checklist (15 minutes)

### Visual Inspection

- [ ] All connections secure
- [ ] No exposed wires
- [ ] Correct polarity on all connections
- [ ] Motors can spin freely
- [ ] Batteries secured

### Multimeter Tests

- [ ] No continuity between power and ground
- [ ] Battery voltage correct (6V, 5V)
- [ ] 3.3V present at sensor power
- [ ] Motor terminals show continuity

## Step 7: First Power On (15 minutes)

1. **Connect logic power only** (Pi + ESP32)
   - Check LEDs light up
   - No unusual heat
   - WiFi accessible

2. **Test sensors**

   ```bash
   i2cdetect -y 1  # On Pi
   ```

3. **Connect motor power**
   - L298N power LED on
   - No smoke or heat
   - Motors don't run yet

4. **Emergency stop ready!**

## Step 8: Software Setup (30 minutes)

1. **Flash ESP32 firmware**

   ```bash
   cd firmware/esp32
   pio run -t upload
   ```

2. **Access Node-RED**
   - Browse to: `http://raspberrypi.local:1880`
   - Or use IP address

3. **Import test flow**
   - See [QUICKSTART.md](../packages/node-red-contrib-tafy/docs/QUICKSTART.md)

4. **Test motors**
   - Start with 30% speed
   - Check directions
   - Adjust wiring if needed

## Step 9: Calibration (30 minutes)

### Motor Calibration

1. Test forward motion
   - Both wheels same speed?
   - Adjust PWM if needed
2. Test turning
   - Smooth rotation?
   - Check center of rotation

### Sensor Calibration

1. Ultrasonic: Measure known distances
2. IMU: Calibrate gyro/accel
3. Encoders: Count ticks per revolution

### Save Configuration

Create `/config/robot.yaml`:

```yaml
robot:
  wheel_diameter: 65 # mm
  wheel_base: 150 # mm
  motors:
    swap_left: false
    swap_right: false
  sensors:
    ultrasonic_offset: 100 # mm from center
```

## Step 10: First Autonomous Run

1. Clear test area (2x2 meters)
2. Import obstacle avoidance flow
3. Set conservative speeds (30%)
4. Place cardboard box as obstacle
5. Deploy and watch!

## Troubleshooting

### Robot spins in place

- One motor reversed → Swap motor wires
- Different wheel sizes → Check wheels
- PWM imbalance → Calibrate speeds

### Hits obstacles

- Sensor not reading → Check wiring
- Angle wrong → Adjust sensor mount
- Too fast → Reduce speed

### Stops randomly

- Power issue → Check batteries
- Loose connection → Secure wires
- Software crash → Check Node-RED logs

### WiFi issues

- Can't find robot → Check router
- Disconnects → Improve antenna position
- Slow response → Reduce camera resolution

## Safety Tips

1. **Always have emergency stop**
   - Physical button
   - Remote kill switch
   - Software timeout

2. **Start slow**
   - Test at 30% speed first
   - Increase gradually
   - Watch for overheating

3. **Protect circuits**
   - Use fuses
   - Check polarity
   - No metal tools near circuits

## Next Steps

### Basic Testing Complete?

1. Try color following
2. Add more sensors
3. Experiment with speeds

### Want More Features?

- Add camera for vision
- Install manipulator arm
- Add display/speakers

### Join the Community

- Share build photos
- Get help with issues
- Find new projects

## Maintenance

### Regular Checks

- Tighten screws monthly
- Check wire connections
- Clean sensors
- Calibrate IMU

### Battery Care

- Don't over-discharge
- Store charged
- Check balance (LiPo)
- Replace when weak

---

Congratulations! You've built a Tafy RDOS robot! 🎉

Share your build: #TafyRobot
