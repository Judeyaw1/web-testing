import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

// Default to GrabDocs app; override with E2E_BASE_URL when needed
const baseURL = process.env.E2E_BASE_URL || 'https://app.grabdocs.com';
const slowMo = process.env.E2E_SLOWMO ? Number(process.env.E2E_SLOWMO) : undefined;
// eslint-disable-next-line no-console
console.log(`[playwright] Using baseURL: ${baseURL}`);

export default defineConfig({
  testDir: './tests',
  timeout: 180000, // 3 minutes for tests with OTP login
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL,
    launchOptions: slowMo ? { slowMo } : undefined,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'Google Chrome',
      use: { channel: 'chrome' }
    }
  ],
});