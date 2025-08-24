# USB Camera Driver for Tafy RDOS

This driver provides V4L2-based USB camera access with MJPEG streaming and HAL integration for the Tafy Robot Distributed Operation System.

## Features

- V4L2 camera interface for Linux
- MJPEG streaming over HTTP
- WebRTC peer-to-peer video streaming
- WebSocket frame streaming
- HAL message integration via NATS
- Prometheus metrics
- Multiple resolution support
- Automatic camera discovery and selection

## Quick Start

### Using Docker

```bash
# Build the image
docker build -t tafy/camera-usb .

# Run with default camera
docker run --rm \
  --device /dev/video0 \
  -p 8080:8080 \
  -p 8081:8081 \
  -e TAFY_CAMERA_NATS_URL=nats://host.docker.internal:4222 \
  tafy/camera-usb

# Run with specific camera
docker run --rm \
  --device /dev/video1 \
  -p 8080:8080 \
  -e TAFY_CAMERA_DEVICE=/dev/video1 \
  tafy/camera-usb
```

### Using Kubernetes

```bash
# Deploy to k3s cluster
kubectl apply -f deploy/camera-driver.yaml
```

### Building from Source

```bash
# Install dependencies
go mod download

# Build
go build -o camera-driver ./cmd/camera-driver

# Run with specific device
./camera-driver --device /dev/video0 --nats-url nats://localhost:4222

# Run with auto-discovery
./camera-driver --auto-select

# List available cameras
./camera-driver --discover
```

## Configuration

Configuration can be provided via:

1. Config file (`config/config.yaml`)
2. Environment variables (prefix: `TAFY_CAMERA_`)
3. Command line flags

### Environment Variables

- `TAFY_CAMERA_DEVICE` - V4L2 device path (default: `/dev/video0`)
- `TAFY_CAMERA_NATS_URL` - NATS server URL (default: `nats://localhost:4222`)
- `TAFY_CAMERA_NODE_ID` - Node ID (auto-generated if empty)
- `TAFY_CAMERA_SERVER_HTTP_PORT` - HTTP server port (default: `8080`)
- `TAFY_CAMERA_SERVER_METRICS_PORT` - Metrics port (default: `8081`)
- `TAFY_CAMERA_CAMERA_WIDTH` - Video width (default: `640`)
- `TAFY_CAMERA_CAMERA_HEIGHT` - Video height (default: `480`)
- `TAFY_CAMERA_CAMERA_FPS` - Frames per second (default: `30`)
- `TAFY_CAMERA_CAMERA_FORMAT` - Video format: MJPEG, YUYV (default: `MJPEG`)
- `TAFY_CAMERA_CAMERA_QUALITY` - JPEG quality 1-100 (default: `85`)

## API Endpoints

### HTTP Endpoints

- `GET /stream` - MJPEG stream
- `GET /snapshot` - Single JPEG frame
- `GET /api/v1/status` - Camera status
- `GET /api/v1/info` - Camera information
- `GET /api/v1/discovery` - Discover available cameras
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

### WebSocket Endpoints

- `WS /ws` - WebSocket frame streaming (MJPEG frames)
- `WS /webrtc` - WebRTC signaling endpoint

## HAL Integration

The driver publishes camera data via NATS using the HAL protocol:

### Published Topics

- `hal.v1.camera.frame.<node-id>` - Frame metadata
- `hal.v1.camera.status.<node-id>` - Camera status
- `hal.v1.camera.telemetry.<node-id>` - Telemetry data

### Subscribed Topics

- `hal.v1.camera.cmd.<node-id>` - Control commands

### Message Schemas

#### Frame Metadata

```json
{
  "hal_major": 1,
  "hal_minor": 0,
  "schema": "tafylabs/hal/camera/frame/1.0",
  "device_id": "camera-node1",
  "caps": ["camera.usb:v1.0"],
  "ts": "2024-03-14T10:30:00Z",
  "payload": {
    "camera_id": "usb-0",
    "resolution": "640x480",
    "format": "MJPEG",
    "fps": 30,
    "timestamp": 1710415800000,
    "frame_count": 12345,
    "size": 45678,
    "url": "http://camera-node1:8080/stream"
  }
}
```

## Streaming Options

### MJPEG Streaming

- Simple HTTP-based streaming
- Universal browser support  
- Higher latency (300-500ms)
- Good for monitoring/recording

### WebRTC Streaming

- Peer-to-peer video transmission
- Low latency (50-200ms)
- Adaptive bitrate
- Best for real-time control

See [examples/webrtc](examples/webrtc) for WebRTC client example.

## Camera Discovery

The driver supports automatic camera discovery:

```bash
# List all available cameras
./camera-driver --discover

# Auto-select best camera (prefers MJPEG support)
./camera-driver --auto-select

# Query via API
curl http://localhost:8080/api/v1/discovery
```

Discovery information includes:

- Device path and name
- Supported formats (MJPEG, YUYV, etc.)
- Available resolutions
- Driver information
- Bus information

## Supported Cameras

Most V4L2-compatible USB cameras work, including:

- Logitech C920/C922
- Logitech C270
- Microsoft LifeCam
- Generic UVC cameras
- Raspberry Pi Camera (via V4L2 driver)

## Troubleshooting

### Camera Not Found

```bash
# List available cameras
v4l2-ctl --list-devices

# Check camera capabilities
v4l2-ctl -d /dev/video0 --list-formats-ext
```

### Permission Denied

```bash
# Add user to video group
sudo usermod -a -G video $USER

# Or run with privileged mode (Docker)
docker run --privileged ...
```

### Poor Performance

1. Check USB connection (USB 3.0 recommended)
2. Reduce resolution or FPS
3. Use MJPEG format instead of raw formats
4. Check CPU usage and network bandwidth

## Development

### Running Tests

```bash
go test ./...
```

### Building Docker Image

```bash
docker build -t tafy/camera-usb:dev .
```

### Viewing Logs

```bash
# Docker
docker logs -f <container-id>

# Kubernetes
kubectl logs -f deployment/camera-driver
```

## License

Apache License 2.0
