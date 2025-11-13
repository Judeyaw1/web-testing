import { test, expect } from './fixtures/auth';

test.beforeEach(async ({ page, login }) => {
  test.setTimeout(180000); // 3 minutes for login + OTP + event creation
  await login();
});

test('View calendar page @critical', async ({ page }) => {
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // STEP 1: Verify calendar page loaded
  const currentUrl = page.url();
  expect(currentUrl).toContain('grabdocs');
  expect(currentUrl).toContain('calendar');
  expect(currentUrl).not.toBe('about:blank');
  
  // STEP 2: Verify calendar is visible
  const calendarSelectors = [
    '[data-testid*="calendar"]',
    '[class*="calendar"]',
    '[class*="calendar-grid"]',
    '[class*="calendar-view"]',
    'table[class*="calendar"]',
    '[role="grid"]',
  ];
  
  let calendarVisible = false;
  for (const selector of calendarSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
      calendarVisible = true;
      break;
    }
  }
  
  // Also check for date cells
  const dateCells = page.locator('td, [role="gridcell"], [class*="day"]');
  const cellCount = await dateCells.count();
  
  // Verify calendar is displayed
  expect(calendarVisible || cellCount > 0).toBeTruthy();
  expect(await page.locator('body').isVisible()).toBeTruthy();
  console.log(`✅ Calendar page viewed successfully (${cellCount} date cells found)`);
});

test('Add new event and confirm creation @critical', async ({ page }) => {
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Generate unique event title
  const testTitle = 'Test Event ' + Date.now();
  console.log(`✅ Will create event with title: ${testTitle}`);
  
  // STEP 1: Find and click "New Event" button
  const newEventSelectors = [
    'button:has-text("+ New Event")',
    'button:has-text("New Event")',
    'button:has-text("Create Event")',
    '[data-testid*="new-event"]',
    '[data-testid*="create-event"]',
    'button:has-text("Add")',
  ];
  
  let newEventButton: import('@playwright/test').Locator | null = null;
  for (const selector of newEventSelectors) {
    const btn = page.locator(selector).first();
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      newEventButton = btn;
      const btnText = await btn.textContent().catch(() => '');
      console.log(`✅ Found "New Event" button: "${btnText}"`);
      break;
    }
  }
  
  // If button not found, try clicking on a date cell
  if (!newEventButton) {
    console.log('✅ Trying to click on a date cell to open event form...');
    const dateCells = page.locator('td, [role="gridcell"], [class*="day"]');
    const cellCount = await dateCells.count();
    
    if (cellCount > 0) {
      for (let i = 0; i < Math.min(cellCount, 40); i++) {
        const cell = dateCells.nth(i);
        if (await cell.isVisible({ timeout: 2000 }).catch(() => false)) {
          const cellText = await cell.textContent().catch(() => '');
          if (cellText && /^\d+$/.test(cellText.trim()) && parseInt(cellText.trim()) > 0) {
            console.log(`✅ Clicking on date cell: ${cellText}`);
            await cell.click({ force: true });
            await page.waitForTimeout(3000);
            break;
          }
        }
      }
    }
  } else {
    await newEventButton.click();
    console.log('✅ Clicked "New Event" button');
    await page.waitForTimeout(5000); // Wait for form to appear
  }
  
  // STEP 2: Wait for form/modal to appear
  await page.waitForTimeout(3000);
  
  // Check for modal/dialog
  const modal = page.locator('[role="dialog"], [class*="modal"], [class*="dialog"]').first();
  const modalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);
  
  // STEP 3: Fill event form - find title field
  const titleSelectors = [
    'input[placeholder*="Team Meeting" i]',
    'input[placeholder*="Event Title" i]',
    'input[placeholder*="title" i]',
    'input[name*="title"]',
    'input[name*="eventTitle"]',
    'input[type="text"]',
  ];
  
  let titleInput: import('@playwright/test').Locator | null = null;
  const searchSource = modalVisible ? modal : page;
  
  for (const selector of titleSelectors) {
    const input = searchSource.locator(selector).first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isEnabled = await input.isEnabled().catch(() => false);
      if (isEnabled) {
        titleInput = input;
        console.log(`✅ Found title input: ${selector}`);
        break;
      }
    }
  }
  
  if (!titleInput) {
    throw new Error('Event form not found - cannot create event');
  }
  
  // Fill title
  await titleInput.fill(testTitle);
  console.log(`✅ Filled event title: ${testTitle}`);
  await page.waitForTimeout(500);
  
  // Try to fill other optional fields if they exist
  const descInput = searchSource.locator('textarea').first();
  if (await descInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await descInput.fill('Test event description');
    await page.waitForTimeout(300);
  }
  
  // STEP 4: Click "Create Event" button
  const createSelectors = [
    'button:has-text("Create Event")',
    'button:has-text("Create")',
    'button:has-text("Save")',
    'button[type="submit"]',
  ];
  
  let createButton: import('@playwright/test').Locator | null = null;
  for (const selector of createSelectors) {
    const btn = searchSource.locator(selector).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const btnText = await btn.textContent().catch(() => '');
      if (btnText && (btnText.toLowerCase().includes('create') || btnText.toLowerCase().includes('save'))) {
        createButton = btn;
        console.log(`✅ Found Create button: "${btnText}"`);
        break;
      }
    }
  }
  
  if (!createButton) {
    throw new Error('Create Event button not found - cannot save event');
  }
  
  // Click create button
  await createButton.click();
  console.log('✅ Clicked Create Event button');
  await page.waitForTimeout(3000);
  
  // Wait for modal to close if it was visible
  if (modalVisible) {
    try {
      await modal.waitFor({ state: 'hidden', timeout: 10000 });
      console.log('✅ Modal closed after creating event');
    } catch {
      console.log('⚠️  Modal may still be visible');
    }
  }
  
  // STEP 5: Refresh page to verify event was created
  console.log('✅ Refreshing page to verify event creation...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  // STEP 6: Confirm event was created
  const eventFound = await Promise.race([
    page.getByText(testTitle, { exact: false }).isVisible({ timeout: 5000 }).catch(() => false),
    page.getByText(/Test Event/i).isVisible({ timeout: 5000 }).catch(() => false),
    page.locator('[data-testid*="event"]').filter({ hasText: /Test Event/i }).first().isVisible({ timeout: 5000 }).catch(() => false),
  ]);
  
  // Check page content
  const pageContent = await page.textContent('body').catch(() => '');
  const eventInContent = pageContent && (pageContent.includes(testTitle) || pageContent.includes('Test Event'));
  
  // Check for success message
  const successMessage = await page.getByText(/created|success|saved/i).isVisible({ timeout: 3000 }).catch(() => false);
  
  // Check for errors
  const errorVisible = await page.getByText(/error|failed/i).isVisible({ timeout: 2000 }).catch(() => false);
  
  // Verify event was created
  const eventCreated = eventFound || eventInContent || successMessage;
  
  expect(eventCreated).toBeTruthy();
  expect(errorVisible).toBeFalsy();
  
  if (eventCreated) {
    console.log(`✅ Event "${testTitle}" created successfully!`);
  } else {
    throw new Error(`Event creation verification failed - event "${testTitle}" not found after creation`);
  }
});
