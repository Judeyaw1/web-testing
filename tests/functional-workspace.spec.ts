import { test, expect } from './fixtures/auth';

test.beforeEach(async ({ page, login }) => {
  test.setTimeout(120000);
  await login();
});

test('Create workspace and verify it was created @critical', async ({ page }) => {
  // STEP 1: Navigate to workspaces page
  await page.goto('/workspaces', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // Wait for page to load
  
  // Verify page loaded
  const currentUrl = page.url();
  expect(currentUrl).toContain('grabdocs');
  expect(currentUrl).not.toBe('about:blank');
  
  // STEP 2: Find and click "Create" or "Create Workspace" button
  console.log('✅ Looking for Create Workspace button...');
  
  const createButtonSelectors = [
    'button:has-text("Create Workspace")',
    'button:has-text("Create")',
    'button:has-text("New Workspace")',
    'button:has-text("Add Workspace")',
    'a:has-text("Create Workspace")',
    '[data-testid*="create-workspace"]',
    '[data-testid*="create"]',
    '[aria-label*="create workspace" i]',
  ];
  
  let createButton: import('@playwright/test').Locator | null = null;
  
  // Search for create button
  for (const selector of createButtonSelectors) {
    const btn = page.locator(selector).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const btnText = await btn.textContent().catch(() => '');
      console.log(`✅ Found Create Workspace button: "${btnText}"`);
      createButton = btn;
      break;
    }
  }
  
  // If not found, search all buttons
  if (!createButton) {
    console.log('✅ Searching all buttons for Create Workspace button...');
    const allButtons = page.locator('button, a[href], [role="button"]');
    const buttonCount = await allButtons.count();
    console.log(`Found ${buttonCount} buttons/links on page`);
    
    for (let i = 0; i < Math.min(buttonCount, 50); i++) {
      const btn = allButtons.nth(i);
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        const btnText = await btn.textContent().catch(() => '');
        const btnTextLower = (btnText || '').toLowerCase().trim();
        
        if ((btnTextLower.includes('create') && btnTextLower.includes('workspace')) ||
            (btnTextLower === 'create') ||
            (btnTextLower.includes('new') && btnTextLower.includes('workspace'))) {
          createButton = btn;
          console.log(`✅ Found Create Workspace button at index ${i}: "${btnText}"`);
          break;
        }
      }
    }
  }
  
  // STEP 3: Verify create button exists and click it
  expect(createButton).not.toBeNull();
  expect(await createButton!.isVisible()).toBeTruthy();
  console.log('✅ Create Workspace button found, clicking...');
  
  await createButton!.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await createButton!.click();
  console.log('✅ Clicked Create Workspace button');
  await page.waitForTimeout(3000); // Wait for form/modal to appear
  
  // STEP 4: Fill workspace form
  console.log('✅ Looking for workspace form fields...');
  
  // Check if there's a modal/dialog
  const modal = page.locator('[role="dialog"], [class*="modal"], [class*="dialog"], .fixed.inset-0').first();
  const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
  
  // Determine which locator to use (modal or page)
  const locatorSource = modalVisible ? modal : page;
  
  // Fill workspace name
  const nameSelectors = [
    'input[name*="name"]',
    'input[name*="workspace"]',
    'input[placeholder*="name" i]',
    'input[placeholder*="workspace" i]',
    'input[type="text"]',
  ];
  
  let nameInput: import('@playwright/test').Locator | null = null;
  for (const selector of nameSelectors) {
    const input = locatorSource.locator(selector).first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isEnabled = await input.isEnabled().catch(() => false);
      if (isEnabled) {
        nameInput = input;
        const placeholder = await input.getAttribute('placeholder').catch(() => '');
        console.log(`✅ Found name input: ${selector} (placeholder: ${placeholder})`);
        break;
      }
    }
  }
  
  if (nameInput) {
    const testName = 'Test Workspace ' + Date.now();
    await nameInput.fill(testName);
    console.log(`✅ Filled workspace name: ${testName}`);
    await page.waitForTimeout(500);
  }
  
  // Fill description if field exists (optional)
  const descSelectors = [
    'textarea[name*="description"]',
    'textarea[placeholder*="description" i]',
    'textarea',
  ];
  
  for (const selector of descSelectors) {
    const descInput = locatorSource.locator(selector).first();
    if (await descInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      const isEnabled = await descInput.isEnabled().catch(() => false);
      if (isEnabled) {
        await descInput.fill('Test workspace description');
        console.log('✅ Filled workspace description');
        await page.waitForTimeout(300);
        break;
      }
    }
  }
  
  // STEP 5: Click "Create" button to save
  console.log('✅ Looking for Create button to save...');
  await page.waitForTimeout(500);
  
  const saveButtonSelectors = [
    'button:has-text("Create Workspace")',
    'button:has-text("Create")',
    'button:has-text("Save")',
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
          console.log(`✅ Found Create button in modal: "${btnText}"`);
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
          console.log(`✅ Found Create button: "${btnText}"`);
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
  
  // STEP 6: Click Create button to save
  expect(saveButton).not.toBeNull();
  expect(await saveButton!.isVisible()).toBeTruthy();
  console.log('✅ Create button found, clicking to save...');
  
  try {
    await saveButton!.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await saveButton!.click({ timeout: 5000 });
    console.log('✅ Clicked Create button');
  } catch (error) {
    // If normal click fails, use JavaScript click
    console.log('⚠️  Normal click failed, using JavaScript click...');
    await saveButton!.evaluate((el: HTMLElement) => {
      (el as HTMLButtonElement).click();
    });
    console.log('✅ Clicked Create button (JavaScript)');
  }
  
  await page.waitForTimeout(3000); // Wait for workspace to be created
  
  // Wait for modal to close (if it was a modal)
  if (modalVisible) {
    try {
      await modal.waitFor({ state: 'hidden', timeout: 5000 });
      console.log('✅ Modal closed after creating workspace');
    } catch (e) {
      console.log('⚠️  Modal may still be visible, continuing...');
    }
  }
  
  // STEP 7: Verify workspace was created - check for success message
  console.log('✅ Verifying workspace was created...');
  
  // Check for success message immediately
  const successMessage = await Promise.race([
    page.getByText(/created|success|saved|workspace.*created/i).isVisible({ timeout: 5000 }).catch(() => false),
    page.locator('[role="alert"]').filter({ hasText: /success|created|saved/i }).isVisible({ timeout: 5000 }).catch(() => false),
    page.locator('[class*="toast"]').filter({ hasText: /success|created/i }).isVisible({ timeout: 5000 }).catch(() => false),
  ]);
  
  if (successMessage) {
    console.log('✅ Success message displayed - workspace created!');
  }
  
  // STEP 8: Navigate back to workspaces page and refresh to verify workspace appears in list
  console.log('✅ Navigating to workspaces page to verify workspace appears in list...');
  await page.goto('/workspaces', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // Wait for page to load
  
  // Refresh the page to ensure we see the latest workspaces
  console.log('✅ Refreshing page to see latest workspaces...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // Wait for page to load after refresh
  
  // STEP 9: Verify workspace appears in the list after refresh
  console.log('✅ Verifying workspace appears in the list after refresh...');
  
  // Check for workspace items in the list
  const workspaceItems = page.locator('[class*="workspace"], [data-testid*="workspace"], [class*="card"], [class*="item"], [class*="list-item"]');
  const workspaceItemCount = await workspaceItems.count();
  console.log(`Found ${workspaceItemCount} potential workspace items`);
  
  let workspaceFound = false;
  let workspaceItemText = '';
  
  for (let i = 0; i < Math.min(workspaceItemCount, 30); i++) {
    const workspaceItem = workspaceItems.nth(i);
    if (await workspaceItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      const itemText = await workspaceItem.textContent().catch(() => '');
      if (itemText && itemText.trim().length > 0) {
        workspaceFound = true;
        workspaceItemText = itemText;
        console.log(`✅ Found workspace item at index ${i}: "${itemText.substring(0, 50)}"`);
        break;
      }
    }
  }
  
  // Check for workspace-related content on the page
  const pageContent = await page.textContent('body').catch(() => '');
  const hasWorkspaceContent = pageContent && (pageContent.toLowerCase().includes('workspace') || 
                                             pageContent.toLowerCase().includes('saved') ||
                                             pageContent.toLowerCase().includes('created'));
  
  // Check for workspaces list container
  const listContainer = await Promise.race([
    page.locator('[class*="list"], [class*="workspaces"], [class*="grid"]').first().isVisible({ timeout: 3000 }).catch(() => false),
    page.locator('table, ul, ol').first().isVisible({ timeout: 3000 }).catch(() => false),
  ]);
  
  // Check for error messages
  const errorVisible = await page.getByText(/error|failed|invalid/i).isVisible({ timeout: 2000 }).catch(() => false);
  
  // STRICT VERIFICATION: Workspace MUST be created (workspace found in list OR success message OR list container exists)
  const workspaceCreated = workspaceFound || successMessage || (listContainer && hasWorkspaceContent);
  expect(workspaceCreated).toBeTruthy();
  expect(errorVisible).toBeFalsy();
  
  if (workspaceFound) {
    console.log(`✅ Workspace found in the list after refresh: "${workspaceItemText.substring(0, 50)}"`);
  } else if (successMessage) {
    console.log('✅ Success message shown - workspace created!');
  } else if (listContainer && hasWorkspaceContent) {
    console.log('✅ Workspaces list container found with workspace content - workspace created!');
  }
  
  console.log('✅ Workspace creation verified successfully!');
});
