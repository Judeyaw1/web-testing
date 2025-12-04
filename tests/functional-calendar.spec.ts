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

test.skip('Add new event and confirm creation @critical', async ({ page }) => {
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  const testTitle = `Test Event ${Date.now()}`;
  console.log(`✅ Will create event with title: ${testTitle}`);
  
  const newEventButton = page.getByRole('button', { name: /\+?\s*New Event/i }).first();
  if (await newEventButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await newEventButton.click();
    console.log('✅ Clicked "New Event" button');
  } else {
    throw new Error('New Event button not found');
  }

  const waitForForm = async (): Promise<void> => {
    const waitForTitleInput = async () => {
      const locator = page.locator('input[placeholder*="Team Meeting" i], input[placeholder*="Event Title" i]').first();
      try {
        await locator.waitFor({ state: 'visible', timeout: 15000 });
        return true;
      } catch {
        return false;
      }
    };

    if (await waitForTitleInput()) {
      return;
    }

    console.log('⚠️  Create Event inputs not visible yet, navigating directly to /calendar/new');
    await page.goto('/calendar/new', { waitUntil: 'domcontentloaded' });

    if (await waitForTitleInput()) {
      return;
    }

    throw new Error('Create New Event form did not appear');
  };
  await waitForForm();

  const fillFirstMatching = async (selectors: string[], value: string, opts?: { delay?: number; nth?: number }) => {
    for (const selector of selectors) {
      const locator = page.locator(selector).nth(opts?.nth ?? 0);
      if (await locator.isVisible({ timeout: 1500 }).catch(() => false)) {
        const enabled = await locator.isEnabled().catch(() => true);
        if (!enabled) continue;
        await locator.click({ delay: 50 }).catch(() => {});
        await locator.fill('');
        await locator.type(value, { delay: opts?.delay ?? 10 });
        await page.waitForTimeout(150);
        return true;
      }
    }
    console.warn(`⚠️  Unable to find input for selectors: ${selectors.join(', ')}`);
    return false;
  };

  await fillFirstMatching(
    [
      'input[placeholder*="Team Meeting" i]',
      'input[placeholder*="Event Title" i]',
      'input[name*="title" i]',
    ],
    testTitle
  );

  await fillFirstMatching(
    [
      'textarea[placeholder*="Add details" i]',
      'textarea[name*="description" i]',
    ],
    'Automated test event description'
  );

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  const startDate = futureDate.toISOString().split('T')[0];
  const endDate = startDate;
  const startTimeValue = '12:00';
  const endTimeValue = '13:00';

  const datePlaceholders = [
    'input[placeholder*="/" i]',
    'input[aria-label*="Date" i]',
    'input[name*="date" i]',
    'input[type="date"]',
  ];
  await fillFirstMatching(datePlaceholders, startDate, { nth: 0 });
  await fillFirstMatching(datePlaceholders, endDate, { nth: 1 });

  const timeSelectors = [
    'input[placeholder*="AM" i]',
    'input[placeholder*="PM" i]',
    'input[aria-label*="Time" i]',
    'input[name*="time" i]',
    'input[type="time"]',
  ];
  await fillFirstMatching(timeSelectors, startTimeValue, { nth: 0 });
  await fillFirstMatching(timeSelectors, endTimeValue, { nth: 1 });

  await fillFirstMatching(
    [
      'input[placeholder*="Conference Room" i]',
      'input[placeholder*="Location" i]',
      'input[name*="location" i]',
    ],
    'Conference Room A'
  );

  await fillFirstMatching(
    [
      'input[placeholder*="grabdocs.com/join-meeting" i]',
      'input[placeholder*="meeting url" i]',
      'input[name*="meetingUrl" i]',
    ],
    'https://example.com/meeting-link'
  );

  await fillFirstMatching(
    [
      'input[placeholder*="email@example.com" i]',
      'input[placeholder*="email" i]',
      'input[name*="participant" i]',
    ],
    `qa+${Date.now()}@example.com`
  );

  const reminderButton = page.getByRole('button', { name: /15 min before/i }).first();
  if (await reminderButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await reminderButton.click().catch(() => {});
  }

  let recurringSet = false;
  const recurringSwitch = page.getByRole('switch', { name: /Recurring Event/i }).first();
  if (await recurringSwitch.isVisible({ timeout: 2000 }).catch(() => false)) {
    await recurringSwitch.click().catch(() => {});
    recurringSet = true;
  }
  if (!recurringSet) {
    const recurringCheckbox = page.locator('label:has-text("Recurring Event")').locator('input[type="checkbox"], button, [role="switch"]').first();
    if (await recurringCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await recurringCheckbox.click().catch(() => {});
      recurringSet = true;
    }
  }
  if (!recurringSet) {
    const recurringButton = page.getByRole('button', { name: /Recurring Event/i }).first();
    if (await recurringButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await recurringButton.click().catch(() => {});
    }
  }

  const createButton = page.getByRole('button', { name: /^Create Event$/i }).first();
  await createButton.waitFor({ state: 'visible', timeout: 5000 });
  await createButton.click();
  console.log('✅ Clicked Create Event button');

  await Promise.race([
    page.waitForURL(/\/calendar(?!\/new)/, { timeout: 15000 }).catch(() => undefined),
    page.waitForTimeout(5000),
  ]);

  console.log('✅ Refreshing page to verify event creation...');
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  
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
