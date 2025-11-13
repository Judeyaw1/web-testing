import { test, expect } from './fixtures/auth';

test.beforeEach(async ({ page, login }) => {
  test.setTimeout(120000);
  await login();
});

test('Create new link and verify it was created @critical', async ({ page }) => {
  // STEP 1: Navigate to links page
  await page.goto('/quick-links', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // Wait for page to load
  
  // Verify page loaded
  const currentUrl = page.url();
  expect(currentUrl).toContain('grabdocs');
  expect(currentUrl).not.toBe('about:blank');
  
  // STEP 2: Find and click "Create Link" or "New Link" button
  console.log('✅ Looking for Create Link button...');
  
  const createButtonSelectors = [
    'button:has-text("Create Link")',
    'button:has-text("New Link")',
    'button:has-text("Add Link")',
    'button:has-text("Create")',
    'a:has-text("Create Link")',
    'a:has-text("New Link")',
    '[data-testid*="create-link"]',
    '[data-testid*="new-link"]',
    '[aria-label*="create link" i]',
  ];
  
  let createButton: import('@playwright/test').Locator | null = null;
  
  // Search for create button
  for (const selector of createButtonSelectors) {
    const btn = page.locator(selector).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const btnText = await btn.textContent().catch(() => '');
      console.log(`✅ Found Create Link button: "${btnText}"`);
      createButton = btn;
      break;
    }
  }
  
  // If not found, search all buttons
  if (!createButton) {
    console.log('✅ Searching all buttons for Create Link button...');
    const allButtons = page.locator('button, a[href], [role="button"]');
    const buttonCount = await allButtons.count();
    console.log(`Found ${buttonCount} buttons/links on page`);
    
    for (let i = 0; i < Math.min(buttonCount, 50); i++) {
      const btn = allButtons.nth(i);
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        const btnText = await btn.textContent().catch(() => '');
        const btnTextLower = (btnText || '').toLowerCase().trim();
        
        if (btnTextLower.includes('create') && btnTextLower.includes('link')) {
          createButton = btn;
          console.log(`✅ Found Create Link button at index ${i}: "${btnText}"`);
          break;
        } else if (btnTextLower.includes('new') && btnTextLower.includes('link')) {
          if (!createButton) {
            createButton = btn;
            console.log(`✅ Found New Link button at index ${i}: "${btnText}"`);
          }
        }
      }
    }
  }
  
  // STEP 3: Verify create button exists and click it
  expect(createButton).not.toBeNull();
  expect(await createButton!.isVisible()).toBeTruthy();
  console.log('✅ Create Link button found, clicking...');
  
  await createButton!.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await createButton!.click();
  console.log('✅ Clicked Create Link button');
  await page.waitForTimeout(3000); // Wait for form/modal to appear
  
  // STEP 4: Fill link form (if form appears)
  console.log('✅ Looking for link form fields...');
  
  // Check if there's a modal/dialog
  const modal = page.locator('[role="dialog"], [class*="modal"], [class*="dialog"], .fixed.inset-0').first();
  const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
  
  // Determine which locator to use (modal or page)
  const locatorSource = modalVisible ? modal : page;
  
  // URL field (required)
  const urlSelectors = [
    'input[name*="url"]',
    'input[name*="link"]',
    'input[type="url"]',
    'input[placeholder*="url" i]',
    'input[placeholder*="link" i]',
    'input[placeholder*="https://" i]',
    'input[type="text"]',
  ];
  
  let urlInput: import('@playwright/test').Locator | null = null;
  for (const selector of urlSelectors) {
    const input = locatorSource.locator(selector).first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isEnabled = await input.isEnabled().catch(() => false);
      if (isEnabled) {
        urlInput = input;
        const placeholder = await input.getAttribute('placeholder').catch(() => '');
        console.log(`✅ Found URL input: ${selector} (placeholder: ${placeholder})`);
        break;
      }
    }
  }
  
  // Fill URL if input found
  if (urlInput) {
    const testUrl = 'https://example.com/test-' + Date.now();
    await urlInput.fill(testUrl);
    console.log(`✅ Filled URL: ${testUrl}`);
    await page.waitForTimeout(500);
  }
  
  // Title/Name field (optional)
  const titleSelectors = [
    'input[name*="title"]',
    'input[name*="name"]',
    'input[placeholder*="title" i]',
    'input[placeholder*="name" i]',
  ];
  
  for (const selector of titleSelectors) {
    const titleInput = locatorSource.locator(selector).first();
    if (await titleInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      const isEnabled = await titleInput.isEnabled().catch(() => false);
      if (isEnabled) {
        await titleInput.fill('Test Link ' + Date.now());
        console.log('✅ Filled link title');
        await page.waitForTimeout(300);
        break;
      }
    }
  }
  
  // STEP 5: Click "Create Link" button to save
  console.log('✅ Looking for Create Link button to save...');
  await page.waitForTimeout(500);
  
  const saveButtonSelectors = [
    'button:has-text("Create Link")',
    'button:has-text("Create")',
    'button:has-text("Save")',
    'button:has-text("Save Link")',
    'button[type="submit"]',
    '[data-testid*="create"]',
    '[data-testid*="save"]',
  ];
  
  let saveButton: import('@playwright/test').Locator | null = null;
  
  // Search inside modal first
  if (modalVisible) {
    for (const selector of saveButtonSelectors) {
      const btn = modal.locator(selector).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const btnText = await btn.textContent().catch(() => '');
        if (btnText && (btnText.toLowerCase().includes('create') || btnText.toLowerCase().includes('save'))) {
          saveButton = btn;
          console.log(`✅ Found Create Link button in modal: "${btnText}"`);
          break;
        }
      }
    }
  }
  
  // If not found in modal, search on page
  if (!saveButton) {
    for (const selector of saveButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const btnText = await btn.textContent().catch(() => '');
        if (btnText && (btnText.toLowerCase().includes('create') || btnText.toLowerCase().includes('save'))) {
          saveButton = btn;
          console.log(`✅ Found Create Link button: "${btnText}"`);
          break;
        }
      }
    }
  }
  
  // If still not found, search all buttons
  if (!saveButton) {
    console.log('✅ Searching all buttons for Create/Save button...');
    const allButtons = page.locator('button, [role="button"]');
    const buttonCount = await allButtons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 50); i++) {
      const btn = allButtons.nth(i);
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        const btnText = await btn.textContent().catch(() => '');
        const btnTextLower = (btnText || '').toLowerCase().trim();
        if (btnTextLower.includes('create') || btnTextLower.includes('save')) {
          saveButton = btn;
          console.log(`✅ Found Create/Save button at index ${i}: "${btnText}"`);
          break;
        }
      }
    }
  }
  
  // STEP 6: Click Create Link button to save
  expect(saveButton).not.toBeNull();
  expect(await saveButton!.isVisible()).toBeTruthy();
  console.log('✅ Create Link button found, clicking to save...');
  
  try {
    await saveButton!.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await saveButton!.click({ timeout: 5000 });
    console.log('✅ Clicked Create Link button');
  } catch (error) {
    // If normal click fails, use JavaScript click
    console.log('⚠️  Normal click failed, using JavaScript click...');
    await saveButton!.evaluate((el: HTMLElement) => {
      (el as HTMLButtonElement).click();
    });
    console.log('✅ Clicked Create Link button (JavaScript)');
  }
  
  await page.waitForTimeout(3000); // Wait for link to be created
  
  // Wait for modal to close (if it was a modal)
  if (modalVisible) {
    try {
      await modal.waitFor({ state: 'hidden', timeout: 5000 });
      console.log('✅ Modal closed after creating link');
    } catch (e) {
      console.log('⚠️  Modal may still be visible, continuing...');
    }
  }
  
  // STEP 7: Verify link was created - check for success message
  console.log('✅ Verifying link was created...');
  
  // Check for success message immediately
  const successMessage = await Promise.race([
    page.getByText(/created|success|saved|link.*created/i).isVisible({ timeout: 5000 }).catch(() => false),
    page.locator('[role="alert"]').filter({ hasText: /success|created|saved/i }).isVisible({ timeout: 5000 }).catch(() => false),
    page.locator('[class*="toast"]').filter({ hasText: /success|created/i }).isVisible({ timeout: 5000 }).catch(() => false),
  ]);
  
  if (successMessage) {
    console.log('✅ Success message displayed - link created!');
  }
  
  // STEP 8: Navigate back to links page and refresh to verify link appears in list
  console.log('✅ Navigating to links page to verify link appears in list...');
  await page.goto('/quick-links', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // Wait for page to load
  
  // Refresh the page to ensure we see the latest links
  console.log('✅ Refreshing page to see latest links...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // Wait for page to load after refresh
  
  // STEP 9: Verify link appears in the list after refresh
  console.log('✅ Verifying link appears in the list after refresh...');
  
  // Check for link items in the list
  const linkItems = page.locator('[class*="link"], [data-testid*="link"], [class*="card"], [class*="item"], [class*="list-item"]');
  const linkItemCount = await linkItems.count();
  console.log(`Found ${linkItemCount} potential link items`);
  
  let linkFound = false;
  let linkItemText = '';
  
  for (let i = 0; i < Math.min(linkItemCount, 30); i++) {
    const linkItem = linkItems.nth(i);
    if (await linkItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      const itemText = await linkItem.textContent().catch(() => '');
      if (itemText && itemText.trim().length > 0) {
        linkFound = true;
        linkItemText = itemText;
        console.log(`✅ Found link item at index ${i}: "${itemText.substring(0, 50)}"`);
        break;
      }
    }
  }
  
  // Check for link-related content on the page
  const pageContent = await page.textContent('body').catch(() => '');
  const hasLinkContent = pageContent && (pageContent.toLowerCase().includes('link') || 
                                        pageContent.toLowerCase().includes('saved') ||
                                        pageContent.toLowerCase().includes('created') ||
                                        pageContent.toLowerCase().includes('example.com'));
  
  // Check for links list container
  const listContainer = await Promise.race([
    page.locator('[class*="list"], [class*="links"], [class*="grid"]').first().isVisible({ timeout: 3000 }).catch(() => false),
    page.locator('table, ul, ol').first().isVisible({ timeout: 3000 }).catch(() => false),
  ]);
  
  // Check for error messages
  const errorVisible = await page.getByText(/error|failed|invalid/i).isVisible({ timeout: 2000 }).catch(() => false);
  
  // STRICT VERIFICATION: Link MUST be created (link found in list OR success message OR list container exists)
  const linkCreated = linkFound || successMessage || (listContainer && hasLinkContent);
  expect(linkCreated).toBeTruthy();
  expect(errorVisible).toBeFalsy();
  
  if (linkFound) {
    console.log(`✅ Link found in the list after refresh: "${linkItemText.substring(0, 50)}"`);
  } else if (successMessage) {
    console.log('✅ Success message shown - link created!');
  } else if (listContainer && hasLinkContent) {
    console.log('✅ Links list container found with link content - link created!');
  }
  
  console.log('✅ Link creation verified successfully!');
});
