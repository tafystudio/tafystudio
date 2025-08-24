# Node-RED Tafy Nodes

A collection of Node-RED nodes for the Tafy Robot Distributed Operation System (RDOS).

## Installation

```bash
cd ~/.node-red
npm install @tafystudio/node-red-contrib-tafy
```

Or install directly from the Node-RED palette manager.

## Camera Nodes

### tafy-camera-stream

Connects to a Tafy camera stream and outputs frame data or stream URLs.

**Features:**

- MJPEG HTTP streaming
- WebSocket frame-by-frame delivery
- WebRTC peer-to-peer streaming
- Auto-reconnection support
- Multiple output formats

**Example Flow:**

```json
[{"id":"cam1","type":"tafy-camera-stream","cameraUrl":"http://camera:8080","streamType":"mjpeg"},
 {"id":"template1","type":"template","template":"<img src='{{payload.url}}' />"},
 {"id":"ui1","type":"ui_template"}]
```

### tafy-camera-snapshot

Captures single frames from a Tafy camera.

**Features:**

- On-demand snapshot capture
- Multiple output formats (Buffer, Base64, URL)
- Metadata inclusion
- Error handling

**Use Cases:**

- Periodic image capture
- Motion-triggered snapshots
- Image analysis pipelines

### tafy-camera-discovery

Discovers available cameras on the network.

**Features:**

- Automatic camera detection
- Periodic discovery updates
- Best camera selection
- Multiple output formats

**Example - Auto-select best camera:**

```javascript
// In a function node after discovery
const cameras = msg.payload.cameras;
const mjpegCamera = cameras.find(cam => 
    cam.formats.some(f => f.name.includes('MJPEG'))
);
return { payload: mjpegCamera };
```

### tafy-camera-control

Controls and queries camera settings.

**Current Commands:**

- `status` - Get camera status and statistics
- `info` - Get camera information

**Future Commands:**

- `configure` - Change camera settings
- `start/stop` - Control capture state
- Exposure, white balance, focus control

## Example Flows

### 1. Dashboard Camera Viewer

```json
[
  {
    "id": "inject1",
    "type": "inject",
    "repeat": "",
    "once": true,
    "topic": "",
    "payload": "true",
    "x": 100,
    "y": 100
  },
  {
    "id": "discovery1", 
    "type": "tafy-camera-discovery",
    "discoveryUrl": "http://hub:8080",
    "outputFormat": "simple",
    "x": 250,
    "y": 100
  },
  {
    "id": "function1",
    "type": "function", 
    "func": "// Select first camera\nconst camera = msg.payload[0];\nif (camera) {\n    flow.set('cameraUrl', `http://${camera.device}:8080`);\n    return { payload: true };\n}\nreturn null;",
    "x": 400,
    "y": 100
  },
  {
    "id": "stream1",
    "type": "tafy-camera-stream",
    "cameraUrl": "{{flow.cameraUrl}}",
    "streamType": "mjpeg",
    "x": 550,
    "y": 100
  },
  {
    "id": "dashboard1",
    "type": "ui_template",
    "template": "<img src='{{msg.payload.url}}' style='width:100%' />",
    "x": 700,
    "y": 100
  }
]
```

### 2. Motion Detection Alert

```json
[
  {
    "id": "motion1",
    "type": "mqtt in",
    "topic": "sensors/motion",
    "x": 100,
    "y": 200
  },
  {
    "id": "filter1",
    "type": "switch",
    "property": "payload",
    "rules": [{"t": "true"}],
    "x": 250,
    "y": 200
  },
  {
    "id": "snapshot1",
    "type": "tafy-camera-snapshot",
    "cameraUrl": "http://camera:8080",
    "outputType": "buffer",
    "includeMetadata": true,
    "x": 400,
    "y": 200
  },
  {
    "id": "notify1",
    "type": "function",
    "func": "// Send notification with image\nreturn {\n    payload: {\n        message: 'Motion detected!',\n        image: msg.payload,\n        timestamp: msg.metadata.timestamp\n    }\n};",
    "x": 550,
    "y": 200
  }
]
```

### 3. Multi-Camera Monitoring

```json
[
  {
    "id": "timer1",
    "type": "inject",
    "repeat": "30",
    "topic": "",
    "payload": "discover",
    "x": 100,
    "y": 300
  },
  {
    "id": "discover1",
    "type": "tafy-camera-discovery",
    "outputFormat": "full",
    "x": 250,
    "y": 300
  },
  {
    "id": "split1",
    "type": "function",
    "func": "// Create snapshot request for each camera\nconst cameras = msg.payload.cameras || [];\nreturn cameras.map(cam => ({\n    payload: 'snapshot',\n    camera: cam.device,\n    url: `http://${cam.device}:8080`\n}));",
    "x": 400,
    "y": 300
  },
  {
    "id": "snapshot2",
    "type": "tafy-camera-snapshot",
    "cameraUrl": "{{msg.url}}",
    "outputType": "base64",
    "x": 550,
    "y": 300
  },
  {
    "id": "grid1",
    "type": "ui_template",
    "template": "<div class='camera-grid'>\n    <img src='data:image/jpeg;base64,{{msg.payload}}' />\n    <div>{{msg.camera}}</div>\n</div>",
    "x": 700,
    "y": 300
  }
]
```

## Integration with HAL

These nodes work with the Tafy HAL (Hardware Abstraction Layer) system:

- Camera nodes publish telemetry to `hal.v1.camera.*` topics
- Control commands follow HAL message format
- Discovery integrates with NATS-based service discovery

## Troubleshooting

### Camera not found

- Check camera driver is running: `curl http://camera:8080/health`
- Verify network connectivity
- Ensure discovery URL is correct

### No stream displayed

- Check browser console for errors
- Verify CORS settings if accessing across origins
- Try different stream types (MJPEG vs WebSocket)

### High latency

- Use WebRTC for lowest latency
- Check network bandwidth
- Reduce resolution/FPS in camera settings

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

Apache License 2.0
