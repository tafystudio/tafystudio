# Quick Start Guide

Welcome to Tafy Studio! This guide will help you get a robot up and running in 30 minutes or less.

## Prerequisites

Before you begin, ensure you have:

- A computer running macOS, Linux, or Windows with WSL2
- Docker installed and running
- At least one robot hardware platform (ESP32, Raspberry Pi, etc.)
- Basic familiarity with command-line tools

## Installation

The easiest way to get started is using our installation script:

```bash
curl -fsSL https://get.tafy.sh | bash
```

This will:

1. Install the Tafy CLI tool
2. Set up required dependencies
3. Configure your system for robot development

## Your First Robot

### Step 1: Initialize a New Robot Project

```bash
tafy init my-first-robot
cd my-first-robot
```

This creates a new robot project with:

- Pre-configured Node-RED flows
- Example hardware configurations
- Basic teleoperation setup

### Step 2: Flash Your Hardware

Connect your ESP32 or other supported microcontroller:

```bash
# Auto-detect connected hardware
tafy hardware detect

# Flash the firmware
tafy hardware flash
```

### Step 3: Start the Hub

Launch the Tafy Studio hub on your development machine:

```bash
tafy hub start
```

This starts:

- The web UI at <http://localhost:3000>
- Node-RED at <http://localhost:1880>
- NATS messaging at localhost:4222

### Step 4: Connect Your Robot

Power on your robot hardware. It will automatically:

1. Connect to your network
2. Discover the hub
3. Register its capabilities
4. Appear in the web UI

### Step 5: Test Movement

Open the web UI and:

1. Click on your robot in the device list
2. Select "Teleoperation" mode
3. Use WASD keys or gamepad to control

🎉 **Congratulations!** You have a working robot!

## Next Steps

### Customize Your Robot

- **Add Sensors**: Edit flows in Node-RED to process sensor data
- **Create Behaviors**: Build autonomous behaviors using visual programming
- **Configure Hardware**: Modify HAL mappings for your specific setup

### Learn More

- [Architecture Overview](./ARCHITECTURE.md) - Understand the system design
- [Core Concepts](./CONCEPTS.md) - Learn key terminology
- [Development Setup](./DEVELOPMENT_SETUP.md) - Set up for contributing

### Join the Community

- [GitHub Discussions](https://github.com/tafystudio/tafystudio/discussions) - Ask questions and share ideas
- [Discord Server](https://discord.gg/bVBcJ8ZJrK) - Real-time chat with the community
- Video tutorials and demos coming soon

## Troubleshooting

### Robot Not Appearing in UI

1. Check that both devices are on the same network
2. Verify NATS is running: `tafy hub status`
3. Check robot logs: `tafy logs <robot-name>`

### Connection Issues

- Ensure firewall allows ports 3000, 4222, 1880
- Try manual connection: `tafy connect <hub-ip>`
- Check network isolation settings

### Hardware Not Detected

- Install drivers for your platform
- Try different USB ports/cables
- Run with elevated permissions if needed

## Getting Help

If you encounter issues:

1. Check the [troubleshooting guide](./TROUBLESHOOTING.md)
2. Search existing [GitHub issues](https://github.com/tafystudio/tafystudio/issues)
3. Ask in [Discussions](https://github.com/tafystudio/tafystudio/discussions)
4. Report bugs via [GitHub Issues](https://github.com/tafystudio/tafystudio/issues/new)

Remember: The goal is to get you moving in 30 minutes. If it takes longer, we want to hear about it so we can improve!
