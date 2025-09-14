# Tafy RDOS Node-RED Quick Start Guide

Get your robot moving in 30 minutes or less!

## Prerequisites

- Tafy RDOS installed and running
- Node-RED accessible at `http://tafy.local:1880`
- Robot hardware connected (motors, sensors, camera)
- NATS server running

## Step 1: Install Tafy Nodes (2 minutes)

1. Open Node-RED at `http://tafy.local:1880`
2. Click hamburger menu → Manage palette
3. Search for `@tafystudio/node-red-contrib-tafy`
4. Click Install

Or via command line:

```bash
cd ~/.node-red
pnpm add @tafystudio/node-red-contrib-tafy
```

## Step 2: Basic Motor Test (5 minutes)

Let's verify your motors work:

1. Drag these nodes onto the canvas:
   - **Inject** (from input category)
   - **tafy-motor-control** (from tafy category)
   - **tafy-nats-pub** (from tafy category)
   - **Debug** (from output category)

2. Connect them in sequence: Inject → Motor Control → NATS Pub → Debug

3. Double-click each node to configure:
   - **Inject**: Set payload to JSON: `{"left": 0.3, "right": 0.3}`
   - **Motor Control**: Leave defaults
   - **NATS Pub**:
     - Add new NATS config
     - Server: `nats://localhost:4222`
     - Topic: `hal.v1.motor.cmd`

4. Deploy (red Deploy button)

5. Click the Inject button - motors should move forward slowly!

## Step 3: Obstacle Avoidance (10 minutes)

Add autonomous obstacle avoidance:

1. Import the example flow:
   - Menu → Import → Examples → node-red-contrib-tafy → obstacle-avoidance

2. Configure your sensor:
   - Double-click the **Sensor Input** node
   - Set your sensor topic (e.g., `hal.v1.sensor.ultrasonic.data`)

3. Adjust safety distances:
   - Double-click **Obstacle Avoid** node
   - Set distances for your robot:
     - Stop Distance: 30cm (emergency stop)
     - Slow Distance: 60cm (start slowing)
     - Turn Threshold: 40cm (start turning)

4. Deploy and test:
   - Place obstacle in front of robot
   - Robot should stop/turn automatically!

## Step 4: Color Following (10 minutes)

Make your robot follow a colored ball:

1. Import the color following example:
   - Menu → Import → Examples → node-red-contrib-tafy → color-following

2. Configure camera:
   - Double-click **Camera Stream** node
   - Set your camera URL (e.g., `http://192.168.1.100:8080/video`)

3. Calibrate target color:
   - Double-click **Color Tracker** node
   - Choose your target color:
     - Green ball: H=120°, S=80%, V=70%
     - Red ball: H=0°, S=90%, V=80%
     - Blue ball: H=240°, S=85%, V=75%
   - Adjust tolerance if needed (start with ±20)

4. Test tracking:
   - Deploy the flow
   - Hold colored object in front of camera
   - Check Debug panel for tracking data
   - Robot should turn to follow!

## Step 5: Combine Behaviors (3 minutes)

Create a safe color-following robot:

1. Import the combined example
2. Connect both obstacle avoidance and color following to a priority handler
3. Obstacle avoidance always takes priority over following

```text
Camera → Color Tracker → Color Follow ↘
                                        Priority → Motors
Sensors → Obstacle Avoid ────────────────↗
```

## Testing Your Robot

### Motor Test Commands

```json
// Forward
{"left": 0.5, "right": 0.5}

// Turn left
{"left": -0.3, "right": 0.3}

// Turn right  
{"left": 0.3, "right": -0.3}

// Stop
{"left": 0, "right": 0}
```

### Debug Tips

1. **Check NATS connection**:

   ```bash
   nats-cli sub "hal.>"
   ```

2. **Monitor motor commands**:
   - Add Debug node after Motor Control
   - Set to show "complete msg object"

3. **Test sensors**:
   - Add Inject → NATS Pub to simulate sensor data
   - Payload: `{"distance": 25, "unit": "cm"}`

4. **Camera issues**:
   - Verify URL in browser first
   - Check CORS settings if needed
   - Try lower resolution/framerate

## Common Issues

### Motors don't move

- Check NATS connection (green dot on NATS node)
- Verify motor driver is running: `kubectl get pods`
- Check motor power supply

### Obstacle avoidance too sensitive

- Increase stop/slow distances
- Add sensor fusion for multiple sensors
- Check sensor mounting angle

### Can't track colors

- Test in consistent lighting
- Avoid reflective surfaces
- Try adjusting HSV tolerance
- Use Debug node to see what camera sees

### Jerky movements

- Add smoothing in Color Follow node (0.7-0.9)
- Reduce motor max speed
- Lower camera framerate

## Next Steps

1. **Fine-tune behaviors**:
   - Adjust PID gains for smoother following
   - Tweak obstacle distances for your environment
   - Calibrate colors in actual lighting

2. **Add more sensors**:
   - Connect multiple ultrasonic sensors
   - Add sensor fusion node
   - Implement 360° awareness

3. **Create custom behaviors**:
   - Use Function nodes for logic
   - Combine multiple behaviors
   - Add state machines

4. **Save your flows**:
   - Export working flows as backup
   - Version control in git
   - Share with community!

## Getting Help

- Documentation: `/docs/FLOWS.md`
- Examples: `/examples/` directory
- Community: [github.com/tafystudio/tafystudio](https://github.com/tafystudio/tafystudio)
- Issues: [GitHub Issues](https://github.com/tafystudio/tafystudio/issues)

## Performance Targets

- Time-to-First-Motion: <100ms ✓
- Control loop: 10-50Hz
- Typical latency: 10-30ms
- CPU usage: <10% per behavior

Congratulations! Your robot now has autonomous behaviors. 🤖

Happy robotics!
