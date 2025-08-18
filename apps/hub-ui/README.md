# Hub UI - Tafy Studio Frontend

The Hub UI is the Next.js-based web interface for Tafy Studio, providing an
intuitive dashboard for robot fleet management, visual programming, and
real-time monitoring.

## Overview

The Hub UI delivers:

- **Device Management**: Register, configure, and monitor robot nodes
- **Visual Programming**: Integrated Node-RED flow editor
- **Real-time Monitoring**: Live telemetry and system status
- **3D Visualization**: Robot state and sensor visualization
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode**: Built-in theme support

## Features

- Modern React 18 with TypeScript
- Next.js 14 App Router
- Tailwind CSS for styling
- Real-time WebSocket updates
- Integrated Node-RED editor
- 3D visualization with Three.js
- Responsive Material Design
- PWA capabilities

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm package manager
- Hub API running (default: <http://localhost:8000>)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your configuration
```

### Configuration

Key environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_NATS_WS_URL=ws://localhost:8222
NEXT_PUBLIC_NODE_RED_URL=http://localhost:1880
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Run linting
pnpm lint

# Run type checking
pnpm typecheck
```

## Project Structure

```text
hub-ui/
├── app/                    # Next.js app directory
│   ├── (dashboard)/       # Dashboard routes
│   │   ├── devices/       # Device management
│   │   ├── flows/         # Flow editor
│   │   ├── monitoring/    # Real-time monitoring
│   │   └── settings/      # Configuration
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/                # Base UI components
│   ├── devices/           # Device components
│   ├── flows/             # Flow editor components
│   └── monitoring/        # Monitoring components
├── lib/                   # Utility functions
│   ├── api/               # API client
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Helper functions
├── public/                # Static assets
└── styles/                # Global styles
```

## Key Components

### Device Dashboard

- Real-time device status
- Capability discovery
- Configuration management
- Firmware updates

### Flow Editor

- Embedded Node-RED interface
- Custom Tafy nodes
- Flow deployment
- Version control

### Monitoring

- Real-time telemetry graphs
- 3D robot visualization
- Alert management
- Historical data

### Settings

- System configuration
- User management
- Theme preferences
- Export/Import

## UI Components

The project uses a custom component library built on:

- Radix UI primitives
- Tailwind CSS styling
- Framer Motion animations
- Recharts for data visualization
- Three.js for 3D graphics

### Component Examples

```tsx
// Using a device card
import { DeviceCard } from '@/components/devices/device-card';

<DeviceCard
  device={device}
  onConfigure={() => handleConfigure(device.id)}
  showTelemetry
/>;

// Real-time telemetry
import { TelemetryChart } from '@/components/monitoring/telemetry-chart';

<TelemetryChart deviceId={deviceId} metric="cpu_usage" timeRange="1h" />;
```

## State Management

- Server state: TanStack Query (React Query)
- Client state: Zustand for global state
- Form state: React Hook Form
- WebSocket state: Custom hooks

## API Integration

The UI communicates with the Hub API via:

```typescript
// lib/api/client.ts
import { createApiClient } from '@/lib/api';

const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Usage
const devices = await api.devices.list();
const flow = await api.flows.create(flowData);
```

## Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Generate coverage report
pnpm test:coverage
```

## Building

### Development Build

```bash
pnpm dev
```

### Production Build

```bash
# Create optimized build
pnpm build

# Analyze bundle size
pnpm analyze
```

### Docker

```bash
# Build Docker image
docker build -t tafystudio/hub-ui:latest .

# Run container
docker run -d \
  --name hub-ui \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://api:8000 \
  tafystudio/hub-ui:latest
```

## Performance

- Automatic code splitting
- Image optimization
- Font optimization
- Prefetching
- ISR (Incremental Static Regeneration)
- Edge runtime for API routes

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Contributing

See the main project [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Development Tips

1. Use the component library for consistency
2. Follow the established folder structure
3. Write tests for new features
4. Update Storybook for new components
5. Check bundle size impact

## License

Apache 2.0 - See [LICENSE](../../LICENSE) for details.
