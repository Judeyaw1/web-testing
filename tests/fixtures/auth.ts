import { test as base } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const STORAGE_STATE_PATH = path.resolve(__dirname, '../.auth/storage-state.json');

type AuthFixture = {
  login: () => Promise<void>;
};

export const test = base.extend<AuthFixture>({
  login: async ({ page, context }, use) => {
    // Check if we should use saved storage state (remember device)
    const useSavedState = (process.env.E2E_USE_SAVED_STATE || 'true').toLowerCase() !== 'false';
    
    if (useSavedState && fs.existsSync(STORAGE_STATE_PATH)) {
      console.log('✅ Using saved authentication state (remember device enabled)');
      try {
        const storageState = JSON.parse(fs.readFileSync(STORAGE_STATE_PATH, 'utf-8'));
        await context.addCookies(storageState.cookies || []);
        
        // Verify the saved state still works
        await page.goto('/upload', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        // If we're redirected to login, the saved state expired - need to login again
        if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
          console.log('⚠️  Saved authentication state expired, logging in again...');
          // Continue to login flow below
        } else {
          // Saved state works! Skip login
          console.log('✅ Saved authentication state is valid, skipping login');
          await use(async () => {});
          return;
        }
      } catch (error) {
        console.log('⚠️  Error loading saved state, logging in fresh...', error);
        // Continue to login flow below
      }
    }

    if ((process.env.E2E_INTERACTIVE_LOGIN || '').toLowerCase() === 'true' || process.env.E2E_INTERACTIVE_LOGIN === '1') {
      await navigateToLogin(page);
      // Prefill to counter fast refresh loops, but let you review before submit
      await stabilizeAndPrefillLogin(page, process.env.E2E_EMAIL ?? 'judeyawosafo1473@gmail.com', process.env.E2E_PASSWORD ?? 'Silicon123');
      await page.pause();
      await page.waitForURL(/\/(dashboard|upload)/, { timeout: 300000 });
      
      // Save authentication state after interactive login
      if (useSavedState) {
        await saveStorageState(context);
      }
      
      await use(async () => {});
      return;
    }

    const candidateLoginPaths = getCandidateLoginPaths();
    let atLogin = false;
    const overallDeadline = Date.now() + 8000; // hard cap for probing

    for (const path of candidateLoginPaths) {
      if (Date.now() > overallDeadline) break;
      const response = await page.goto(path);
      const pageOk = !response || response.ok();
      try {
        await maybeDismissCookieBanner(page);
        await waitForAny(page, getEmailSelectorCandidates(), 5000);
        atLogin = true;
        break;
      } catch {
        // Not visible here; try next path if page loaded fine
        if (!pageOk) {
          // If hard 404/500, continue to next path
        }
      }
    }

    if (!atLogin) {
      // Fallback: go to home and rely on baseURL redirects/nav
      await page.goto('/');
      try {
        await maybeDismissCookieBanner(page);
        await waitForAny(page, getEmailSelectorCandidates(), 5000);
        atLogin = true;
      } catch {
        // still not at login
      }
    }

    if (!atLogin) {
      const base = process.env.E2E_BASE_URL || 'https://app.grabdocs.com';
      throw new Error(`Login form not found. Tried paths ${candidateLoginPaths.join(', ')} on baseURL ${base}. Set E2E_BASE_URL if your app uses a different host or route.`);
    }

    await fillLoginForm(page, process.env.E2E_EMAIL ?? 'judeyawosafo1473@gmail.com', process.env.E2E_PASSWORD ?? 'Silicon123');
    const reachedDashboard = await waitForDashboardOrVerification(page, 20000);
    if (!reachedDashboard) {
      const completed = await completeOtpIfConfigured(page);
      if (!completed) {
        throw new Error('Verification required. Set E2E_OTP_MODE=code with E2E_OTP_CODE, or E2E_OTP_MODE=manual to enter code.');
      }
    }
    await page.waitForURL(/\/(dashboard|upload)/, { timeout: 180000 }); // 3 minutes for OTP + navigation
    
    // Save authentication state after successful login (remember device)
    if (useSavedState) {
      await saveStorageState(context);
    }
    
    await use(async () => {});
  },
});

async function saveStorageState(context: import('@playwright/test').BrowserContext): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(STORAGE_STATE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save storage state
    await context.storageState({ path: STORAGE_STATE_PATH });
    console.log('✅ Authentication state saved (device remembered)');
  } catch (error) {
    console.log('⚠️  Failed to save authentication state:', error);
  }
}

export const expect = test.expect;

export async function navigateToLogin(page: import('@playwright/test').Page): Promise<void> {
  const candidateLoginPaths = getCandidateLoginPaths();
  for (const path of candidateLoginPaths) {
    const response = await page.goto(path);
    const pageOk = !response || response.ok();
    try {
      await maybeDismissCookieBanner(page);
      await waitForAny(page, getEmailSelectorCandidates(), 5000);
      return;
    } catch {
      if (!pageOk) {
        // try next
      }
    }
  }
  await page.goto('/');
  await maybeDismissCookieBanner(page);
  await waitForAny(page, getEmailSelectorCandidates(), 5000);
}

export async function fillLoginForm(page: import('@playwright/test').Page, email: string, password: string): Promise<void> {
  const emailSelector = await waitForAny(page, getEmailSelectorCandidates(), 3000);
  const passwordSelector = await waitForAny(page, getPasswordSelectorCandidates(), 3000);
  await page.fill(emailSelector, email);
  await page.fill(passwordSelector, password);
  const submitSelector = await waitForAny(page, getSubmitSelectorCandidates(), 3000);
  await page.click(submitSelector);
}

async function waitForDashboardOrVerification(page: import('@playwright/test').Page, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const url = await page.url();
    // Accept dashboard OR upload as success
    if (url.includes('/dashboard') || url.includes('/upload')) return true;
    
    // Check for OTP screen - use non-strict locators
    const otpInputVisible = await page.locator('input[name="code"], input[autocomplete="one-time-code"]').first().isVisible({ timeout: 200 }).catch(() => false);
    const verifyButtonVisible = await page.getByRole('button', { name: /verify/i }).isVisible({ timeout: 200 }).catch(() => false);
    
    if (otpInputVisible || verifyButtonVisible) return false;
    await page.waitForTimeout(250);
  }
  return false;
}

async function completeOtpIfConfigured(page: import('@playwright/test').Page): Promise<boolean> {
  const mode = (process.env.E2E_OTP_MODE || 'code').toLowerCase();
  if (mode === 'manual') {
    // Let the user enter the OTP and click "Verify Code" without pausing the run.
    // We simply wait until post-login navigation happens.
    await page.waitForURL(/\/(dashboard|upload)/, { timeout: 300000 });
    return true;
  }
  if (mode === 'code') {
    const code = process.env.E2E_OTP_CODE || '335577';
    if (!code) return false;
    
    // Wait longer for OTP screen to fully render
    await page.waitForTimeout(2000);
    
    // Try single field first with extended timeout
    const singleField = await waitForAny(page, getOtpSingleFieldSelectors(), 13000).catch(() => undefined);
    if (singleField) {
      await page.fill(singleField, code);
      await page.waitForTimeout(1000);
    } else {
      // Try split fields with longer wait
      await page.waitForTimeout(2000);
      const fields = getOtpSplitFieldSelectors().map((s) => page.locator(s).first());
      let filled = false;
      for (const field of fields) {
        if (await field.isVisible({ timeout: 5000 }).catch(() => false)) {
          for (const ch of code) {
            await field.type(ch);
            await page.waitForTimeout(200);
          }
          filled = true;
          break;
        }
      }
      if (!filled) {
        // Last resort: try any numeric input on the page with longer timeout
        await page.waitForTimeout(2000);
        const anyNumericInput = page.locator('input[type="text"], input[type="number"]').filter({ hasNotText: '' }).first();
        if (await anyNumericInput.isVisible({ timeout: 10000 }).catch(() => false)) {
          await anyNumericInput.fill(code);
          filled = true;
        }
      }
      if (!filled) return false;
    }
    
    // Click verify button with extended timeout
    await page.waitForTimeout(1000);
    const verifyBtn = await waitForAny(page, getOtpSubmitSelectorCandidates(), 13000).catch(() => undefined);
    if (verifyBtn) {
      await page.click(verifyBtn);
      // Wait longer after clicking verify to allow navigation
      await page.waitForTimeout(3000);
    } else {
      // Try pressing Enter as fallback
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }
    return true;
  }
  return false;
}

function getCandidateLoginPaths(): string[] {
  const paths = [
    process.env.E2E_LOGIN_PATH || '',
    '/login',
    '/auth/login',
    '/signin',
    '/auth/sign-in',
    '/users/sign_in'
  ].filter(Boolean);
  return Array.from(new Set(paths));
}

function getEmailSelectorCandidates(): string[] {
  return sanitizeSelectors([
    process.env.E2E_LOGIN_EMAIL_SELECTOR || '',
    '[data-testid="login-email"]',
    'input[type="email"]',
    'input[name="email"]',
    '#email',
    'input[autocomplete="username"]'
  ]);
}

function getPasswordSelectorCandidates(): string[] {
  return sanitizeSelectors([
    process.env.E2E_LOGIN_PASSWORD_SELECTOR || '',
    '[data-testid="login-password"]',
    'input[type="password"]',
    'input[name="password"]',
    '#password',
    'input[autocomplete="current-password"]'
  ]);
}

function getSubmitSelectorCandidates(): string[] {
  return sanitizeSelectors([
    process.env.E2E_LOGIN_SUBMIT_SELECTOR || '',
    '[data-testid="login-submit"]',
    'button[type="submit"]',
    'button:has-text("Sign in")',
    'button:has-text("Log in")',
    'button:has-text("Continue")',
    '[role="button"]:has-text("Sign in")'
  ]);
}

function getOtpSingleFieldSelectors(): string[] {
  return sanitizeSelectors([
    'input[name="code"]',
    'input[autocomplete="one-time-code"]',
    'input[data-testid="otp-code"]',
    'input[type="text"][maxlength="6"]',
    'input[type="text"][maxlength="8"]',
    'input[placeholder*="code" i]',
    'input[placeholder*="verification" i]',
    'input[inputmode="numeric"]'
  ]);
}

function getOtpSplitFieldSelectors(): string[] {
  return sanitizeSelectors([
    'input[name="digit1"]',
    'input[name="otp1"]',
    'input[data-testid="otp-1"]'
  ]);
}

function getOtpSubmitSelectorCandidates(): string[] {
  return sanitizeSelectors([
    'button:has-text("Verify")',
    'button:has-text("Continue")',
    'button:has-text("Confirm")',
    '[data-testid="otp-submit"]'
  ]);
}

async function waitForAny(page: import('@playwright/test').Page, selectors: string[], timeoutMs: number): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    const remaining = deadline - Date.now();
    for (const selector of selectors) {
      try {
        // Try in main page
        const loc = page.locator(selector).first();
        if (await loc.isVisible({ timeout: 200 }).catch(() => false)) return selector;
        // Try in iframes
        for (const frame of page.frames()) {
          try {
            const floc = frame.locator(selector).first();
            if (await floc.isVisible({ timeout: 200 }).catch(() => false)) return selector;
          } catch {}
        }
      } catch (e) {
        lastError = e;
      }
    }
    await page.waitForTimeout(Math.min(250, remaining));
  }
  throw lastError ?? new Error('Selectors not found in any frame');
}

async function maybeDismissCookieBanner(page: import('@playwright/test').Page): Promise<void> {
  const candidates = [
    '[data-testid="cookie-accept"]',
    '#onetrust-accept-btn-handler',
    'button:has-text("Accept")',
    'button:has-text("I agree")',
    'button:has-text("Got it")'
  ];
  for (const c of candidates) {
    const btn = page.locator(c).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      break;
    }
  }
}

async function stabilizeAndPrefillLogin(page: import('@playwright/test').Page, email: string, password: string): Promise<void> {
  const until = Date.now() + 20000; // try for up to 20s to keep fields filled
  let filledEmail = false;
  let filledPassword = false;
  while (Date.now() < until && !(filledEmail && filledPassword)) {
    try {
      await maybeDismissCookieBanner(page);
      const emailSel = await waitForAny(page, getEmailSelectorCandidates(), 2000).catch(() => undefined);
      if (emailSel) {
        const emailLoc = page.locator(emailSel).first();
        const current = (await emailLoc.inputValue().catch(() => '')) || '';
        if (current !== email) {
          await emailLoc.fill(email);
        }
        filledEmail = true;
      }
      const passSel = await waitForAny(page, getPasswordSelectorCandidates(), 2000).catch(() => undefined);
      if (passSel) {
        const passLoc = page.locator(passSel).first();
        const currentP = (await passLoc.inputValue().catch(() => '')) || '';
        if (!currentP) {
          await passLoc.fill(password);
        }
        filledPassword = true;
      }
    } catch {}
    await page.waitForTimeout(300);
  }
}

function sanitizeSelectors(candidates: string[]): string[] {
  const filtered = candidates
    .filter(Boolean)
    // Ignore obvious mistakes where a value (like an email) is passed as a selector
    .filter((s) => !s.includes('@') && !s.includes(' '));
  return Array.from(new Set(filtered));
}