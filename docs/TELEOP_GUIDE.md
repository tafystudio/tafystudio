# Tafy Studio Teleoperation Guide

This guide covers the teleoperation (remote control) capabilities of Tafy Studio RDOS.

## Overview

Tafy Studio provides multiple methods for controlling robots remotely:

1. **Gamepad/Controller** - Physical game controllers (Xbox, PlayStation, etc.)
2. **Virtual Joystick** - On-screen touch/mouse control
3. **Keyboard** - WASD or arrow key control

All control methods output standardized differential drive commands that work with any robot using the Tafy HAL.

## Control Methods

### Gamepad Control

The gamepad node supports standard game controllers using the browser's Gamepad API.

**Features:**

- Auto-detection of connected controllers
- Configurable deadzone for analog sticks
- Multiple output modes (differential drive, normalized, raw)
- Support for up to 4 controllers
- Button mapping for common actions

**Standard Layout:**

```text
Left Stick Y: Forward/Backward
Left Stick X: Turn Left/Right
Right Trigger: Boost
A Button: Action 1
B Button: Action 2
```

### Virtual Joystick

The on-screen joystick provides touch and mouse control for devices without physical controllers.

**Features:**

- Responsive touch controls
- Visual feedback
- Auto-centering option
- Adjustable size
- Deadzone visualization

### Keyboard Control

Keyboard input provides quick control using standard key layouts.

**WASD Layout:**

- W: Forward
- S: Backward
- A: Turn Left  
- D: Turn Right
- Shift: Boost (2x speed)
- Space: Emergency Stop

**Arrow Key Layout:**

- ↑: Forward
- ↓: Backward
- ←: Turn Left
- →: Turn Right
- Shift: Boost
- Space: Emergency Stop

## Node-RED Integration

### Basic Teleop Flow

```json
[Gamepad Input] → [Motor Command] → [NATS Publish] → Robot
```

### Example Implementation

1. **Import the teleop example flow:**

   ```bash
   cd ~/.node-red
   npm install @tafystudio/node-red-contrib-tafy
   # Import examples/teleop-control.json
   ```

2. **Configure NATS connection:**
   - Double-click the NATS config node
   - Set URL to your NATS server (default: `nats://localhost:4222`)
   - Add authentication if required

3. **Deploy and test:**
   - Deploy the flow
   - Open the dashboard
   - Connect a gamepad or use keyboard/joystick

## Output Formats

### Differential Drive Mode

Standard output for two-wheeled robots:

```json
{
  "left": -1.0,    // Left wheel speed (-1 to 1)
  "right": 0.5,    // Right wheel speed (-1 to 1)  
  "forward": -0.25, // Forward component
  "turn": 0.5      // Turn component
}
```

### HAL Motor Command

Commands are wrapped in HAL format for transmission:

```json
{
  "hal_major": 1,
  "hal_minor": 0,
  "schema": "tafylabs/hal/motor/differential/1.0",
  "device_id": "robot-main",
  "caps": ["motor.differential:v1.0"],
  "ts": "2024-03-14T10:30:00.000Z",
  "payload": {
    "left_speed": -1.0,
    "right_speed": 0.5,
    "duration_ms": 100
  }
}
```

## Configuration Options

### Deadzone

Prevents drift from analog stick center position:

- Range: 0.0 to 1.0
- Default: 0.1 (10% of stick range)
- Higher values = larger center dead area

### Speed Limiting

Controls maximum output speed:

- Range: 0.0 to 1.0  
- Default: 1.0 (full speed)
- Lower values for safer operation

### Acceleration

Smooths speed changes:

- Range: 0.0 to 1.0
- Default: 0.1
- 0 = instant speed changes
- Higher = smoother ramping

## Advanced Features

### Multi-Input Priority

When multiple inputs are active, priority is:

1. Emergency stop (always highest)
2. Gamepad
3. Keyboard
4. Virtual joystick

### Recording & Playback

Record control sequences for autonomous playback:

1. Enable recording in the flow
2. Perform control actions
3. Save recording to file
4. Replay using the playback node

### Custom Control Mapping

Define custom control schemes:

```javascript
{
  "forward": "i",
  "backward": "k", 
  "left": "j",
  "right": "l",
  "boost": "u",
  "stop": "space"
}
```

## Safety Considerations

1. **Timeout Protection** - Commands auto-expire after 100ms
2. **Emergency Stop** - Space bar stops all motors immediately
3. **Connection Monitoring** - Auto-stop on connection loss
4. **Speed Limiting** - Configurable maximum speeds
5. **Deadzone** - Prevents accidental movement

## Troubleshooting

### Gamepad Not Detected

- Ensure gamepad is connected before opening browser
- Press any button to activate
- Check browser console for errors
- Try different USB port

### High Latency

- Check network connection to robot
- Reduce command frequency if needed
- Use wired connection when possible
- Monitor NATS message queue

### Erratic Movement

- Increase deadzone setting
- Check for electromagnetic interference
- Calibrate gamepad in OS settings
- Reduce acceleration for smoother control

## API Reference

### Gamepad Input Node

**Inputs:**

- `msg.payload` = "start" | "stop" | true | false

**Outputs:**

- `msg.payload` = control data
- `msg.topic` = "gamepad/input" | "gamepad/connected" | "gamepad/disconnected"

### Keyboard Input Node  

**Inputs:**

- `msg.payload` = "start" | "stop" | true | false

**Outputs:**

- `msg.payload` = control data
- `msg.topic` = "keyboard/input" | "keyboard/stop"
- `msg.keys` = array of pressed keys

### Joystick UI Node

**Outputs:**

- `msg.payload` = position data
- `msg.topic` = "joystick/input"

## Best Practices

1. **Start with low speeds** during initial testing
2. **Implement timeouts** in motor controllers
3. **Add visual feedback** for connection status
4. **Test emergency stops** before full operation
5. **Log commands** for debugging
6. **Use secure connections** for remote operation

## Next Steps

- [Motor Control Guide](MOTOR_CONTROL.md)
- [HAL Specification](HAL_SPEC.md)
- [Safety Guidelines](SAFETY.md)
