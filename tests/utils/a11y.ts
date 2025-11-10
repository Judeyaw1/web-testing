import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';

export async function setupA11y(page: Page): Promise<void> {
  // Axe is automatically injected with AxeBuilder
}

export async function checkAccessibility(page: Page, options?: { tags?: string[]; excludes?: string[] }): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(options?.tags || ['wcag2a', 'wcag2aa', 'wcag21aa']);
  if (options?.excludes) {
    for (const sel of options.excludes) {
      builder = builder.exclude(sel);
    }
  }
  const results = await builder.analyze();
  
  if (results.violations.length > 0) {
    throw new Error(`Accessibility violations found: ${JSON.stringify(results.violations, null, 2)}`);
  }
}

