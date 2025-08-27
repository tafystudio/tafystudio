# Known Issues and Limitations

This document tracks confirmed issues, limitations, and planned features that are not yet implemented in Tafy Studio.

## Table of Contents

- [Confirmed Issues](#confirmed-issues)
- [Missing Features](#missing-features)
- [Planned But Not Implemented](#planned-but-not-implemented)

## Confirmed Issues

### WebSerial API

#### Issue: WebSerial requires specific browser and connection type

- **Affected**: ESP32 flashing via web UI
- **Symptoms**: "WebSerial not supported" error
- **Root Cause**: WebSerial API only available in Chrome/Edge 89+ over HTTPS or localhost
- **Workaround**:
  - Use Chrome or Edge browser
  - Access via https:// or <http://localhost>
  - Alternative: Use CLI flashing with `esptool.py`

### TypeScript Type Warnings

#### Issue: TypeScript any type warnings in WebSerialFlasher

- **Location**: `components/flasher/WebSerialFlasher.tsx` lines 111, 151, 224, 250
- **Symptoms**: ESLint warnings about `@typescript-eslint/no-explicit-any`
- **Root Cause**: WebSerial API lacks proper TypeScript definitions
- **Status**: Low priority - functional but needs type improvements

## Missing Features

### Authentication

#### No Authentication in Default Installation

- **Impact**: API endpoints are unprotected
- **Current State**: Development mode only
- **Required For**: Production deployment
- **Planned Solution**: JWT-based auth with configurable providers

### Device Discovery Limitations

#### mDNS Discovery Single Network Only

- **Current Behavior**: Devices must be on same subnet as hub
- **Impact**: Cannot discover devices across VLANs
- **Planned Solution**: Optional discovery proxy service

### Testing Infrastructure

#### No Automated Installation Tests

- **Current State**: Manual testing only
- **Impact**: Installation issues not caught automatically
- **Planned**: Full installation test suite

## Planned But Not Implemented

### ROS 2 Integration

**Status**: Architecture designed in checklist, zero implementation

- No code written yet
- No ROS 2 bridge
- No message translation
- No compatibility layer

See `.internal/docs/technical/IMPLEMENTATION_CHECKLIST.md` lines 477-566 for detailed plan.

### Record & Playback System

**Status**: Partially specified in checklist, minimal implementation

- NATS JetStream can persist messages (configuration exists)
- No UI for recording management
- No playback controls
- No synchronization mechanism
- No MCAP export/import

See `.internal/docs/technical/IMPLEMENTATION_CHECKLIST.md` lines 585-676 for detailed plan.

### Missing Drivers

The following drivers are specified but not implemented:

- Servo driver
- IMU driver (MPU6050)
- Ultrasonic driver (HC-SR04)
- GPS driver
- LED strip driver
- Button/switch driver
- Temperature sensor driver
- Battery monitor driver

Only implemented drivers:

- Motor PWM driver (basic differential drive)
- Camera USB driver
- ToF sensor (partial implementation)

### System Images

**Status**: Not implemented

- No Raspberry Pi images
- No Jetson images
- No pre-configured SD card images
- Installation requires manual setup

### Monitoring & Observability

**Status**: Not implemented

- No Prometheus metrics
- No Grafana dashboards
- No distributed tracing
- No centralized logging

## Reporting New Issues

Found a bug? Please report it:

1. **GitHub Issues**: <https://github.com/tafystudio/tafystudio/issues>
2. **Discord**: #bugs channel

Include:

- Tafy Studio version
- Hardware details
- Steps to reproduce
- Error messages/logs

---

Last updated: 2024-03-14
