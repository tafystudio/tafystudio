'use client';

import dynamic from 'next/dynamic';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';

// Dynamically import WebSerialFlasher to avoid SSR issues with navigator.serial
const WebSerialFlasher = dynamic(
  () => import('@/components/flasher/WebSerialFlasher'),
  {
    ssr: false,
    loading: () => (
      <Card className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </Card>
    ),
  }
);

export default function FlashPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-tafy-900 mb-2">
            Flash Firmware
          </h1>
          <p className="text-gray-600">
            Flash Tafy firmware to your ESP32 devices directly from the browser
          </p>
        </div>

        <div className="mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Before you begin:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Connect your ESP32 to this computer via USB</li>
                  <li>Ensure you have the correct USB drivers installed</li>
                  <li>
                    Your browser must support WebSerial (Chrome, Edge, Opera)
                  </li>
                  <li>The device will restart automatically after flashing</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <WebSerialFlasher />

        <div className="mt-8">
          <Card title="Troubleshooting" icon="🔧">
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-gray-700">
                  Device not showing up?
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-1">
                  <li>Check USB cable (must be data cable, not charge-only)</li>
                  <li>Install CP2102/CH340 drivers for your OS</li>
                  <li>Try a different USB port</li>
                  <li>Hold BOOT button while connecting on some boards</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-gray-700">Flash failing?</p>
                <ul className="list-disc list-inside text-gray-600 mt-1">
                  <li>Ensure no other program is using the serial port</li>
                  <li>Try lowering baud rate in advanced settings</li>
                  <li>Some boards need BOOT button held during erase</li>
                  <li>Check that you selected the correct firmware</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-gray-700">After flashing:</p>
                <ul className="list-disc list-inside text-gray-600 mt-1">
                  <li>Device will restart and connect to your network</li>
                  <li>Look for the device in the Devices page</li>
                  <li>Device will advertise via mDNS as tafy-esp32-XXXX</li>
                  <li>Default credentials are in the firmware documentation</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
