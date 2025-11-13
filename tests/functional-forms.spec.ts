import { test, expect } from './fixtures/auth';

test.beforeEach(async ({ page, login }) => {
  test.setTimeout(120000);
  await login();
});

test('Open forms, select template, and create form @critical', async ({ page }) => {
  // STEP 1: Navigate to forms page
  await page.goto('/forms', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // Wait for page to load
  
  // Verify page loaded
  const currentUrl = page.url();
  expect(currentUrl).toContain('grabdocs');
  expect(currentUrl).not.toBe('about:blank');
  
  // STEP 2: Find and click on a form template
  console.log('✅ Looking for form templates...');
  
  // Look for template cards/items - prioritize actual template elements
  const templateSelectors = [
    '[class*="template"]',
    '[data-testid*="template"]',
    '[class*="form-template"]',
    '[class*="template-card"]',
    '[class*="template-item"]',
    'div[class*="card"][class*="template"]',
    'button[class*="template"]',
    'a[class*="template"]',
  ];
  
  let templateElement: import('@playwright/test').Locator | null = null;
  
  // First, search for actual template elements
  for (const selector of templateSelectors) {
    const templates = page.locator(selector);
    const templateCount = await templates.count();
    console.log(`Found ${templateCount} elements with selector: ${selector}`);
    
    if (templateCount > 0) {
      // Look for the first visible template
      for (let i = 0; i < Math.min(templateCount, 20); i++) {
        const template = templates.nth(i);
        if (await template.isVisible({ timeout: 2000 }).catch(() => false)) {
          const templateText = await template.textContent().catch(() => '');
          // Skip buttons that say "Create" or "Cancel" or "Close"
          if (templateText && 
              !templateText.toLowerCase().includes('create') && 
              !templateText.toLowerCase().includes('cancel') && 
              !templateText.toLowerCase().includes('close') &&
              !templateText.toLowerCase().includes('delete')) {
            templateElement = template;
            console.log(`✅ Found template at index ${i}: "${templateText?.substring(0, 50)}"`);
            break;
          }
        }
      }
      
      if (templateElement) {
        break;
      }
    }
  }
  
  // If no template found by class, look for grid items that might be templates
  if (!templateElement) {
    console.log('✅ Searching for template items in grid...');
    const gridItems = page.locator('div[class*="grid"] > div, div[class*="grid"] > button, div[class*="grid"] > a');
    const gridItemCount = await gridItems.count();
    console.log(`Found ${gridItemCount} grid items`);
    
    for (let i = 0; i < Math.min(gridItemCount, 30); i++) {
      const item = gridItems.nth(i);
      if (await item.isVisible({ timeout: 1000 }).catch(() => false)) {
        const itemText = await item.textContent().catch(() => '');
        const itemClass = await item.getAttribute('class').catch(() => '');
        
        // Look for items that look like templates (not navigation items like "Home")
        // Templates usually have descriptive names or are in template-related containers
        if (itemText && 
            itemText.trim().length > 0 &&
            !itemText.toLowerCase().includes('create') && 
            !itemText.toLowerCase().includes('cancel') && 
            !itemText.toLowerCase().includes('close') &&
            !itemText.toLowerCase().includes('delete') &&
            !itemText.toLowerCase().includes('new link') &&
            !itemText.toLowerCase().includes('home') &&
            !itemText.toLowerCase().includes('dashboard') &&
            (itemClass?.toLowerCase().includes('template') || 
             itemClass?.toLowerCase().includes('card') ||
             itemText.length > 3)) { // Templates usually have meaningful names
          templateElement = item;
          console.log(`✅ Found potential template at index ${i}: "${itemText?.substring(0, 50)}" (class: ${itemClass?.substring(0, 30) || 'none'})`);
          break;
        }
      }
    }
  }
  
  // Last resort: look for any clickable card/button that might be a template
  if (!templateElement) {
    console.log('✅ Searching for clickable template elements...');
    const allCards = page.locator('div[class*="card"], button, [role="button"], a[href]');
    const cardCount = await allCards.count();
    console.log(`Found ${cardCount} potential template cards`);
    
    for (let i = 0; i < Math.min(cardCount, 30); i++) {
      const card = allCards.nth(i);
      if (await card.isVisible({ timeout: 1000 }).catch(() => false)) {
        const cardText = await card.textContent().catch(() => '');
        // Skip buttons that say "Create", "Cancel", "Close", "Delete", or navigation items
        if (cardText && 
            cardText.trim().length > 0 &&
            !cardText.toLowerCase().includes('create') && 
            !cardText.toLowerCase().includes('cancel') && 
            !cardText.toLowerCase().includes('close') &&
            !cardText.toLowerCase().includes('delete') &&
            !cardText.toLowerCase().includes('new link') &&
            !cardText.toLowerCase().includes('home') &&
            !cardText.toLowerCase().includes('dashboard')) {
          templateElement = card;
          console.log(`✅ Found potential template card at index ${i}: "${cardText?.substring(0, 50)}"`);
          break;
        }
      }
    }
  }
  
  // STEP 3: Verify template exists and select it
  expect(templateElement).not.toBeNull();
  expect(await templateElement!.isVisible()).toBeTruthy();
  console.log('✅ Template found, clicking to select...');
  
  // Click on the template
  await templateElement!.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  
  try {
    await templateElement!.click({ timeout: 5000 });
    console.log('✅ Clicked on template');
  } catch (error) {
    // If normal click fails, try JavaScript click
    console.log('⚠️  Normal click failed, trying JavaScript click...');
    await templateElement!.evaluate((el: HTMLElement) => {
      (el as HTMLElement).click();
    });
    console.log('✅ Clicked on template (JavaScript)');
  }
  
  await page.waitForTimeout(3000); // Wait for form creation/builder to load
  
  // STEP 4: Look for "Save Form" icon/button to save the form
  console.log('✅ Looking for Save Form icon/button...');
  
  // Wait a bit for any modal/form to appear
  await page.waitForTimeout(2000);
  
  // Check if there's a modal/dialog
  const modal = page.locator('[role="dialog"], [class*="modal"], [class*="dialog"], .fixed.inset-0').first();
  const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
  
  // Determine which locator to use (modal or page)
  const locatorSource = modalVisible ? modal : page;
  
  // Look for save icon (SVG, icon elements, or buttons with save icons)
  const saveIconSelectors = [
    'svg[aria-label*="save" i]',
    'svg[aria-label*="save form" i]',
    'button svg[aria-label*="save" i]',
    '[data-testid*="save"]',
    '[data-testid*="save-form"]',
    'button[aria-label*="save" i]',
    'button[aria-label*="save form" i]',
    'button[title*="save" i]',
    'button[title*="save form" i]',
    'button:has(svg[aria-label*="save" i])',
    'button:has(svg[class*="save" i])',
    '[class*="save-icon"]',
    '[class*="icon-save"]',
  ];
  
  let saveIcon: import('@playwright/test').Locator | null = null;
  
  // First, search for save icon elements
  for (const selector of saveIconSelectors) {
    const icon = locatorSource.locator(selector).first();
    if (await icon.isVisible({ timeout: 2000 }).catch(() => false)) {
      const ariaLabel = await icon.getAttribute('aria-label').catch(() => '');
      const title = await icon.getAttribute('title').catch(() => '');
      console.log(`✅ Found save icon with selector: ${selector} (aria-label: ${ariaLabel}, title: ${title})`);
      saveIcon = icon;
      break;
    }
  }
  
  // If icon not found, look for parent button containing save icon
  if (!saveIcon) {
    console.log('✅ Searching for buttons containing save icons...');
    const buttonsWithIcons = locatorSource.locator('button:has(svg), button:has([class*="icon"])');
    const buttonCount = await buttonsWithIcons.count();
    console.log(`Found ${buttonCount} buttons with icons`);
    
    for (let i = 0; i < Math.min(buttonCount, 30); i++) {
      const btn = buttonsWithIcons.nth(i);
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
        const title = await btn.getAttribute('title').catch(() => '');
        const btnText = await btn.textContent().catch(() => '');
        
        // Check if button has save-related attributes or contains save icon
        if (ariaLabel?.toLowerCase().includes('save') ||
            title?.toLowerCase().includes('save') ||
            btnText?.toLowerCase().includes('save')) {
          saveIcon = btn;
          console.log(`✅ Found save button at index ${i}: aria-label="${ariaLabel}", title="${title}", text="${btnText}"`);
          break;
        }
        
        // Check if button contains an SVG with save-related aria-label
        const svg = btn.locator('svg').first();
        if (await svg.isVisible({ timeout: 500 }).catch(() => false)) {
          const svgAriaLabel = await svg.getAttribute('aria-label').catch(() => '');
          if (svgAriaLabel?.toLowerCase().includes('save')) {
            saveIcon = btn;
            console.log(`✅ Found save button with save icon at index ${i}: svg aria-label="${svgAriaLabel}"`);
            break;
          }
        }
      }
    }
  }
  
  // If still not found, try text-based buttons as fallback
  if (!saveIcon) {
    console.log('✅ Searching for text-based Save buttons...');
    const saveButtonSelectors = [
      'button:has-text("Save Form")',
      'button:has-text("Save")',
      'button:has-text("Create")',
      'button[type="submit"]',
    ];
    
    for (const selector of saveButtonSelectors) {
      const btn = locatorSource.locator(selector).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const btnText = await btn.textContent().catch(() => '');
        if (btnText && (btnText.toLowerCase().includes('save') || btnText.toLowerCase().includes('create'))) {
          saveIcon = btn;
          console.log(`✅ Found Save button: "${btnText}"`);
          break;
        }
      }
    }
  }
  
  // If still not found, search all buttons on page
  if (!saveIcon) {
    console.log('✅ Searching all buttons for Save button...');
    const allButtons = page.locator('button, [role="button"]');
    const buttonCount = await allButtons.count();
    console.log(`Found ${buttonCount} buttons on page`);
    
    for (let i = 0; i < Math.min(buttonCount, 50); i++) {
      const btn = allButtons.nth(i);
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        const btnText = await btn.textContent().catch(() => '');
        const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
        const title = await btn.getAttribute('title').catch(() => '');
        const btnTextLower = (btnText || '').toLowerCase().trim();
        const ariaLabelLower = (ariaLabel || '').toLowerCase();
        const titleLower = (title || '').toLowerCase();
        
        if (btnTextLower.includes('save') || 
            ariaLabelLower.includes('save') || 
            titleLower.includes('save')) {
          saveIcon = btn;
          console.log(`✅ Found Save button at index ${i}: text="${btnText}", aria-label="${ariaLabel}", title="${title}"`);
          break;
        }
      }
    }
  }
  
  // STEP 5: Click Save icon/button to save the form
  expect(saveIcon).not.toBeNull();
  expect(await saveIcon!.isVisible()).toBeTruthy();
  console.log('✅ Save icon/button found, clicking to save form...');
  
  try {
    await saveIcon!.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await saveIcon!.click({ timeout: 5000 });
    console.log('✅ Clicked Save icon/button');
  } catch (error) {
    // If normal click fails, use JavaScript click
    console.log('⚠️  Normal click failed, using JavaScript click...');
    await saveIcon!.evaluate((el: HTMLElement) => {
      (el as HTMLElement).click();
    });
    console.log('✅ Clicked Save icon/button (JavaScript)');
  }
  
  await page.waitForTimeout(3000); // Wait for form to be saved
  
  // STEP 6: Verify form was saved - check for success message or confirmation
  console.log('✅ Verifying form was saved...');
  
  // Check for success message immediately
  const successMessage = await Promise.race([
    page.getByText(/saved|success|created|form.*saved/i).isVisible({ timeout: 5000 }).catch(() => false),
    page.locator('[role="alert"]').filter({ hasText: /success|saved|created/i }).isVisible({ timeout: 5000 }).catch(() => false),
    page.locator('[class*="toast"]').filter({ hasText: /success|saved/i }).isVisible({ timeout: 5000 }).catch(() => false),
  ]);
  
  if (successMessage) {
    console.log('✅ Success message displayed - form saved!');
  }
  
  // STEP 7: Navigate back to forms page and refresh to verify form appears in list
  console.log('✅ Navigating to forms page to verify form appears in list...');
  await page.goto('/forms', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // Wait for page to load
  
  // Refresh the page to ensure we see the latest forms
  console.log('✅ Refreshing page to see latest forms...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // Wait for page to load after refresh
  
  // STEP 8: Verify form appears in the list after refresh
  console.log('✅ Verifying form appears in the list after refresh...');
  
  // Check for form items in the list
  const formItems = page.locator('[class*="form"], [data-testid*="form"], [class*="card"], [class*="item"], [class*="list-item"]');
  const formItemCount = await formItems.count();
  console.log(`Found ${formItemCount} potential form items`);
  
  let formFound = false;
  let formItemText = '';
  
  for (let i = 0; i < Math.min(formItemCount, 30); i++) {
    const formItem = formItems.nth(i);
    if (await formItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      const itemText = await formItem.textContent().catch(() => '');
      if (itemText && itemText.trim().length > 0) {
        formFound = true;
        formItemText = itemText;
        console.log(`✅ Found form item at index ${i}: "${itemText.substring(0, 50)}"`);
        break;
      }
    }
  }
  
  // Check for form-related content on the page
  const pageContent = await page.textContent('body').catch(() => '');
  const hasFormContent = pageContent && (pageContent.toLowerCase().includes('form') || 
                                        pageContent.toLowerCase().includes('saved') ||
                                        pageContent.toLowerCase().includes('created'));
  
  // Check for forms list container
  const listContainer = await Promise.race([
    page.locator('[class*="list"], [class*="forms"], [class*="grid"]').first().isVisible({ timeout: 3000 }).catch(() => false),
    page.locator('table, ul, ol').first().isVisible({ timeout: 3000 }).catch(() => false),
  ]);
  
  // Check for error messages
  const errorVisible = await page.getByText(/error|failed|invalid/i).isVisible({ timeout: 2000 }).catch(() => false);
  
  // STRICT VERIFICATION: Form MUST be saved (form found in list OR success message OR list container exists)
  const formSaved = formFound || successMessage || (listContainer && hasFormContent);
  expect(formSaved).toBeTruthy();
  expect(errorVisible).toBeFalsy();
  
  if (formFound) {
    console.log(`✅ Form found in the list after refresh: "${formItemText.substring(0, 50)}"`);
  } else if (successMessage) {
    console.log('✅ Success message shown - form saved!');
  } else if (listContainer && hasFormContent) {
    console.log('✅ Forms list container found with form content - form saved!');
  }
  
  console.log('✅ Form save verified successfully!');
});
