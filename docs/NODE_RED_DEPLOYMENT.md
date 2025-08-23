# Node-RED Deployment Guide

This guide covers deploying and using Node-RED with Tafy Studio for visual robot programming.

## Local Development Setup

### Prerequisites

- k3d installed (`brew install k3d`)
- kubectl installed (`brew install kubectl`)
- helm installed (`brew install helm`)

### Quick Start

1. **Create k3s cluster**:

   ```bash
   k3d cluster create tafy-dev --servers 1 --agents 2
   ```

2. **Deploy NATS**:

   ```bash
   helm repo add nats https://nats-io.github.io/k8s/helm/charts/
   helm repo update
   helm install nats nats/nats -f charts/nats/values.yaml \
     --create-namespace --namespace tafy-system
   ```

3. **Deploy Node-RED**:

   ```bash
   helm install node-red ./charts/node-red \
     --namespace tafy-system
   ```

4. **Access Node-RED UI**:

   ```bash
   kubectl port-forward service/node-red-tafy-node-red 1880:1880 -n tafy-system
   ```

   Then open <http://localhost:1880> in your browser.

## Creating Robot Control Flows

### Basic Motor Control Flow

1. **Import Example Flow**:
   - Copy the contents of `packages/node-red-contrib-tafy/examples/motor-teleop-flow.json`
   - In Node-RED UI, click menu → Import → Clipboard
   - Paste and import

2. **Key Components**:
   - **Inject Nodes**: Trigger motor commands (Forward, Rotate, Stop)
   - **HAL Envelope Function**: Wraps commands in HAL format
   - **MQTT Out**: Publishes to NATS (configured as MQTT broker)
   - **MQTT In**: Subscribes to motor telemetry
   - **Dashboard Gauges**: Visual feedback of motor speeds

### NATS Connection

Node-RED connects to NATS using the MQTT protocol:

- **Broker**: `nats.tafy-system.svc.cluster.local`
- **Port**: 4222
- **Topics**: HAL subjects like `hal.v1.motor.cmd`

### HAL Message Format

Motor commands follow the HAL envelope format:

```json
{
  "hal_major": 1,
  "hal_minor": 0,
  "schema": "tafylabs/hal/motor/differential/1.0",
  "device_id": "esp32-a4cf12",
  "caps": ["motor.differential:v1.0"],
  "ts": "2024-03-14T10:30:00.000Z",
  "payload": {
    "linear_meters_per_sec": 0.5,
    "angular_rad_per_sec": 0
  }
}
```

## Custom Tafy Nodes

The custom Node-RED nodes for Tafy are in development and will provide:

- **tafy-nats-pub/sub**: Native NATS publish/subscribe
- **tafy-motor-control**: Motor command helper
- **tafy-sensor-range**: Range sensor data handler
- **tafy-device-discovery**: Automatic device discovery
- **tafy-gamepad**: Gamepad input for teleop

To build and use custom nodes:

```bash
cd packages/node-red-contrib-tafy
docker build -t tafystudio/node-red-tafy:latest .
```

Then enable in `charts/node-red/values.yaml`:

```yaml
customNodes:
  enabled: true
  repository: tafystudio/node-red-tafy
  tag: "latest"
```

## Production Deployment

For production:

1. Enable authentication in `values.yaml`
2. Use persistent storage with backup
3. Configure ingress for external access
4. Enable NATS authentication
5. Set resource limits appropriately

## Troubleshooting

### Node-RED Pod Not Starting

Check service account:

```bash
kubectl get sa -n tafy-system
kubectl describe deployment node-red-tafy-node-red -n tafy-system
```

### Cannot Connect to NATS

Verify NATS is running:

```bash
kubectl get pods -n tafy-system
kubectl logs nats-0 -n tafy-system
```

Test connection:

```bash
kubectl exec -it nats-box-xxx -n tafy-system -- nats sub ">"
```

### Flows Not Persisting

Check PVC:

```bash
kubectl get pvc -n tafy-system
kubectl describe pvc node-red-tafy-node-red -n tafy-system
```

## Dashboard Access

Node-RED Dashboard is available at: <http://localhost:1880/ui>

Features:

- Real-time motor telemetry
- Joystick control widget
- Sensor data visualization
- System health monitoring

## Next Steps

1. Connect ESP32 robot to same network
2. Configure ESP32 with NATS server address
3. Create teleop flow with gamepad input
4. Add obstacle avoidance logic
5. Implement autonomous behaviors
