'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  return (
    <div className="bg-gradient-to-b from-tafy-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-tafy-900 mb-4">
            Welcome to Tafy Studio
          </h1>
          <p className="text-xl text-tafy-700">
            Go from blank hardware to moving robot in 30 minutes
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Devices</p>
                <p className="text-2xl font-bold text-tafy-800">0</p>
              </div>
              <StatusBadge status="offline" label="No devices" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Running Flows</p>
                <p className="text-2xl font-bold text-tafy-800">0</p>
              </div>
              <StatusBadge status="warning" label="None active" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Cluster Health</p>
                <p className="text-2xl font-bold text-tafy-800">100%</p>
              </div>
              <StatusBadge status="online" label="Healthy" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">NATS Status</p>
                <p className="text-2xl font-bold text-tafy-800">Connected</p>
              </div>
              <StatusBadge status="online" />
            </div>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card
            title="Devices"
            icon="🤖"
            className="hover:border-tafy-200 border-2 border-transparent"
            onClick={() => router.push('/devices')}
          >
            <p className="text-gray-600 mb-4">
              Discover and manage connected robots and sensors
            </p>
            <Button variant="primary" size="sm">
              Manage Devices
            </Button>
          </Card>

          <Card
            title="Flows"
            icon="📊"
            className="hover:border-tafy-200 border-2 border-transparent"
            onClick={() => router.push('/flows')}
          >
            <p className="text-gray-600 mb-4">
              Create and deploy visual robot behaviors
            </p>
            <Button variant="primary" size="sm">
              Create Flow
            </Button>
          </Card>

          <Card
            title="System"
            icon="🔧"
            className="hover:border-tafy-200 border-2 border-transparent"
            onClick={() => router.push('/system')}
          >
            <p className="text-gray-600 mb-4">
              Monitor health and configure your cluster
            </p>
            <Button variant="primary" size="sm">
              View System
            </Button>
          </Card>
        </div>

        {/* Getting Started */}
        <div className="mt-16 max-w-2xl mx-auto">
          <Card title="Quick Start" icon="🚀">
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Connect your first device (ESP32, Raspberry Pi, etc.)</li>
              <li>Device will auto-discover and appear in the Devices page</li>
              <li>Create a simple flow in Node-RED</li>
              <li>Deploy to your device and watch it move!</li>
            </ol>
            <div className="mt-4">
              <Button variant="ghost" onClick={() => router.push('/docs')}>
                View Documentation →
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
