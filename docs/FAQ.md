# Frequently Asked Questions (FAQ)

## General Questions

### What is Tafy Studio?

Tafy Studio is a Robot Distributed Operation System (RDOS) that enables you to go from blank hardware to a moving robot in 30 minutes or less.
It's not an operating system but an orchestration framework for distributed robotics that runs on top of existing OSes.

### How is Tafy Studio different from ROS?

While ROS is a comprehensive robotics middleware, Tafy Studio focuses on:

- **Faster time to first motion** (30 minutes vs hours/days)
- **Visual programming first** via Node-RED
- **Browser-based tools** requiring no local installation
- **Kubernetes-native** architecture
- **Soft real-time** requirements (10-100ms latency)

Tafy Studio includes ROS compatibility layers for gradual migration.

### What hardware is supported?

Currently supported:

- **ESP32** (all variants)
- **Raspberry Pi** (3, 4, 5, Zero 2W)
- **NVIDIA Jetson** (Nano, Orin)
- **x86/ARM Linux** computers

Coming soon:

- Arduino (via ESP32 bridge)
- STM32
- Teensy

### What programming languages can I use?

Tafy Studio supports driver development in:

- **Go** (preferred)
- **Python** (for data science/ML)
- **C++** (for performance)
- **TypeScript/JavaScript** (for web integration)
- **Rust** (community contributed)

For robot behaviors, you primarily use visual programming in Node-RED.

### Is Tafy Studio open source?

Yes! Tafy Studio is licensed under Apache 2.0, allowing both personal and commercial use. Some optional enterprise features may have different licensing.

## Getting Started

### How do I install Tafy Studio?

The easiest way is our one-line installer:

```bash
curl -sfL https://get.tafy.sh | sh -
```

This installs:

- k3s (lightweight Kubernetes)
- NATS messaging server
- Hub UI and API
- Node-RED
- Basic drivers

### What are the system requirements?

**Minimum** (Hub/Controller):

- 2GB RAM
- 8GB storage
- Dual-core CPU
- Linux, macOS, or WSL2

**Recommended**:

- 4GB+ RAM
- 16GB+ storage
- Quad-core CPU
- Dedicated robotics network

**Robot Node** (ESP32):

- 520KB RAM
- 4MB flash
- WiFi connectivity

### How do I connect my first robot?

1. Flash firmware to your ESP32:
   - Open Hub UI at <http://tafy.local>
   - Go to Devices → Flash Firmware
   - Select your board and click Flash

2. The device will:
   - Connect to WiFi (configure via serial)
   - Announce itself via mDNS
   - Appear in the Devices list

3. Create a flow:
   - Open Node-RED
   - Drag in device nodes
   - Connect behaviors
   - Deploy!

### Can I use Tafy Studio without internet?

Yes! Tafy Studio is designed to work completely offline. Internet is only needed for:

- Initial installation
- Downloading additional drivers
- Cloud backup (optional)
- Remote access (optional)

## Development

### How do I create a custom driver?

Use the Tafy CLI tool:

```bash
tafy driver create --name my-driver --type sensor --language go
```

This scaffolds a complete driver with:

- HAL message handlers
- Configuration management  
- Testing framework
- Docker packaging
- Deployment manifests

See the [Driver Development Guide](./DRIVER_DEVELOPMENT.md) for details.

### How do I debug communication issues?

1. Check NATS connectivity:

   ```bash
   nats sub "hal.v1.>"  # See all HAL messages
   ```

2. View device logs:

   ```bash
   tafy device logs <device-id>
   ```

3. Check network:

   ```bash
   dns-sd -B _tafy._tcp  # Find devices via mDNS
   ```

### Why isn't my device appearing?

Common causes:

1. **Network isolation**: Ensure devices are on same network/VLAN
2. **Firewall**: Open ports 4222 (NATS), 5353 (mDNS)
3. **Wrong firmware**: Reflash with correct board type
4. **No capabilities**: Device must advertise at least one capability

### How do I add computer vision?

1. Deploy camera driver:

   ```bash
   kubectl apply -f drivers/camera-usb/deploy/
   ```

2. In Node-RED:
   - Add camera input node
   - Connect to vision processing node (YOLO, etc.)
   - Route results to motor control

3. For GPU acceleration:
   - Use Jetson devices
   - Or deploy to nodes with NVIDIA GPUs

## Architecture

### What is HAL?

HAL (Hardware Abstraction Layer) provides a uniform interface for all hardware. Instead of device-specific protocols, everything speaks HAL messages over NATS:

```json
{
  "schema": "motor.differential.command",
  "payload": {
    "linear_vel_m_per_s": 0.5,
    "angular_vel_rad_per_s": 0.0
  }
}
```

### Why NATS instead of MQTT/DDS?

NATS provides:

- **Lower latency** (<1ms local)
- **Request/reply** patterns
- **Distributed queuing**
- **JetStream** persistence
- **Smaller footprint** (15MB)
- **No broker** configuration

### How does discovery work?

1. Device broadcasts mDNS announcement
2. Hub discovers and records in registry
3. Device subscribes to command topics
4. Hub can now send commands

No manual configuration required!

### Can I use multiple hubs?

Yes! Tafy Studio supports:

- **Multi-hub** coordination
- **Hub failover** (with JetStream)
- **Federated** deployments
- **Edge/cloud** hybrid

## Troubleshooting

### "WebSerial not supported" error

WebSerial requires:

- **Chrome/Edge** 89+ browser
- **HTTPS** or localhost connection
- **User gesture** to initiate

Alternatives:

- Use Tafy CLI: `tafy device flash`
- Flash via PlatformIO directly

### High latency between command and action

Check:

1. **Network latency**: `ping <device-ip>`
2. **NATS latency**: View in metrics
3. **Processing delay**: Check device CPU usage
4. **Message rate**: You may be overwhelming the device

Optimizations:

- Use wired connection for hub
- Dedicate WiFi network for robots
- Reduce message frequency
- Enable NATS clustering

### Device keeps disconnecting

Common fixes:

1. **Power issues**: Ensure stable power supply
2. **WiFi stability**: Use 2.4GHz, not 5GHz
3. **Memory leaks**: Update firmware
4. **Interference**: Change WiFi channel

### Flow works in simulation but not on robot

Verify:

1. **Capabilities match**: Robot has required sensors/actuators
2. **Message formats**: Check HAL schema versions
3. **Timing assumptions**: Real hardware has delays
4. **Resource limits**: ESP32 has less memory than simulator

## Best Practices

### Should I use visual programming or write code?

- **Visual programming** for:
  - Robot behaviors
  - Quick prototypes
  - Teaching/learning
  - Non-programmers

- **Code** for:
  - Custom drivers
  - Complex algorithms
  - Performance critical
  - Unit testing

### How should I structure complex behaviors?

1. **Hierarchical flows**: Main flow calls sub-flows
2. **State machines**: Use Node-RED state nodes
3. **Modular behaviors**: One flow per behavior
4. **Parameterized**: Use environment variables

### What's the best practice for multi-robot coordination?

- Use **robot groups** in topics: `hal.v1.group.swarm1.cmd`
- Implement **leader election** via NATS
- Share **world model** via JetStream KV
- Handle **partial failures** gracefully

### How do I ensure reliable operation?

1. **Heartbeats**: Monitor device health
2. **Timeouts**: On all commands
3. **Fallbacks**: Safe behaviors on failure
4. **Monitoring**: Use Prometheus/Grafana
5. **Testing**: HIL tests before deployment

## Performance

### How many robots can one hub handle?

Typical performance:

- **10-20 robots**: Raspberry Pi 4
- **50-100 robots**: Intel NUC
- **100+ robots**: Server hardware

Factors:

- Message rate
- Flow complexity  
- Vision processing
- Network bandwidth

### What latency should I expect?

Local network:

- **NATS pub/sub**: <1ms
- **HAL command→action**: 5-20ms
- **Vision processing**: 30-100ms
- **End-to-end teleop**: 50-150ms

### How do I optimize for lower latency?

1. **Network**: Dedicated WiFi, wired hub
2. **Messages**: Smaller, less frequent
3. **Processing**: Move compute to edge
4. **Architecture**: Minimize hops

## Security

### Is Tafy Studio secure for production use?

Default installation is for development. For production:

1. Enable authentication
2. Use TLS for NATS
3. Implement RBAC
4. Network isolation
5. Regular updates

See [Security Guide](./SECURITY.md) for hardening steps.

### How do I update Tafy Studio?

```bash
# Update system
tafy update

# Update specific component
tafy update hub-api

# Update drivers
tafy driver update --all
```

### Can I use Tafy Studio in competitions?

Yes! Tafy Studio is suitable for:

- FIRST Robotics
- RoboCup
- University projects
- Hackathons

Check competition rules regarding:

- Wireless communication
- Remote control
- Open source requirements

## Community

### How can I contribute?

We welcome contributions! See [CONTRIBUTING.md](../CONTRIBUTING.md) for:

- Code contributions
- Documentation improvements
- Bug reports
- Feature requests
- Community support

### Where can I get help?

- **Documentation**: <https://docs.tafy.studio>
- **Discord**: <https://discord.gg/tafy>
- **GitHub Discussions**: <https://github.com/tafystudio/tafystudio/discussions>
- **Stack Overflow**: Tag with `tafy-studio`

### Are there example projects?

Yes! Check out:

- [Official examples](https://github.com/tafystudio/examples)
- [Community showcase](https://showcase.tafy.studio)
- [Tutorial videos](https://youtube.com/tafystudio)

### Is commercial support available?

Yes, Tafy Labs offers:

- Enterprise support contracts
- Custom development
- Training workshops
- Certification programs

Contact: <support@tafy.studio>

## Future

### What's on the roadmap?

Near term:

- ROS 2 compatibility layer
- Simulation environments
- Mobile app
- Cloud deployment

Long term:

- AI behavior generation
- Multi-robot SLAM
- Swarm coordination
- Digital twin support

See [Public Roadmap](https://github.com/tafystudio/tafystudio/projects/1)

### Will Tafy Studio support my specific hardware?

If it can run Linux or has WiFi/serial, probably yes! File a [feature request](https://github.com/tafystudio/tafystudio/issues/new?template=feature_request.md) with:

- Hardware specifications
- Communication interface
- Use case description

### Can I use Tafy Studio for commercial products?

Yes! Apache 2.0 license allows commercial use. We'd love to hear about your products - email us at <showcase@tafy.studio> to be featured.

---

Didn't find your answer? Ask on [Discord](https://discord.gg/tafy) or [open an issue](https://github.com/tafystudio/tafystudio/issues/new?template=question.md)!
