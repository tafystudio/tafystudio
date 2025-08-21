import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // WebSerial requires specific flags
        launchOptions: {
          args: [
            '--enable-experimental-web-platform-features',
            '--enable-web-serial',
          ],
        },
      },
    },
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        launchOptions: {
          args: [
            '--enable-experimental-web-platform-features',
            '--enable-web-serial',
          ],
        },
      },
    },
    // Firefox doesn't support WebSerial
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      // Skip WebSerial tests on Firefox
      grep: [/@hardware/, /WebSerial/],
      grepInvert: true,
    },
    // Safari doesn't support WebSerial
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      grep: [/@hardware/, /WebSerial/],
      grepInvert: true,
    },
  ],

  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
