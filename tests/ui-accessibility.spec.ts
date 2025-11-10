import { test, expect } from './fixtures/auth';
import { setupA11y, checkAccessibility } from './utils/a11y';

test.beforeEach(async ({ page }) => {
  await setupA11y(page);
});

test('Login page accessibility @critical', async ({ page }) => {
  await page.goto('/login');
  await checkAccessibility(page, {
    tags: ['wcag2a'],
    excludes: [
      '#onetrust-accept-btn-handler',
      '[data-testid="cookie-accept"]',
      '[role="dialog"]',
    ]
  });
});

// Removed other a11y tests to keep the suite to 10 core tests

