import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Default to GrabDocs app; override with E2E_BASE_URL when needed
const baseURL = process.env.E2E_BASE_URL || 'https://app.grabdocs.com';
const slowMo = process.env.E2E_SLOWMO ? Number(process.env.E2E_SLOWMO) : undefined;
const storageStatePath = path.resolve(__dirname, '.auth/storage-state.json');
const useSavedState = (process.env.E2E_USE_SAVED_STATE || 'true').toLowerCase() !== 'false';

// eslint-disable-next-line no-console
console.log(`[playwright] Using baseURL: ${baseURL}`);
if (useSavedState && fs.existsSync(storageStatePath)) {
  // eslint-disable-next-line no-console
  console.log(`[playwright] Found saved authentication state - will use "remember device" feature`);
}

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
    // Only use saved storage state if it exists and feature is enabled
    ...(useSavedState && fs.existsSync(storageStatePath) ? { storageState: storageStatePath } : {}),
    launchOptions: slowMo ? { slowMo } : undefined,
    trace: 'on-first-retry',
    video: 'on', // Record video for all tests (can be viewed in HTML report)
    screenshot: 'only-on-failure'
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
});
