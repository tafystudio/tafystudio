# ESP32 Firmware Flashing Guide

This guide covers flashing Tafy firmware to ESP32 devices using the WebSerial flasher.

## Prerequisites

### Hardware

- ESP32 development board (ESP32, ESP32-S2, ESP32-S3, ESP32-C3)
- USB cable (must be data cable, not charge-only)
- Computer with Chrome, Edge, or Opera browser

### Software

- USB drivers installed:
  - **CP210x**: [Silicon Labs drivers](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)
  - **CH340**: [WCH drivers](http://www.wch-ic.com/downloads/CH341SER_ZIP.html)
  - **FTDI**: Usually included with OS

## Flashing Process

### 1. Connect ESP32

1. Connect ESP32 to computer via USB
2. Verify connection:
   - **Windows**: Check Device Manager for COM port
   - **macOS**: Run `ls /dev/tty.usbserial-*`
   - **Linux**: Run `ls /dev/ttyUSB*`

### 2. Access Flasher

Navigate to the Tafy Hub UI flasher:

```text
http://localhost:3000/devices/flash
```

Or on deployed instance:

```text
http://tafy.local/devices/flash
```

### 3. Select Firmware

Choose appropriate firmware for your robot:

- **Basic Differential Drive**: 2-wheel differential drive robots
- **Mecanum Drive**: 4-wheel omnidirectional robots
- **Sensor Node**: Dedicated sensor-only nodes
- **Camera Node**: ESP32-CAM modules

### 4. Flash Process

1. Click **"Connect Device"**
2. Select your ESP32 from the browser prompt
3. Click **"Flash Firmware"**
4. Monitor progress (typically 30-60 seconds)
5. Device will restart automatically

## Firmware Variants

### Basic Differential Drive

- **Capabilities**: `motor.differential:v1.0`, `sensor.range-tof:v1.0`
- **Pins**:
  - Motor A: GPIO 25 (PWM), GPIO 26 (DIR)
  - Motor B: GPIO 27 (PWM), GPIO 14 (DIR)
  - ToF Sensor: GPIO 21 (SDA), GPIO 22 (SCL)

### Mecanum Drive

- **Capabilities**: `motor.mecanum:v1.0`, `sensor.imu:v1.0`
- **Pins**:
  - Front Left: GPIO 25, 26
  - Front Right: GPIO 27, 14
  - Rear Left: GPIO 32, 33
  - Rear Right: GPIO 18, 19
  - IMU: I2C on GPIO 21, 22

### Sensor Node

- **Capabilities**: `sensor.range-tof:v1.0`, `sensor.range-ultrasonic:v1.0`
- **Flexible pin configuration via web UI**

### Camera Node (ESP32-CAM)

- **Capabilities**: `camera.mjpeg:v1.0`, `light.led:v1.0`
- **Camera**: OV2640 on standard ESP32-CAM pins
- **Flash LED**: GPIO 4

## First Boot Configuration

After flashing, the device will:

1. Create WiFi AP: `tafy-esp32-XXXX`
2. Default password: `tafyrobot`
3. Connect to `http://192.168.4.1` for configuration
4. Enter your WiFi credentials
5. Device restarts and connects to network

## Troubleshooting

### Device Not Detected

1. **Wrong cable**: Ensure using data cable, not charge-only
2. **Missing drivers**: Install appropriate USB-UART drivers
3. **Permission issues (Linux)**:

   ```bash
   sudo usermod -a -G dialout $USER
   # Logout and login again
   ```

### Flash Failing

1. **Hold BOOT button**: Some boards need BOOT pressed during connection
2. **Lower baud rate**: Try 115200 instead of 921600
3. **Close other programs**: Ensure no serial monitor is using the port
4. **Try different USB port**: Some USB 3.0 ports have issues

### After Flashing

1. **Device not appearing**: Check WiFi configuration
2. **mDNS not working**: Ensure on same network/VLAN
3. **Connection drops**: Check power supply (500mA minimum)

## Advanced Options

### Custom Firmware

Build custom firmware:

```bash
cd firmware/esp32
pio run -e differential-drive
```

### Serial Console

Monitor device output:

```bash
# Using PlatformIO
pio device monitor -b 115200

# Using screen
screen /dev/ttyUSB0 115200

# Using minicom
minicom -D /dev/ttyUSB0 -b 115200
```

### Manual Flashing (CLI)

Using esptool:

```bash
esptool.py --chip esp32 --port /dev/ttyUSB0 --baud 921600 \
  write_flash -z 0x1000 bootloader.bin \
  0x8000 partitions.bin \
  0x10000 firmware.bin
```

## Pin Reference

### Standard ESP32 DevKit

```text
Motor PWM capable: 25, 26, 27, 14, 12, 13, 32, 33
I2C Default: SDA=21, SCL=22
SPI Default: MOSI=23, MISO=19, SCLK=18, CS=5
UART2: TX=17, RX=16
ADC: 32-39 (ADC1), 0,2,4,12-15,25-27 (ADC2)
```

### ESP32-S3

```text
Motor PWM: Any GPIO
I2C Default: SDA=8, SCL=9
USB: D-=19, D+=20
```

## Safety Notes

- Always verify pin assignments before connecting motors
- Use appropriate motor drivers (L298N, TB6612, etc.)
- Include flyback diodes for motor protection
- Test with low voltage first (5V)
- Monitor current draw, ESP32 GPIO max: 12mA

## Next Steps

After successful flashing:

1. Device appears in Devices page
2. Click device to configure pins and capabilities
3. Create flows in Node-RED
4. Test with manual control
5. Build autonomous behaviors

## Related Documentation

- [Device Configuration Guide](./DEVICE_CONFIG.md)
- [HAL Message Reference](./HAL_SPEC.md)
- [Node-RED Flow Examples](./FLOW_EXAMPLES.md)
