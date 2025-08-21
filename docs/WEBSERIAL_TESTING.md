# WebSerial Testing Guide

This guide covers testing the WebSerial flasher component across different
browsers using Playwright.

## Overview

The WebSerial API is only available in Chromium-based browsers (Chrome, Edge,
Opera). Our testing strategy covers:

- Full API testing in supported browsers
- Fallback UI testing in unsupported browsers (Firefox, Safari)
- Mock testing without hardware
- Real hardware testing with ESP32 devices

## Prerequisites

### Software Requirements

- Node.js 18+ and pnpm
- Playwright test browsers installed
- Chrome or Edge browser for manual testing

### Hardware Requirements (Optional)

- ESP32 development board
- USB cable (data cable, not charge-only)
- USB drivers installed (CP2102 or CH340)

## Running Tests

### Quick Mock Tests (No Hardware)

Run WebSerial tests using mocks - no ESP32 required:

```bash
make test-webserial-mock
```

Or directly:

```bash
cd apps/hub-ui
pnpm exec playwright test webserial.spec.ts --grep-invert @hardware
```

### Full Hardware Tests

With an ESP32 connected via USB:

```bash
make test-webserial
```

This will:

1. Detect connected ESP32 devices
2. Run mock tests for all browsers
3. Run hardware tests for Chromium browsers
4. Generate an HTML test report

### Specific Browser Testing

Test individual browsers:

```bash
# Chrome only
cd apps/hub-ui
pnpm exec playwright test --project=chromium webserial.spec.ts

# Edge only
pnpm exec playwright test --project=edge webserial.spec.ts

# All browsers (including fallback tests)
pnpm exec playwright test webserial.spec.ts
```

## Test Coverage

### Chromium Browsers (Chrome, Edge)

- ✅ WebSerial API availability
- ✅ Permission request handling
- ✅ Device connection/disconnection
- ✅ Firmware flashing process
- ✅ Progress tracking
- ✅ Error handling
- ✅ Serial console output

### Non-Chromium Browsers (Firefox, Safari)

- ✅ Fallback UI display
- ✅ Browser compatibility warnings
- ✅ Alternative flashing instructions
- ✅ Graceful degradation

## Writing New Tests

### Mock Testing Pattern

```typescript
test('My WebSerial test', async ({ page, context }) => {
  // Grant serial permission
  await context.grantPermissions(['serial']);

  // Navigate to flasher
  await page.goto('/devices/flash');

  // Inject mock serial API
  await page.addInitScript(() => {
    (navigator as any).serial = {
      requestPort: async () => ({
        open: async () => {},
        close: async () => {},
        readable: new ReadableStream(),
        writable: new WritableStream(),
      }),
      getPorts: async () => [],
    };
  });

  // Your test logic here
});
```

### Hardware Testing Pattern

```typescript
test('Real hardware test @hardware', async ({ page }) => {
  // Skip if not Chromium
  test.skip(({ browserName }) => browserName !== 'chromium');

  await page.goto('/devices/flash');

  // User must manually select device
  console.log('Select ESP32 when prompted...');

  await page.click('button:has-text("Connect Device")');

  // Wait for connection
  await expect(page.locator('text=Connected')).toBeVisible({
    timeout: 30000,
  });
});
```

## Debugging

### View Test Report

After running tests:

```bash
cd apps/hub-ui
pnpm exec playwright show-report
```

### Run in Headed Mode

See tests execute in real browsers:

```bash
pnpm exec playwright test webserial.spec.ts --headed
```

### Debug Mode

Step through tests interactively:

```bash
pnpm exec playwright test webserial.spec.ts --debug
```

### Video Recording

Hardware tests automatically record video to `test-results/videos/`.

## CI/CD Integration

For GitHub Actions or other CI systems:

```yaml
- name: Install Playwright
  run: |
    cd apps/hub-ui
    pnpm exec playwright install --with-deps chromium

- name: Run WebSerial Tests
  run: make test-webserial-mock

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: apps/hub-ui/playwright-report/
```

## Common Issues

### Permission Denied

- Ensure no other application is using the serial port
- Check USB device permissions on Linux: `sudo usermod -a -G dialout $USER`

### Device Not Found

- Verify USB cable is a data cable
- Install appropriate drivers (CP2102/CH340)
- Try different USB ports
- Hold BOOT button while connecting on some ESP32 boards

### Tests Hanging

- WebSerial requires headed mode for permission prompts
- Use `--timeout` flag to adjust test timeouts
- Check browser console for errors

## Mock Serial API Reference

The mock API (`webserial-mock.ts`) provides:

- `MockSerialPort`: Simulates a serial device
- `MockSerial`: Simulates the navigator.serial API
- Configurable responses and delays
- Error simulation capabilities

## Related Documentation

- [WebSerial API Spec](https://wicg.github.io/serial/)
- [Playwright Documentation](https://playwright.dev)
- [ESP32 Flashing Guide](./ESP32_FLASHING.md)
