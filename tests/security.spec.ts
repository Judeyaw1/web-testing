import { test, expect } from './fixtures/auth';
import { checkHTTPS } from './utils/security';

test('HTTPS enforcement @critical', async ({ page }) => {
  await page.goto('/login');
  const isHTTPS = await checkHTTPS(page);
  expect(isHTTPS).toBeTruthy();
});
// Removed non-critical security tests to keep total to 10

