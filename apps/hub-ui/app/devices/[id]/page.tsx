'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Spinner from '@/components/ui/Spinner';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface DeviceConfig {
  pins: {
    motor?: {
      left: { pwm: number; dir: number };
      right: { pwm: number; dir: number };
    };
    sensors?: {
      tof?: { sda: number; scl: number; address: string };
      ultrasonic?: { trigger: number; echo: number };
    };
  };
  network: {
    hostname: string;
    mdns_enabled: boolean;
  };
  telemetry: {
    interval_ms: number;
    topics: string[];
  };
}

interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'configuring';
  claimed: boolean;
  capabilities: string[];
  config: DeviceConfig;
  ip_address?: string;
  last_seen: string;
}

export default function DeviceConfigPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = params.id as string;

  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DeviceConfig | null>(null);

  useEffect(() => {
    fetchDevice();
  }, [deviceId]);

  const fetchDevice = async () => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`);
      if (!response.ok) throw new Error('Device not found');
      const data = await response.json();
      setDevice(data);
      setConfig(data.config);
    } catch (error) {
      console.error('Failed to fetch device:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/devices/${deviceId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      // Refresh device data
      await fetchDevice();
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!device || !config) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center p-8">
          <p className="text-gray-600">Device not found</p>
          <Button onClick={() => router.push('/devices')} className="mt-4">
            Back to Devices
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/devices')}
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Back
          </Button>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-tafy-900">
              {device.name || device.id}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={device.status} />
              <span className="text-gray-600">{device.type}</span>
              {device.ip_address && (
                <span className="text-sm text-gray-500">
                  {device.ip_address}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Device Info */}
        <Card title="Device Information" className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Device ID</p>
              <p className="font-mono">{device.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Seen</p>
              <p>{new Date(device.last_seen).toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600 mb-1">Capabilities</p>
              <div className="flex flex-wrap gap-2">
                {device.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Pin Configuration */}
        {device.capabilities.some((cap) => cap.startsWith('motor.')) && (
          <Card title="Motor Configuration" icon="🔧" className="mb-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Left Motor</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      PWM Pin
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={config.pins.motor?.left.pwm || 25}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pins: {
                            ...config.pins,
                            motor: {
                              ...config.pins.motor!,
                              left: {
                                ...config.pins.motor!.left,
                                pwm: parseInt(e.target.value),
                              },
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Direction Pin
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={config.pins.motor?.left.dir || 26}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pins: {
                            ...config.pins,
                            motor: {
                              ...config.pins.motor!,
                              left: {
                                ...config.pins.motor!.left,
                                dir: parseInt(e.target.value),
                              },
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Right Motor</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      PWM Pin
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={config.pins.motor?.right.pwm || 27}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pins: {
                            ...config.pins,
                            motor: {
                              ...config.pins.motor!,
                              right: {
                                ...config.pins.motor!.right,
                                pwm: parseInt(e.target.value),
                              },
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Direction Pin
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={config.pins.motor?.right.dir || 14}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pins: {
                            ...config.pins,
                            motor: {
                              ...config.pins.motor!,
                              right: {
                                ...config.pins.motor!.right,
                                dir: parseInt(e.target.value),
                              },
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Network Configuration */}
        <Card title="Network Configuration" icon="🌐" className="mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Hostname
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                value={config.network.hostname}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    network: {
                      ...config.network,
                      hostname: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="mdns"
                checked={config.network.mdns_enabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    network: {
                      ...config.network,
                      mdns_enabled: e.target.checked,
                    },
                  })
                }
              />
              <label htmlFor="mdns" className="text-sm">
                Enable mDNS advertisement
              </label>
            </div>
          </div>
        </Card>

        {/* Telemetry Configuration */}
        <Card title="Telemetry Configuration" icon="📊" className="mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Update Interval (ms)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-lg"
                value={config.telemetry.interval_ms}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    telemetry: {
                      ...config.telemetry,
                      interval_ms: parseInt(e.target.value),
                    },
                  })
                }
                min="100"
                max="10000"
                step="100"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Enabled Topics
              </label>
              <div className="space-y-2">
                {['battery', 'motors', 'sensors', 'system'].map((topic) => (
                  <label key={topic} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.telemetry.topics.includes(topic)}
                      onChange={(e) => {
                        const topics = e.target.checked
                          ? [...config.telemetry.topics, topic]
                          : config.telemetry.topics.filter((t) => t !== topic);
                        setConfig({
                          ...config,
                          telemetry: {
                            ...config.telemetry,
                            topics,
                          },
                        });
                      }}
                    />
                    <span className="text-sm">{topic}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setConfig(device.config)}
            disabled={saving}
          >
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size="sm" className="mr-2" /> : null}
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
