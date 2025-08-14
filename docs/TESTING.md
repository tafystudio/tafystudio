# Testing Guide

## Overview

Tafy Studio uses a comprehensive testing strategy across all components to ensure reliability and maintainability. This guide covers our testing approach, tools, and best practices.

## Testing Philosophy

- **Test-Driven Development (TDD)**: Write tests before implementation when possible
- **Fast Feedback**: Unit tests should run in seconds, not minutes
- **Realistic Testing**: Integration tests use real services via Docker Compose
- **Continuous Testing**: All tests run automatically on CI/CD
- **Coverage Goals**: Aim for 80%+ coverage on critical paths

## Quick Start

```bash
# Run all tests
make test

# Run unit tests only
make test-unit

# Run with coverage
make test-coverage

# Run in watch mode
make test-watch
```

## Testing Stack

### Frontend (React/TypeScript)

- **Framework**: Jest
- **Testing Library**: React Testing Library
- **Mocking**: MSW (Mock Service Worker)
- **Coverage**: Built-in Jest coverage

### Backend (Python/FastAPI)

- **Framework**: pytest
- **Async Testing**: pytest-asyncio
- **HTTP Testing**: FastAPI TestClient
- **Coverage**: pytest-cov

### Node Agent (Go)

- **Framework**: Standard library testing
- **Assertions**: testify (optional)
- **Mocking**: gomock or interfaces
- **Coverage**: go test -cover

### Integration Testing

- **Framework**: Jest with custom utilities
- **Services**: Docker Compose
- **NATS Testing**: Real NATS server
- **Timing**: Proper wait strategies

## Unit Testing

### React Components

```typescript
// apps/hub-ui/__tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### FastAPI Endpoints

```python
# apps/hub-api/tests/test_nodes.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_list_nodes():
    """Test listing connected nodes."""
    response = client.get("/api/v1/nodes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

@pytest.mark.asyncio
async def test_node_discovery():
    """Test async node discovery."""
    # Test implementation
    pass
```

### Go Services

```go
// apps/tafyd/discovery/discovery_test.go
package discovery

import (
    "testing"
    "time"
)

func TestNodeDiscovery(t *testing.T) {
    d := NewDiscovery()
    
    // Start discovery
    err := d.Start()
    if err != nil {
        t.Fatalf("Failed to start discovery: %v", err)
    }
    
    // Wait for discovery
    time.Sleep(2 * time.Second)
    
    // Check discovered nodes
    nodes := d.GetNodes()
    if len(nodes) == 0 {
        t.Error("Expected to discover at least one node")
    }
}
```

## Integration Test Examples

### NATS Communication

```javascript
// tests/integration/nats.test.js
const { connect } = require('nats');

describe('NATS Integration', () => {
  let nc;

  beforeAll(async () => {
    nc = await connect({ servers: 'nats://localhost:4222' });
  });

  afterAll(async () => {
    await nc.close();
  });

  test('publish and subscribe to HAL messages', async () => {
    const subject = 'hal.v1.motor.cmd';
    const message = {
      hal_major: 1,
      hal_minor: 0,
      schema: 'tafylabs/hal/motor/differential/1.0',
      device_id: 'test-device',
      payload: { left: 100, right: 100 }
    };

    // Subscribe
    const sub = nc.subscribe(subject);
    
    // Publish
    nc.publish(subject, JSON.stringify(message));

    // Verify
    for await (const msg of sub) {
      const received = JSON.parse(msg.data);
      expect(received.device_id).toBe('test-device');
      break;
    }
  });
});
```

### Service Communication

```python
# tests/integration/test_hub_api_integration.py
import pytest
import httpx
from nats.aio.client import Client as NATS

@pytest.mark.integration
async def test_node_registration_flow():
    """Test complete node registration flow."""
    # Connect to NATS
    nc = NATS()
    await nc.connect("nats://localhost:4222")
    
    # Register node via API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/nodes/register",
            json={
                "node_id": "test-node-123",
                "capabilities": ["motor.differential:v1.0"]
            }
        )
        assert response.status_code == 201
    
    # Verify NATS announcement
    sub = await nc.subscribe("system.node.announce")
    msg = await sub.next_msg(timeout=5)
    assert b"test-node-123" in msg.data
```

## Test Organization

### Directory Structure

```plaintext
apps/
  hub-ui/
    __tests__/          # Jest tests
      components/       # Component tests
      pages/           # Page tests
      utils/           # Utility tests
    jest.config.js     # Jest configuration
  
  hub-api/
    tests/             # pytest tests
      unit/            # Unit tests
      integration/     # Integration tests
    pytest.ini         # pytest configuration
  
  tafyd/
    */                 # Go packages
      *_test.go       # Test files alongside source

tests/
  integration/         # Cross-service integration tests
  e2e/                # End-to-end tests
  hal-compliance/     # HAL compliance tests
```

### Naming Conventions

- **Jest**: `*.test.{ts,tsx,js,jsx}` or `*.spec.{ts,tsx,js,jsx}`
- **pytest**: `test_*.py` or `*_test.py`
- **Go**: `*_test.go`

## Mocking Strategies

### API Mocking (MSW)

```typescript
// apps/hub-ui/__tests__/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/v1/nodes', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 'node-1', name: 'Main Controller' },
        { id: 'node-2', name: 'Motor Driver' }
      ])
    );
  })
];
```

### NATS Mocking

```python
# apps/hub-api/tests/mocks/nats_mock.py
from unittest.mock import AsyncMock, MagicMock

def create_nats_mock():
    nc = AsyncMock()
    nc.connect = AsyncMock()
    nc.publish = AsyncMock()
    nc.subscribe = AsyncMock()
    return nc
```

## Coverage Requirements

### Minimum Coverage Targets

- **Critical Paths**: 80%+
- **Business Logic**: 70%+
- **Utilities**: 60%+
- **UI Components**: 50%+

### Running Coverage Reports

```bash
# All components
make test-coverage

# View HTML coverage reports
open apps/hub-ui/coverage/lcov-report/index.html
open apps/hub-api/htmlcov/index.html
open apps/tafyd/coverage.html
```

## CI/CD Testing

### GitHub Actions Workflow

Tests run automatically on:

- Push to main/develop branches
- Pull requests
- Multiple OS versions (Ubuntu, macOS)
- Multiple language versions

### Test Matrix

```yaml
strategy:
  matrix:
    node-version: [20, 22]
    python-version: ['3.11', '3.12']
    go-version: ['1.23']
    os: [ubuntu-latest, macos-latest]
```

## Performance Testing

### Load Testing

```bash
# Run load tests against API
cd tests/performance
k6 run load-test.js
```

### Benchmark Tests

```go
// apps/tafyd/hal/benchmark_test.go
func BenchmarkMessageParsing(b *testing.B) {
    message := []byte(`{"hal_major":1,"hal_minor":0,...}`)
    
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        var msg HALMessage
        json.Unmarshal(message, &msg)
    }
}
```

## Debugging Tests

### VS Code Test Debugging

Launch configurations are provided for:

- Jest tests (Node.js debugging)
- pytest tests (Python debugging)
- Go tests (Delve debugging)

### Troubleshooting Common Issues

#### Port Conflicts

```bash
# Kill process using port
lsof -ti:4222 | xargs kill -9
```

#### Docker Services Not Ready

```javascript
// Wait for services to be ready
await waitForNATS('localhost:4222', { timeout: 30000 });
```

#### Flaky Tests

- Use proper wait strategies
- Avoid hard-coded timeouts
- Mock external dependencies
- Use test retries sparingly

## Best Practices

### Do's

- ✅ Write tests before fixing bugs
- ✅ Keep tests fast and focused
- ✅ Use descriptive test names
- ✅ Test behavior, not implementation
- ✅ Clean up resources in afterEach/afterAll

### Don'ts

- ❌ Don't test framework code
- ❌ Don't use production databases
- ❌ Don't rely on test execution order
- ❌ Don't ignore flaky tests
- ❌ Don't skip tests without explanation

## Adding New Tests

### 1. Choose Test Type

- **Unit**: Testing single functions/components
- **Integration**: Testing service interactions
- **E2E**: Testing complete user workflows

### 2. Write Test

Follow the patterns shown above for your language/framework

### 3. Run Locally

```bash
# Run your new test
make test

# Run in watch mode during development
make test-watch
```

### 4. Verify CI

Push to a branch and ensure tests pass in GitHub Actions

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [pytest Documentation](https://docs.pytest.org/)
- [Go Testing](https://golang.org/pkg/testing/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
