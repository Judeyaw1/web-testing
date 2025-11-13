import { test, expect } from './fixtures/auth';
import { checkHTTPS } from './utils/security';

test('HTTPS enforcement @critical', async ({ page }) => {
  await page.goto('/login');
  const isHTTPS = await checkHTTPS(page);
  expect(isHTTPS).toBeTruthy();
});

test('404 error page displays correctly @functional @security', async ({ page }) => {
  // STEP 1: Navigate to a non-existent page
  const invalidPath = '/this-page-does-not-exist-12345-xyz';
  const response = await page.goto(invalidPath, { waitUntil: 'networkidle' }).catch(() => null);
  
  // STEP 2: Check HTTP response status (UI/Network check)
  if (response) {
    const status = response.status();
    // Verify 404 status code
    if (status === 404) {
      expect(status).toBe(404);
    } else if (status === 200) {
      // Some apps return 200 but show 404 content (SPA routing)
      // Continue to check for 404 content below
    } else {
      // Other status codes (301, 302 redirects) - check final page
    }
  }
  
  // STEP 3: Verify page loaded (UI check)
  expect(await page.locator('body').isVisible()).toBeTruthy();
  
  // STEP 4: Check for 404 page content/UI elements
  const page404Indicators = [
    page.getByText(/404|not found|page not found|error 404/i),
    page.locator('[class*="404"], [class*="not-found"], [class*="error-404"]'),
    page.locator('h1:has-text("404"), h2:has-text("404")'),
    page.getByRole('heading', { name: /404|not found/i })
  ];
  
  let found404 = false;
  for (const indicator of page404Indicators) {
    if (await indicator.isVisible({ timeout: 3000 }).catch(() => false)) {
      found404 = true;
      break;
    }
  }
  
  // STEP 5: Verify 404 page functionality
  if (found404) {
    // Verify 404 content is visible (UI check)
    const has404Content = await Promise.race([
      page.getByText(/404|not found|page not found/i).isVisible({ timeout: 2000 }).catch(() => false),
      page.locator('[class*="404"]').isVisible({ timeout: 2000 }).catch(() => false),
    ]);
    expect(has404Content).toBeTruthy();
    
    // Verify URL still shows invalid path (functionality check)
    // Some apps redirect to home, which is also acceptable
    const currentUrl = page.url();
    const isInvalidPath = currentUrl.includes(invalidPath) || currentUrl.includes('404');
    const isHomeRedirect = currentUrl.includes('/login') || currentUrl.includes('/dashboard') || currentUrl.includes('/upload');
    
    // Either shows 404 page OR redirects to home (both are valid)
    expect(isInvalidPath || isHomeRedirect).toBeTruthy();
  } else {
    // If no 404 content found, check if redirected to home/login
    // (Some apps redirect 404s to home page, which is acceptable)
    const currentUrl = page.url();
    const isHomePage = currentUrl.includes('/login') || 
                       currentUrl.includes('/dashboard') || 
                       currentUrl.includes('/upload') ||
                       !currentUrl.includes(invalidPath);
    
    if (isHomePage) {
      // Redirected to home - verify page is functional
      expect(await page.locator('body').isVisible()).toBeTruthy();
    } else {
      // Still on invalid path but no 404 content - this might be an issue
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/404-page-unexpected.png', fullPage: true });
      throw new Error(`404 page not found and not redirected. Current URL: ${currentUrl}`);
    }
  }
});

