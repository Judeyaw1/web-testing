import { Page } from '@playwright/test';

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
}

export async function measurePageLoad(page: Page): Promise<PerformanceMetrics> {
  const metrics = await page.evaluate(() => {
    const perfData = performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      loadTime: perfData.loadEventEnd - perfData.navigationStart,
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
      firstPaint: navigation ? navigation.fetchStart : undefined,
      firstContentfulPaint: navigation ? navigation.domContentLoadedEventStart : undefined,
    };
  });
  
  return metrics;
}

export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

export async function measureUploadTime(page: Page, uploadSelector: string, filePath: string): Promise<number> {
  const start = Date.now();
  await page.setInputFiles(uploadSelector, filePath);
  await page.waitForLoadState('networkidle');
  return Date.now() - start;
}

