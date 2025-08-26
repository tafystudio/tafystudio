# Tafy RDOS Driver Development Guide

This guide explains how to create HAL-compliant drivers for hardware devices in Tafy RDOS.

## Overview

Drivers in Tafy RDOS are containerized services that:

1. Interface with hardware (sensors, actuators, etc.)
2. Communicate via NATS using HAL message format
3. Provide health monitoring and configuration
4. Can be written in any language (Go preferred, Python common)

## Example Drivers

We provide several example drivers demonstrating different patterns:

### 1. Sensor Drivers

- **[ultrasonic-hcsr04](../drivers/ultrasonic-hcsr04/)** - Simple GPIO sensor (Go)
- **[tof-vl53l0x](../drivers/tof-vl53l0x/)** - I2C sensor with library (Python)
- **[imu-mpu6050](../drivers/imu-mpu6050/)** - Complex I2C sensor with calibration (Go)

### 2. Actuator Drivers

- **[servo-sg90](../drivers/servo-sg90/)** - PWM servo control (Python)
- **[motor-l298n](../drivers/motor-l298n/)** - Dual motor driver (Go)
- **[led-ws2812](../drivers/led-ws2812/)** - Addressable LED strip (Python)

### 3. Complex Drivers

- **[camera-v4l2](../drivers/camera-v4l2/)** - Video streaming (Go)
- **[gps-nmea](../drivers/gps-nmea/)** - Serial protocol parsing (Python)
- **[lidar-rplidar](../drivers/lidar-rplidar/)** - Binary protocol with SDK (Go)

## Driver Structure

Every driver follows this structure:

```text
driver-name/
├── README.md           # User documentation
├── driver.yaml         # HAL capability declaration
├── Dockerfile          # Container definition
├── compose.yaml        # Docker Compose service
├── Makefile           # Build and test commands
├── src/               
│   ├── main.go        # Main implementation (or main.py)
│   ├── hal.go         # HAL message handling
│   ├── hardware.go    # Hardware interface
│   └── config.go      # Configuration handling
├── config/
│   └── default.yaml   # Default configuration
├── test/
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── hardware/      # Hardware-in-loop tests
└── examples/
    ├── basic.flow     # Node-RED example
    └── advanced.py    # Python SDK example
```

## HAL Compliance

### 1. Capability Declaration (driver.yaml)

```yaml
hal:
  version: "1.0"
  capability: "sensor.distance.ultrasonic"
  
device:
  name: "HC-SR04 Ultrasonic Sensor"
  manufacturer: "Generic"
  model: "HC-SR04"
  
interfaces:
  - type: "GPIO"
    pins:
      - name: "trigger"
        number: 23
        direction: "output"
      - name: "echo"
        number: 24
        direction: "input"

messages:
  publish:
    - topic: "hal.v1.sensor.distance.data"
      schema: "distance_reading.json"
    - topic: "hal.v1.device.telemetry"
      schema: "device_telemetry.json"
      
  subscribe:
    - topic: "hal.v1.sensor.distance.cmd"
      schema: "sensor_command.json"

configuration:
  - name: "sample_rate"
    type: "integer"
    default: 10
    min: 1
    max: 100
    unit: "Hz"
  - name: "max_distance"
    type: "float"
    default: 4.0
    min: 0.02
    max: 4.0
    unit: "meters"
```

### 2. Message Format

All messages must follow HAL envelope format:

```go
type HALMessage struct {
    HALMajor  int         `json:"hal_major"`
    HALMinor  int         `json:"hal_minor"`
    Schema    string      `json:"schema"`
    DeviceID  string      `json:"device_id"`
    Caps      []string    `json:"caps"`
    Timestamp time.Time   `json:"ts"`
    Payload   interface{} `json:"payload"`
}
```

### 3. Required Endpoints

#### Health Check

```go
// GET /health
{
  "status": "healthy",
  "device_id": "ultrasonic-01",
  "uptime": 3600,
  "last_reading": "2024-03-20T10:30:45Z",
  "errors": []
}
```

#### Metrics (Prometheus format)

```prometheus
# GET /metrics
tafy_sensor_readings_total{type="ultrasonic"} 12345
tafy_sensor_errors_total{type="ultrasonic"} 2
tafy_sensor_distance_meters{sensor="ultrasonic-01"} 1.23
```

## Implementation Patterns

### Pattern 1: Simple Polling Sensor (HC-SR04)

```go
func (d *Driver) Run(ctx context.Context) error {
    ticker := time.NewTicker(d.sampleInterval)
    defer ticker.Stop()
    
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-ticker.C:
            distance, err := d.readDistance()
            if err != nil {
                d.logger.Error("read failed", "error", err)
                d.metrics.errors.Inc()
                continue
            }
            
            msg := d.createHALMessage(distance)
            if err := d.publish(msg); err != nil {
                d.logger.Error("publish failed", "error", err)
            }
            d.metrics.readings.Inc()
        }
    }
}
```

### Pattern 2: Event-Driven Actuator (Servo)

```python
async def handle_command(self, msg):
    """Handle incoming servo commands"""
    try:
        data = json.loads(msg.data.decode())
        
        # Validate HAL envelope
        if not self.validate_hal_message(data):
            return
            
        payload = data['payload']
        
        if payload['command'] == 'set_position':
            angle = payload['angle']
            await self.set_servo_position(angle)
            
        elif payload['command'] == 'sweep':
            await self.sweep_servo(
                payload['start'], 
                payload['end'],
                payload['speed']
            )
            
        # Send acknowledgment
        ack = self.create_hal_message({
            'status': 'ok',
            'command': payload['command'],
            'device_id': self.device_id
        })
        
        await self.nc.publish(
            f"hal.v1.actuator.servo.ack",
            json.dumps(ack).encode()
        )
        
    except Exception as e:
        self.logger.error(f"Command error: {e}")
        self.metrics['errors'] += 1
```

### Pattern 3: Stream Processing (Camera)

```go
func (d *Driver) StreamFrames(ctx context.Context) error {
    stream, err := d.camera.OpenStream()
    if err != nil {
        return fmt.Errorf("open stream: %w", err)
    }
    defer stream.Close()
    
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case frame := <-stream.Frames():
            // Process frame (detect motion, compress, etc.)
            processed := d.processFrame(frame)
            
            // Publish as HAL message
            msg := HALMessage{
                HALMajor: 1,
                HALMinor: 0,
                Schema: "tafylabs/hal/sensor/camera/frame/1.0",
                DeviceID: d.deviceID,
                Caps: []string{"camera.stream:v1.0"},
                Timestamp: time.Now(),
                Payload: map[string]interface{}{
                    "format": "jpeg",
                    "width": processed.Width,
                    "height": processed.Height,
                    "data": processed.Base64Data,
                    "metadata": processed.Metadata,
                },
            }
            
            // Use JetStream for reliable delivery
            d.js.Publish("hal.v1.sensor.camera.frame", msg)
        }
    }
}
```

## Testing Your Driver

### 1. Unit Tests

Test hardware abstraction layer:

```go
func TestDistanceCalculation(t *testing.T) {
    d := &Driver{
        speedOfSound: 343.0, // m/s
    }
    
    // Test known pulse duration
    duration := 5800 * time.Microsecond // ~1 meter
    distance := d.calculateDistance(duration)
    
    assert.InDelta(t, 1.0, distance, 0.01)
}
```

### 2. Integration Tests

Test with NATS:

```python
@pytest.mark.asyncio
async def test_servo_command():
    # Start test NATS server
    ns = await start_nats_server()
    
    # Start driver
    driver = ServoDriver(config={
        'pin': 18,
        'min_pulse': 1000,
        'max_pulse': 2000
    })
    await driver.start()
    
    # Connect test client
    nc = await nats.connect("nats://localhost:4222")
    
    # Send command
    cmd = create_hal_message({
        'command': 'set_position',
        'angle': 90
    })
    
    await nc.publish("hal.v1.actuator.servo.cmd", 
                    json.dumps(cmd).encode())
    
    # Wait for acknowledgment
    ack = await nc.subscribe("hal.v1.actuator.servo.ack")
    msg = await ack.next_msg(timeout=1.0)
    
    data = json.loads(msg.data.decode())
    assert data['payload']['status'] == 'ok'
```

### 3. Hardware-in-Loop Tests

```bash
# Run with real hardware connected
make test-hardware DEVICE=/dev/ttyUSB0
```

## Configuration

### Environment Variables

```bash
# Required
TAFY_DEVICE_ID=ultrasonic-01
TAFY_NATS_URL=nats://localhost:4222

# Optional
TAFY_LOG_LEVEL=debug
TAFY_METRICS_PORT=9090
TAFY_CONFIG_FILE=/config/custom.yaml
```

### Configuration File

```yaml
# config/default.yaml
device:
  id: "${TAFY_DEVICE_ID}"
  name: "Ultrasonic Sensor"
  location: "front"

hardware:
  trigger_pin: 23
  echo_pin: 24
  max_distance: 4.0

sampling:
  rate: 10
  burst_count: 3
  burst_delay: 10ms

nats:
  url: "${TAFY_NATS_URL}"
  reconnect_delay: 5s
  max_reconnects: -1
```

## Building and Packaging

### Dockerfile Example

```dockerfile
# Multi-stage build for Go driver
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o driver ./src

# Final stage
FROM alpine:3.19

RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/driver .
COPY config/default.yaml /config/

# Run as non-root
USER 1000

CMD ["./driver"]
```

### Compose Service

```yaml
services:
  ultrasonic-front:
    build: .
    image: tafylabs/driver-ultrasonic:latest
    restart: unless-stopped
    privileged: true # Required for GPIO
    devices:
      - /dev/gpiomem:/dev/gpiomem
    environment:
      - TAFY_DEVICE_ID=ultrasonic-front
      - TAFY_NATS_URL=nats://nats:4222
    volumes:
      - ./config:/config:ro
    depends_on:
      - nats
```

## Best Practices

### 1. Error Handling

- Always validate inputs
- Implement exponential backoff for retries
- Log errors with context
- Update health status on failures

### 2. Performance

- Use buffered channels for high-frequency data
- Implement sampling/throttling for chatty sensors
- Consider using NATS JetStream for reliable delivery
- Profile memory usage for long-running drivers

### 3. Security

- Run as non-root user when possible
- Validate all external inputs
- Use TLS for NATS connections in production
- Implement rate limiting for commands

### 4. Observability

- Export Prometheus metrics
- Use structured logging
- Include correlation IDs in messages
- Implement distributed tracing

## Submitting Your Driver

1. **Test Thoroughly**

   ```bash
   make test
   make test-integration
   make test-hardware  # If applicable
   ```

2. **Document**
   - Update README with examples
   - Include wiring diagrams
   - List compatible hardware

3. **Create PR**
   - One driver per PR
   - Include example Node-RED flow
   - Add to driver registry

4. **Maintenance**
   - Monitor issues
   - Update for HAL changes
   - Support community questions

## Resources

- [HAL Specification](HAL_SPEC.md)
- [Example Drivers](../drivers/)
- [Testing Guide](TESTING.md)
- [Community Forum](https://forum.tafy.studio)

## Getting Help

- Discord: #driver-development channel
- GitHub: Create an issue with `driver` label
- Forum: Post in "Hardware Support" category
