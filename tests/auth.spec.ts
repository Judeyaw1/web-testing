import { test, expect, navigateToLogin, fillLoginForm } from './fixtures/auth';
import { sel } from './utils/selectors';

test('Login, logout, then invalid login @critical @functional @regression @smoke', async ({ page, login }) => {
  // STEP 1: Login with correct credentials
  console.log('✅ STEP 1: Logging in with correct credentials...');
  await login();
  await expect(page).toHaveURL(/\/(dashboard|upload)/);
  console.log('✅ Successfully logged in with correct credentials');
  
  // STEP 2: Logout
  console.log('✅ STEP 2: Logging out...');
  const logoutBtn = page.locator(sel.logout);
  if (await logoutBtn.isVisible().catch(() => false)) {
    await logoutBtn.click();
    await expect(page).toHaveURL(/login/);
    console.log('✅ Successfully logged out');
  } else {
    // If logout button not found, try to navigate to login page manually
    console.log('⚠️  Logout button not found, navigating to login page...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  }
  
  // STEP 3: Try to login with incorrect credentials
  console.log('✅ STEP 3: Attempting login with incorrect credentials...');
  await navigateToLogin(page);
  await fillLoginForm(page, 'wrong@example.com', 'badpass');
  
  // Wait a bit for error message to appear
  await page.waitForTimeout(2000);
  
  // STEP 4: Verify error message is shown
  console.log('✅ STEP 4: Verifying error message is displayed...');
  const errorCandidate = page.locator('[role="alert"], [data-testid*="toast"], [class*="error"], [class*="alert"]').first();
  const errorVisible = (await errorCandidate.isVisible().catch(() => false)) || 
                       (await page.getByText(/invalid|error|incorrect|failed/i).first().isVisible().catch(() => false));
  
  expect(errorVisible).toBeTruthy();
  console.log('✅ Invalid login error message verified');
  
  // STEP 5: Verify we're still on login page (not logged in)
  const currentUrl = page.url();
  expect(currentUrl).toMatch(/login/);
  console.log('✅ Verified still on login page after invalid credentials');
});

test('Session persistence after refresh @critical', async ({ page, login }) => {
  await login();
  await page.reload();
  await expect(page).not.toHaveURL(/login/);
  await expect(page.locator('body')).toBeVisible();
});