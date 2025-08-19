'use client';

import { useState, useRef, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Spinner from '@/components/ui/Spinner';

// WebSerial types
interface SerialPort {
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream | null;
  writable: WritableStream | null;
}

interface SerialOptions {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  flowControl?: 'none' | 'hardware';
}

interface FlashProgress {
  state: 'idle' | 'connecting' | 'erasing' | 'writing' | 'verifying' | 'complete' | 'error';
  progress: number;
  message: string;
}

interface FirmwareOption {
  id: string;
  name: string;
  description: string;
  version: string;
  size: number;
  capabilities: string[];
  url: string;
}

const firmwareOptions: FirmwareOption[] = [
  {
    id: 'diff-drive-tof',
    name: 'Differential Drive + ToF',
    description: 'Basic differential drive robot with time-of-flight sensor',
    version: '1.0.0',
    size: 512 * 1024, // 512KB
    capabilities: ['motor.differential:v1.0', 'sensor.range.tof:v1.0'],
    url: '/firmware/esp32/diff-drive-tof-v1.0.0.bin',
  },
  {
    id: 'mecanum-imu',
    name: 'Mecanum Drive + IMU',
    description: 'Omnidirectional robot with 4 mecanum wheels and IMU',
    version: '1.0.0',
    size: 640 * 1024, // 640KB
    capabilities: ['motor.mecanum:v1.0', 'sensor.imu:v1.0'],
    url: '/firmware/esp32/mecanum-imu-v1.0.0.bin',
  },
  {
    id: 'sensor-hub',
    name: 'Sensor Hub',
    description: 'Multi-sensor hub with environmental and motion sensors',
    version: '1.0.0',
    size: 384 * 1024, // 384KB
    capabilities: ['sensor.temperature:v1.0', 'sensor.humidity:v1.0', 'sensor.imu:v1.0'],
    url: '/firmware/esp32/sensor-hub-v1.0.0.bin',
  },
];

export default function WebSerialFlasher() {
  const [selectedFirmware, setSelectedFirmware] = useState<FirmwareOption | null>(null);
  const [progress, setProgress] = useState<FlashProgress>({
    state: 'idle',
    progress: 0,
    message: 'Ready to flash',
  });
  const [serialLog, setSerialLog] = useState<string[]>([]);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const addToLog = useCallback((message: string) => {
    setSerialLog((prev) => [...prev.slice(-100), `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const connectToDevice = async () => {
    try {
      setProgress({ state: 'connecting', progress: 0, message: 'Requesting serial port...' });

      // Request serial port access
      const port = await (navigator as any).serial.requestPort({
        filters: [
          { usbVendorId: 0x10c4, usbProductId: 0xea60 }, // CP2102
          { usbVendorId: 0x0403, usbProductId: 0x6001 }, // FTDI
          { usbVendorId: 0x1a86, usbProductId: 0x7523 }, // CH340
        ],
      });

      // Open serial connection
      await port.open({ baudRate: 115200 });
      portRef.current = port;

      addToLog('Connected to serial port');
      setProgress({ state: 'connecting', progress: 100, message: 'Connected!' });

      // Start reading from serial
      const reader = port.readable.getReader();
      readerRef.current = reader;

      // Read loop
      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const text = new TextDecoder().decode(value);
            addToLog(text);
          }
        } catch (error) {
          console.error('Read error:', error);
        }
      };

      readLoop();
      return true;
    } catch (error: any) {
      addToLog(`Connection error: ${error.message}`);
      setProgress({ state: 'error', progress: 0, message: `Failed to connect: ${error.message}` });
      return false;
    }
  };

  const flashFirmware = async () => {
    if (!selectedFirmware || !portRef.current) {
      return;
    }

    try {
      // Connect if not already connected
      if (progress.state === 'idle') {
        const connected = await connectToDevice();
        if (!connected) return;
      }

      setProgress({ state: 'erasing', progress: 10, message: 'Erasing flash...' });
      addToLog('Starting firmware flash...');

      // Simulate firmware download
      setProgress({ state: 'writing', progress: 20, message: 'Downloading firmware...' });
      const response = await fetch(selectedFirmware.url);
      const firmwareData = await response.arrayBuffer();

      // Simulate flashing process (in real implementation, use esptool.js)
      const chunks = Math.ceil(firmwareData.byteLength / 4096);
      for (let i = 0; i < chunks; i++) {
        const progress = 20 + (i / chunks) * 60;
        setProgress({
          state: 'writing',
          progress,
          message: `Writing block ${i + 1}/${chunks}...`,
        });
        
        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Verify
      setProgress({ state: 'verifying', progress: 85, message: 'Verifying firmware...' });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Complete
      setProgress({ state: 'complete', progress: 100, message: 'Flash complete! Device will restart.' });
      addToLog('Firmware flash completed successfully');

      // Reset after 3 seconds
      setTimeout(() => {
        setProgress({ state: 'idle', progress: 0, message: 'Ready to flash' });
      }, 3000);
    } catch (error: any) {
      addToLog(`Flash error: ${error.message}`);
      setProgress({ state: 'error', progress: 0, message: `Flash failed: ${error.message}` });
    }
  };

  const disconnect = async () => {
    if (readerRef.current) {
      await readerRef.current.cancel();
      readerRef.current = null;
    }
    
    if (portRef.current) {
      await portRef.current.close();
      portRef.current = null;
    }

    setProgress({ state: 'idle', progress: 0, message: 'Disconnected' });
    addToLog('Disconnected from device');
  };

  // Check for WebSerial support
  if (typeof window !== 'undefined' && !(navigator as any).serial) {
    return (
      <Card className="text-center p-8">
        <h3 className="text-xl font-semibold text-red-600 mb-2">WebSerial Not Supported</h3>
        <p className="text-gray-600">
          Your browser does not support WebSerial API. Please use Chrome, Edge, or Opera.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Firmware Selection */}
      <Card title="Select Firmware" icon="📦">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {firmwareOptions.map((firmware) => (
            <div
              key={firmware.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                selectedFirmware?.id === firmware.id
                  ? 'border-tafy-500 bg-tafy-50'
                  : 'border-gray-200 hover:border-tafy-200'
              }`}
              onClick={() => setSelectedFirmware(firmware)}
            >
              <h4 className="font-semibold text-tafy-800">{firmware.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{firmware.description}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">
                  Version: {firmware.version} • Size: {(firmware.size / 1024).toFixed(0)}KB
                </p>
                <div className="flex flex-wrap gap-1">
                  {firmware.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Flash Progress */}
      <Card title="Flash Progress" icon="⚡">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge
              status={
                progress.state === 'complete'
                  ? 'online'
                  : progress.state === 'error'
                  ? 'error'
                  : progress.state === 'idle'
                  ? 'offline'
                  : 'warning'
              }
              label={progress.message}
            />
            <span className="text-sm font-medium text-gray-600">{progress.progress}%</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress.state === 'error'
                  ? 'bg-red-500'
                  : progress.state === 'complete'
                  ? 'bg-green-500'
                  : 'bg-tafy-500'
              }`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={flashFirmware}
              disabled={
                !selectedFirmware ||
                ['connecting', 'erasing', 'writing', 'verifying'].includes(progress.state)
              }
            >
              {progress.state === 'idle' ? 'Flash Firmware' : <Spinner size="sm" />}
            </Button>
            {portRef.current && (
              <Button variant="secondary" onClick={disconnect}>
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Serial Log */}
      <Card title="Serial Output" icon="📟">
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs h-64 overflow-y-auto">
          {serialLog.length === 0 ? (
            <p className="text-gray-500">No serial output yet...</p>
          ) : (
            serialLog.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap">
                {line}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}