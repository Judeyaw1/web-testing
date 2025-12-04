const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const storageStatePath = path.resolve(__dirname, '../tests/.auth/storage-state.json');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: storageStatePath });
  const page = await context.newPage();

  await page.goto('https://app.grabdocs.com/calendar', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const newEventButton = page.getByText('New Event', { exact: false }).first();
  if (await newEventButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await newEventButton.click();
    await page.waitForTimeout(15000);
    const bodyHasText = await page.evaluate(() => document.body.innerText.includes('Create New Event'));
    console.log('Body contains "Create New Event"?', bodyHasText);
    console.log('URL after clicking New Event:', page.url());
    await page.screenshot({ path: 'calendar-debug.png', fullPage: true });
    await fs.promises.writeFile('calendar-debug.html', await page.content(), 'utf-8');
  }

  const frameUrls = page.frames().map((frame) => frame.url());
  console.log('Frames on page:', frameUrls);

  const eventTitleHtml = await page.getByText('Event Title', { exact: false }).first().evaluate((node) => {
    return node.parentElement ? node.parentElement.innerHTML : node.outerHTML;
  }).catch(() => 'Event title label not found');
  console.log('Event Title label HTML snippet:', eventTitleHtml);

  const customTags = await page.evaluate(() => {
    const tags = new Set();
    document.querySelectorAll('*').forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag.includes('-')) {
        tags.add(tag);
      }
    });
    return Array.from(tags);
  });
  console.log('Custom elements detected:', customTags);

  const editableNodes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[contenteditable="true"]')).map((el) => ({
      tag: el.tagName.toLowerCase(),
      className: el.className,
      dataPlaceholder: el.getAttribute('data-placeholder') || '',
      text: el.textContent || '',
    }));
  });
  console.log('Contenteditable nodes:', editableNodes);

  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, textarea')).map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || '',
      name: el.getAttribute('name') || '',
      placeholder: el.getAttribute('placeholder') || '',
      ariaLabel: el.getAttribute('aria-label') || '',
    }));
  });

  console.log('Detected inputs inside Create Event form:');
  console.table(inputs);

  await browser.close();
})().catch((error) => {
  console.error('Calendar debug script failed:', error);
  process.exit(1);
});

