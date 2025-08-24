# WebRTC Camera Streaming Example

This example demonstrates how to connect to the Tafy camera driver using WebRTC for low-latency video streaming.

## Features

- Real-time video streaming with minimal latency
- Connection statistics display
- Automatic reconnection handling
- Peer-to-peer video transmission

## Usage

### 1. Start the Camera Driver

```bash
# From the camera-usb directory
go run ./cmd/camera-driver --device /dev/video0
```

### 2. Open the WebRTC Client

Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge).

### 3. Connect to Camera

1. Enter the WebRTC signaling URL (default: `ws://localhost:8080/webrtc`)
2. Click "Connect"
3. The video stream should appear once the connection is established

## WebRTC vs MJPEG Streaming

### WebRTC Advantages

- **Lower latency** (50-200ms vs 500ms+ for MJPEG)
- **Better bandwidth efficiency** with H.264/VP8 codecs
- **Adaptive bitrate** based on network conditions
- **NAT traversal** for remote connections
- **Secure by default** (DTLS encryption)

### MJPEG Advantages

- **Simpler implementation** (just HTTP)
- **Universal compatibility** (any browser)
- **No signaling required**
- **Easy to embed** in other applications

## WebRTC Signaling Protocol

The camera driver uses WebSocket for WebRTC signaling with the following message types:

### Client → Server

```json
// Initial offer
{
  "type": "offer",
  "offer": {
    "type": "offer",
    "sdp": "..."
  }
}

// ICE candidate
{
  "type": "candidate",
  "candidate": {
    "candidate": "...",
    "sdpMLineIndex": 0,
    "sdpMid": "0"
  }
}
```

### Server → Client

```json
// Answer to offer
{
  "type": "answer",
  "answer": {
    "type": "answer",
    "sdp": "..."
  }
}

// ICE candidate
{
  "type": "candidate",
  "candidate": {
    "candidate": "...",
    "sdpMLineIndex": 0,
    "sdpMid": "0"
  }
}
```

## Troubleshooting

### No video displayed

1. Check browser console for errors
2. Ensure camera permissions are granted
3. Verify the camera driver is running
4. Check firewall settings for WebRTC ports

### High latency

1. Check network conditions
2. Reduce video resolution/framerate
3. Ensure both peers are on same network
4. Check CPU usage on camera device

### Connection fails

1. Verify WebSocket URL is correct
2. Check CORS settings if accessing from different origin
3. Ensure STUN server is accessible
4. Try using Chrome/Edge for best compatibility

## Advanced Configuration

### Custom STUN/TURN Servers

Edit the `config` object in `index.html`:

```javascript
const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { 
            urls: 'turn:turnserver.com:3478',
            username: 'user',
            credential: 'pass'
        }
    ]
};
```

### Constraints

Modify the offer constraints for different behaviors:

```javascript
const offer = await pc.createOffer({
    offerToReceiveVideo: true,
    offerToReceiveAudio: true,  // If audio is available
    iceRestart: true            // Force ICE restart
});
```
