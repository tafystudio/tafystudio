# Tafy Node-RED Flows Documentation

This guide covers the autonomous robot behaviors and control flows available in the Tafy RDOS Node-RED package.

## Table of Contents

1. [Overview](#overview)
2. [Basic Concepts](#basic-concepts)
3. [Autonomous Behaviors](#autonomous-behaviors)
   - [Obstacle Avoidance](#obstacle-avoidance)
   - [Color Following](#color-following)
4. [Control Components](#control-components)
   - [PID Controller](#pid-controller)
   - [Sensor Fusion](#sensor-fusion)
5. [Complete Examples](#complete-examples)
6. [Performance](#performance)

## Overview

Tafy RDOS provides pre-built Node-RED nodes for common robot behaviors. These nodes can be combined to create complex autonomous behaviors without writing code.

## Basic Concepts

### Message Flow

All nodes communicate using standard Node-RED messages with specific topics and payloads:

- **Sensor messages**: `topic: "sensor/*"` with distance/position data
- **Motor commands**: `topic: "motor/command"` with left/right speeds
- **HAL messages**: Automatically formatted for hardware abstraction layer

### Coordinate System

- **Position**: 0-1 normalized (0=left/top, 1=right/bottom)
- **Centered**: -1 to 1 (0=center, negative=left/up, positive=right/down)
- **Motor speeds**: -1 to 1 (negative=reverse, positive=forward)

## Autonomous Behaviors

### Obstacle Avoidance

The obstacle avoidance node monitors distance sensors and generates motor commands to avoid collisions.

#### Configuration

```json
{
  "mode": "simple|advanced",
  "stopDistance": 30,      // cm - emergency stop
  "slowDistance": 60,      // cm - start slowing
  "turnThreshold": 40,     // cm - start turning
  "turnDirection": "auto|left|right",
  "maxSpeed": 0.5,
  "turnSpeed": 0.3
}
```

#### Modes

- **Simple**: Basic stop/slow/turn logic
- **Advanced**: State machine with backup capability

#### Example Flow

```text
[Distance Sensor] → [Sensor Fusion] → [Obstacle Avoid] → [Motor Control]
```

#### States (Advanced Mode)

1. **Scanning**: Normal operation, monitoring sensors
2. **Stopping**: Obstacle too close, emergency stop
3. **Planning**: Deciding best avoidance action
4. **Backing**: Moving backward to create space
5. **Turning**: Rotating to find clear path
6. **Stuck**: No path found, requires intervention

### Color Following

Track and follow colored objects using camera input.

#### Configuration

```json
{
  "colorSpace": "hsv",
  "hue": 120,           // 0-360 degrees
  "saturation": 80,     // 0-100%
  "value": 70,          // 0-100%
  "hueTolerance": 20,
  "minBlobSize": 100,   // pixels
  "maxTargets": 1,
  "smoothing": 0.7      // 0-1
}
```

#### Color Reference

- Red: H=0°, S=100%, V=100%
- Green: H=120°, S=100%, V=100%
- Blue: H=240°, S=100%, V=100%
- Yellow: H=60°, S=100%, V=100%
- Orange: H=30°, S=100%, V=100%

#### Tracking Output

```json
{
  "targets": [{
    "id": "target_123",
    "x": 0.65,          // 0-1 normalized
    "y": 0.45,
    "centered_x": 0.3,  // -1 to 1 for control
    "width": 0.15,      // Target size
    "confidence": 0.85
  }],
  "tracking": true,
  "timestamp": 1234567890
}
```

## Control Components

### PID Controller

Generic PID controller for smooth control of any process variable.

#### Configuration

```json
{
  "kp": 1.0,           // Proportional gain
  "ki": 0.1,           // Integral gain
  "kd": 0.05,          // Derivative gain
  "setpoint": 0,       // Target value
  "outputMin": -1.0,
  "outputMax": 1.0,
  "integralMax": 10.0, // Anti-windup
  "deadband": 0.02     // Ignore small errors
}
```

#### Tuning Process

1. Start with P-only (Ki=0, Kd=0)
2. Increase Kp until slight oscillation
3. Back off to 50-80% of oscillation point
4. Add Ki to eliminate steady-state error
5. Add Kd to reduce overshoot

#### Common Applications

##### Line Following

- Input: Line position (-1 to 1)
- Setpoint: 0 (centered)
- Output: Turn rate
- Typical gains: Kp=1.0, Ki=0.1, Kd=0.5

##### Distance Maintaining

- Input: Distance (cm)
- Setpoint: Target distance
- Output: Forward speed
- Typical gains: Kp=0.01, Ki=0.001, Kd=0.005

### Sensor Fusion

Combines multiple sensor readings for more reliable measurements.

#### Algorithms

1. **Weighted Average**: Combines based on confidence
2. **Kalman Filter**: Statistical estimation
3. **Minimum**: Conservative approach

#### Configuration

```json
{
  "algorithm": "weighted|kalman|minimum",
  "timeout": 500,        // ms - stale data threshold
  "weights": {
    "ultrasonic1": 1.0,
    "ultrasonic2": 0.8,
    "tof": 1.2
  }
}
```

## Complete Examples

### 1. Basic Obstacle Avoidance

```json
[
  {
    "id": "ultrasonic",
    "type": "sensor-input",
    "topic": "sensor/front"
  },
  {
    "id": "avoid",
    "type": "tafy-obstacle-avoid",
    "mode": "simple",
    "stopDistance": 30
  },
  {
    "id": "motors",
    "type": "tafy-motor-control"
  }
]
```

### 2. Color Following with Obstacle Override

```json
[
  {
    "id": "camera",
    "type": "tafy-camera-stream"
  },
  {
    "id": "color-track",
    "type": "tafy-color-tracker",
    "hue": 120
  },
  {
    "id": "color-follow",
    "type": "tafy-color-follow",
    "followMode": "both"
  },
  {
    "id": "obstacle",
    "type": "tafy-obstacle-avoid"
  },
  {
    "id": "priority",
    "type": "function",
    "func": "// Obstacle avoidance takes priority"
  },
  {
    "id": "motors",
    "type": "tafy-motor-control"
  }
]
```

### 3. Advanced PID Color Following

```json
[
  {
    "id": "camera",
    "type": "tafy-camera-stream"
  },
  {
    "id": "tracker",
    "type": "tafy-color-tracker"
  },
  {
    "id": "extract-x",
    "type": "function",
    "func": "return {payload: msg.payload.targets[0].centered_x}"
  },
  {
    "id": "pid-turn",
    "type": "tafy-pid-controller",
    "kp": 0.8,
    "setpoint": 0
  },
  {
    "id": "motors",
    "type": "tafy-motor-control"
  }
]
```

## Performance

### Time-to-First-Motion (TTFM)

- Target: <100ms
- Achieved: ~5ms (excluding network latency)
- Bottlenecks: Camera frame processing, network communication

### Resource Usage

- CPU: Minimal for control logic
- Memory: ~50MB for Node-RED + nodes
- Network: NATS pub/sub overhead minimal

### Optimization Tips

1. Use appropriate frame rates (10-30 FPS usually sufficient)
2. Reduce image resolution for color tracking
3. Implement sensor fusion to reduce noise
4. Use smoothing to prevent jerky movements
5. Tune PID gains for your specific hardware

## Troubleshooting

### Common Issues

#### Obstacle avoidance too aggressive

- Increase `stopDistance` and `slowDistance`
- Reduce `turnSpeed`
- Add smoothing to sensor readings

#### Color tracking jittery

- Increase `smoothing` parameter
- Reduce camera frame rate
- Check lighting conditions
- Increase `minBlobSize`

#### PID oscillation

- Reduce Kp gain
- Add derivative term (Kd)
- Increase deadband

#### Target lost frequently

- Increase color tolerances
- Improve lighting
- Reduce `lostTimeout`
- Check camera exposure settings

## Next Steps

1. Import example flows from `examples/` directory
2. Connect to your hardware via NATS
3. Calibrate sensors and color targets
4. Test with low speeds first
5. Gradually increase performance

For more examples and updates, visit the [Tafy RDOS repository](https://github.com/tafystudio/tafystudio).
