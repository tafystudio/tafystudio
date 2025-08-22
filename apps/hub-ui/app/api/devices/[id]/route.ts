import { NextRequest, NextResponse } from 'next/server';

// Mock device data
const mockDevices = {
  'esp32-001': {
    id: 'esp32-001',
    name: 'Robot ESP32',
    type: 'ESP32',
    status: 'online',
    claimed: true,
    capabilities: ['motor.differential:v1.0', 'sensor.range-tof:v1.0'],
    ip_address: '192.168.1.100',
    last_seen: new Date().toISOString(),
    config: {
      pins: {
        motor: {
          left: { pwm: 25, dir: 26 },
          right: { pwm: 27, dir: 14 },
        },
        sensors: {
          tof: { sda: 21, scl: 22, address: '0x29' },
        },
      },
      network: {
        hostname: 'tafy-esp32-001',
        mdns_enabled: true,
      },
      telemetry: {
        interval_ms: 100,
        topics: ['motors', 'sensors'],
      },
    },
  },
  'pi-001': {
    id: 'pi-001',
    name: 'Vision Pi',
    type: 'Raspberry Pi 4',
    status: 'online',
    claimed: true,
    capabilities: ['camera.rgb:v1.0', 'compute.vision:v1.0'],
    ip_address: '192.168.1.101',
    last_seen: new Date().toISOString(),
    config: {
      pins: {},
      network: {
        hostname: 'tafy-pi-001',
        mdns_enabled: true,
      },
      telemetry: {
        interval_ms: 1000,
        topics: ['system', 'camera'],
      },
    },
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const device = mockDevices[id as keyof typeof mockDevices];

  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  return NextResponse.json(device);
}
