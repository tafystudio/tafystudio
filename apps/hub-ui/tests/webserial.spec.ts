import { test, expect, chromium } from '@playwright/test';

// WebSerial is only available in Chromium-based browsers
test.describe('WebSerial Flasher Tests', () => {
  test.describe.configure({ mode: 'serial' });

  // Test with Chrome
  test('Chrome: WebSerial API availability', async ({ page }) => {
    await page.goto('/devices/flash');

    // Check if WebSerial API is available
    const hasWebSerial = await page.evaluate(() => 'serial' in navigator);
    expect(hasWebSerial).toBe(true);

    // Check UI elements
    await expect(page.locator('h1')).toContainText('Flash Firmware');
    await expect(page.locator('text=Connect Device')).toBeVisible();
  });

  // Test with Edge (Chromium-based)
  test('Edge: WebSerial functionality', async () => {
    const browser = await chromium.launch({
      channel: 'msedge',
      headless: false, // WebSerial requires headed mode
      args: [
        '--enable-experimental-web-platform-features',
        '--enable-web-serial',
        '--auto-select-desktop-capture-source=Entire screen',
      ],
    });

    const context = await browser.newContext({
      permissions: ['serial'],
    });

    const page = await context.newPage();
    await page.goto('http://localhost:3000/devices/flash');

    const hasWebSerial = await page.evaluate(() => 'serial' in navigator);
    expect(hasWebSerial).toBe(true);

    await browser.close();
  });

  // Test permission handling
  test('Handle serial permission request', async ({ context, page }) => {
    // Grant serial permission when requested
    await context.grantPermissions(['serial']);

    await page.goto('/devices/flash');

    // Mock serial device for testing
    await page.addInitScript(() => {
      // Mock the serial API for testing without real hardware
      if (!navigator.serial) {
        (navigator as any).serial = {
          requestPort: async () => ({
            open: async () => {},
            close: async () => {},
            readable: new ReadableStream(),
            writable: new WritableStream(),
            getInfo: () => ({ usbVendorId: 0x10c4, usbProductId: 0xea60 }),
          }),
          getPorts: async () => [],
        };
      }
    });

    // Click connect button
    await page.click('button:has-text("Connect Device")');

    // Verify connection state changes
    await expect(page.locator('text=Connected')).toBeVisible({ timeout: 5000 });
  });

  // Test error handling
  test('Handle connection errors gracefully', async ({ page, context }) => {
    await context.grantPermissions(['serial']);
    await page.goto('/devices/flash');

    // Mock serial API with error
    await page.addInitScript(() => {
      (navigator as any).serial = {
        requestPort: async () => {
          throw new Error('No device selected');
        },
      };
    });

    await page.click('button:has-text("Connect Device")');

    // Should show error message
    await expect(page.locator('text=No device selected')).toBeVisible();
  });
});

// Real hardware test (requires ESP32 connected)
test.describe('Real Hardware Tests @hardware', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'WebSerial only works in Chromium'
  );

  test('Flash ESP32 with real device', async ({ browser }) => {
    // This test requires:
    // 1. ESP32 connected via USB
    // 2. Running with --headed flag
    // 3. Manual permission grant

    const context = await browser.newContext({
      permissions: ['serial'],
      // Record video for debugging
      recordVideo: { dir: 'test-results/videos' },
    });

    const page = await context.newPage();
    await page.goto('http://localhost:3000/devices/flash');

    // Wait for user to manually select device
    console.log('Please select the ESP32 device when prompted...');

    await page.click('button:has-text("Connect Device")');

    // Wait for connection
    await page.waitForSelector('text=Connected', { timeout: 30000 });

    // Select firmware
    await page.selectOption('select[name="firmware"]', 'basic-differential');

    // Start flashing
    await page.click('button:has-text("Flash Firmware")');

    // Monitor progress
    const progressLocator = page.locator('[role="progressbar"]');
    await expect(progressLocator).toBeVisible();

    // Wait for completion (timeout: 2 minutes)
    await expect(page.locator('text=Flash complete!')).toBeVisible({
      timeout: 120000,
    });

    await context.close();
  });
});
