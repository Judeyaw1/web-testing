import { Page } from '@playwright/test';

export async function checkHTTPS(page: Page): Promise<boolean> {
  const url = page.url();
  return url.startsWith('https://');
}

export async function checkNoSensitiveDataInURL(page: Page): Promise<boolean> {
  const url = page.url();
  const sensitivePatterns = ['password', 'token', 'secret', 'api_key', 'session'];
  return !sensitivePatterns.some(pattern => url.toLowerCase().includes(pattern));
}

export async function attemptUnauthorizedAccess(page: Page, url: string): Promise<number> {
  const response = await page.goto(url).catch(() => null);
  return response?.status() ?? 0;
}

export async function testXSSInjection(page: Page, inputSelector: string, payload: string): Promise<boolean> {
  await page.fill(inputSelector, payload);
  const content = await page.content();
  // Check if payload was escaped/encoded
  return !content.includes(`<script>${payload}</script>`) && !content.includes(`javascript:${payload}`);
}

