'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';

interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'discovered' | 'claimed';
  ipAddress: string;
  capabilities: string[];
}

const mockDevices: Device[] = [
  {
    id: 'esp32-001',
    name: 'Robot ESP32',
    type: 'ESP32',
    status: 'online',
    ipAddress: '192.168.1.100',
    capabilities: ['motor.differential', 'sensor.range'],
  },
  {
    id: 'pi-001',
    name: 'Vision Pi',
    type: 'Raspberry Pi 4',
    status: 'discovered',
    ipAddress: '192.168.1.101',
    capabilities: ['camera.rgb', 'compute.vision'],
  },
];

export default function DevicesPage() {
  const [devices] = useState<Device[]>(mockDevices);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-tafy-900">Devices</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => (window.location.href = '/devices/flash')}
          >
            Flash Firmware
          </Button>
          <Button variant="primary">Scan for Devices</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <Card key={device.id} className="relative">
            <div className="absolute top-4 right-4">
              <StatusBadge status={device.status} />
            </div>

            <h3 className="text-xl font-semibold text-tafy-800 mb-2">
              {device.name}
            </h3>

            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">Type:</span> {device.type}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">IP:</span> {device.ipAddress}
              </p>
              <div>
                <span className="font-medium text-gray-600">Capabilities:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {device.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="inline-block px-2 py-1 text-xs bg-tafy-100 text-tafy-700 rounded"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {device.status === 'discovered' ? (
                <Button variant="primary" size="sm" className="flex-1">
                  Claim Device
                </Button>
              ) : (
                <>
                  <Button variant="secondary" size="sm" className="flex-1">
                    Configure
                  </Button>
                  <Button variant="ghost" size="sm">
                    Test
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}

        {/* Empty state card */}
        <Card className="border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No more devices found</p>
            <Button variant="ghost" size="sm">
              Add Manual Device
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
