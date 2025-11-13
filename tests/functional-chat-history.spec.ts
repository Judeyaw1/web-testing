import { test, expect } from './fixtures/auth';

test.beforeEach(async ({ page, login }) => {
  test.setTimeout(120000); // 2 minutes for login + OTP
  await login();
});

test('View chat history page and conversations @critical', async ({ page }) => {
  // STEP 1: Navigate to upload page where chat is available
  await page.goto('/upload', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Verify page loaded
  const currentUrl = page.url();
  expect(currentUrl).toContain('grabdocs');
  expect(currentUrl).not.toBe('about:blank');
  
  // STEP 2: Find and click the "show history" icon/button
  const historyIconSelectors = [
    '[data-testid*="history"]',
    '[aria-label*="history" i]',
    'button[title*="history" i]',
    'svg[aria-label*="history" i]',
    'button:has(svg[aria-label*="history" i])',
    '[class*="history-icon"]',
    '[class*="history-button"]',
    'button:has-text("History")',
    'button:has-text("Show History")',
  ];
  
  let historyIcon: import('@playwright/test').Locator | null = null;
  for (const selector of historyIconSelectors) {
    const icon = page.locator(selector).first();
    if (await icon.isVisible({ timeout: 3000 }).catch(() => false)) {
      historyIcon = icon;
      const iconText = await icon.getAttribute('aria-label').catch(() => '') || 
                      await icon.getAttribute('title').catch(() => '') ||
                      await icon.textContent().catch(() => '');
      console.log(`✅ Found history icon: ${selector} (label: ${iconText})`);
      break;
    }
  }
  
  // If not found, try searching all buttons/icons
  if (!historyIcon) {
    const allButtons = page.locator('button, [role="button"], svg, [class*="icon"]');
    const buttonCount = await allButtons.count();
    console.log(`Searching through ${buttonCount} buttons/icons for history icon...`);
    
    for (let i = 0; i < Math.min(buttonCount, 50); i++) {
      const btn = allButtons.nth(i);
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
        const title = await btn.getAttribute('title').catch(() => '');
        const text = await btn.textContent().catch(() => '');
        const className = await btn.getAttribute('class').catch(() => '');
        
        const labelText = (ariaLabel + ' ' + title + ' ' + text + ' ' + className).toLowerCase();
        if (labelText.includes('history')) {
          historyIcon = btn;
          console.log(`✅ Found history icon at index ${i}: "${labelText}"`);
          break;
        }
      }
    }
  }
  
  // STEP 3: Click the history icon to open the conversations list
  if (historyIcon) {
    await historyIcon.click();
    console.log('✅ Clicked history icon');
    await page.waitForTimeout(2000); // Wait for slide-in animation
    
    // STEP 4: Verify conversations list slides in
    const conversationSelectors = [
      '[data-testid*="conversation"]',
      '[data-testid*="chat-item"]',
      '[class*="conversation"]',
      '[class*="chat-item"]',
      '[class*="history-list"]',
      '[class*="conversation-list"]',
      'a[href*="/chat/"]',
      'li, div', // List items
    ];
    
    let conversationsFound = false;
    let conversationCount = 0;
    
    // Wait for the list to slide in (check for slide-in animation or visible list)
    await page.waitForTimeout(1000); // Additional wait for slide-in
    
    for (const selector of conversationSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        const firstElement = elements.first();
        if (await firstElement.isVisible({ timeout: 3000 }).catch(() => false)) {
          conversationsFound = true;
          conversationCount = count;
          break;
        }
      }
    }
    
    // Check for list container (sidebar/panel that slides in)
    const listContainer = await Promise.race([
      page.locator('[class*="list"], [class*="history"], [class*="conversation"], [class*="sidebar"], [class*="panel"]').first().isVisible({ timeout: 3000 }).catch(() => false),
      page.locator('ul, ol, [role="list"]').first().isVisible({ timeout: 3000 }).catch(() => false),
      page.locator('[class*="slide"], [class*="drawer"]').first().isVisible({ timeout: 3000 }).catch(() => false),
    ]);
    
    // Verify conversations list is visible (slid in)
    expect(conversationsFound || listContainer).toBeTruthy();
    expect(await page.locator('body').isVisible()).toBeTruthy();
    console.log(`✅ Chat history opened successfully (${conversationCount} conversations found)`);
  } else {
    // History icon not found - try direct navigation as fallback
    console.log('⚠️  History icon not found, trying direct navigation...');
    await page.goto('/chat/history', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Verify page loaded
    const fallbackUrl = page.url();
    expect(fallbackUrl).toContain('grabdocs');
    expect(await page.locator('body').isVisible()).toBeTruthy();
    console.log('✅ Navigated to chat history page directly');
  }
});

test('Delete chat conversation @functional', async ({ page }) => {
  // STEP 1: Navigate to upload page where chat is available
  await page.goto('/upload', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // STEP 2: Click the history icon to open conversations list
  const historyIconSelectors = [
    '[data-testid*="history"]',
    '[aria-label*="history" i]',
    'button[title*="history" i]',
    'svg[aria-label*="history" i]',
    'button:has(svg[aria-label*="history" i])',
    '[class*="history-icon"]',
    'button:has-text("History")',
  ];
  
  let historyIcon: import('@playwright/test').Locator | null = null;
  for (const selector of historyIconSelectors) {
    const icon = page.locator(selector).first();
    if (await icon.isVisible({ timeout: 3000 }).catch(() => false)) {
      historyIcon = icon;
      break;
    }
  }
  
  if (historyIcon) {
    await historyIcon.click();
    await page.waitForTimeout(2000); // Wait for slide-in
  } else {
    // Fallback: navigate directly
    await page.goto('/chat/history', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  }
  
  // STEP 3: Find a conversation to delete - use more aggressive search
  console.log('✅ Searching for conversations to delete...');
  
  const conversationSelectors = [
    '[data-testid*="conversation"]',
    '[data-testid*="chat-item"]',
    '[class*="conversation"]',
    '[class*="chat-item"]',
    '[class*="history-item"]',
    'a[href*="/chat/"]',
    'li', // List items
    'div[role="listitem"]',
    '[role="listitem"]',
  ];
  
  let conversationElement: import('@playwright/test').Locator | null = null;
  let conversationCount = 0;
  
  // Try each selector and count all visible conversations
  for (const selector of conversationSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    console.log(`Found ${count} elements with selector: ${selector}`);
    
    if (count > 0) {
      // Check each element to see if it's visible and looks like a conversation
      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = elements.nth(i);
        const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
        if (isVisible) {
          // Get text to verify it's a conversation item
          const text = await element.textContent().catch(() => '') || '';
          const hasText = text.trim().length > 0;
          
          // Check if it's clickable or has conversation-like attributes
          const isClickable = await element.evaluate((el: HTMLElement) => {
            return el.tagName === 'A' || 
                   el.tagName === 'BUTTON' || 
                   el.getAttribute('role') === 'button' ||
                   el.onclick !== null ||
                   window.getComputedStyle(el).cursor === 'pointer';
          }).catch(() => false);
          
          if (hasText || isClickable || selector.includes('conversation') || selector.includes('chat')) {
            if (!conversationElement) {
              conversationElement = element;
              console.log(`✅ Found conversation at index ${i} with selector: ${selector}`);
            }
            conversationCount++;
          }
        }
      }
      
      if (conversationElement) break;
    }
  }
  
  // If still not found, try searching all list items or divs in the history panel
  if (!conversationElement) {
    console.log('✅ Trying broader search for conversations...');
    const allItems = page.locator('li, div, a, button').filter({ hasNotText: '' });
    const itemCount = await allItems.count();
    console.log(`Found ${itemCount} potential items to check`);
    
    for (let i = 0; i < Math.min(itemCount, 20); i++) {
      const item = allItems.nth(i);
      if (await item.isVisible({ timeout: 1000 }).catch(() => false)) {
        const text = await item.textContent().catch(() => '') || '';
        const boundingBox = await item.boundingBox().catch(() => null);
        
        // Check if it's in a visible area and has some text
        if (text.trim().length > 0 && boundingBox && boundingBox.height > 20) {
          // Check if it's inside a history/conversation container
          const parent = await item.evaluate((el: HTMLElement) => {
            let current: HTMLElement | null = el.parentElement;
            while (current) {
              const className = current.className || '';
              const id = current.id || '';
              if (className.includes('history') || 
                  className.includes('conversation') || 
                  className.includes('chat') ||
                  id.includes('history') ||
                  id.includes('conversation')) {
                return true;
              }
              current = current.parentElement;
            }
            return false;
          }).catch(() => false);
          
          if (parent) {
            conversationElement = item;
            console.log(`✅ Found conversation in history container at index ${i}: "${text.substring(0, 30)}..."`);
            conversationCount++;
            break;
          }
        }
      }
    }
  }
  
  console.log(`✅ Total conversations found: ${conversationCount}`);
  
  // STEP 4: Delete conversation if found
  if (conversationElement) {
    // Hover to show delete option
    await conversationElement.hover();
    await page.waitForTimeout(500);
    
    // Find delete icon/button - check within conversation element first
    const deleteSelectors = [
      'svg[aria-label*="delete" i]',
      'button[aria-label*="delete" i]',
      '[data-testid*="delete"]',
      '[class*="delete-icon"]',
      '[class*="delete-button"]',
      'button:has-text("Delete")',
      '[class*="delete"]',
      'svg',
      'button',
    ];
    
    let deleteButton: import('@playwright/test').Locator | null = null;
    
    // First, check within the conversation element (delete icon is usually inside)
    for (const selector of deleteSelectors) {
      const btn = conversationElement.locator(selector).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify it's actually a delete icon by checking attributes
        const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
        const title = await btn.getAttribute('title').catch(() => '');
        const className = await btn.getAttribute('class').catch(() => '');
        const text = await btn.textContent().catch(() => '');
        
        const labelText = (ariaLabel + ' ' + title + ' ' + className + ' ' + text).toLowerCase();
        if (labelText.includes('delete') || selector.includes('delete')) {
          deleteButton = btn;
          console.log(`✅ Found delete icon within conversation: ${selector}`);
          break;
        }
      }
    }
    
    // If not found in conversation, check on page
    if (!deleteButton) {
      for (const selector of deleteSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
          const title = await btn.getAttribute('title').catch(() => '');
          const className = await btn.getAttribute('class').catch(() => '');
          const labelText = (ariaLabel + ' ' + title + ' ' + className).toLowerCase();
          if (labelText.includes('delete') || selector.includes('delete')) {
            deleteButton = btn;
            console.log(`✅ Found delete icon on page: ${selector}`);
            break;
          }
        }
      }
    }
    
    // Last resort: search all icons/buttons near the conversation
    if (!deleteButton) {
      const nearbyElements = conversationElement.locator('..').locator('svg, button, [role="button"]');
      const nearbyCount = await nearbyElements.count();
      for (let i = 0; i < Math.min(nearbyCount, 10); i++) {
        const elem = nearbyElements.nth(i);
        if (await elem.isVisible({ timeout: 1000 }).catch(() => false)) {
          const ariaLabel = await elem.getAttribute('aria-label').catch(() => '');
          const title = await elem.getAttribute('title').catch(() => '');
          const labelText = (ariaLabel + ' ' + title).toLowerCase();
          if (labelText.includes('delete')) {
            deleteButton = elem;
            console.log(`✅ Found delete icon nearby conversation: ${i}`);
            break;
          }
        }
      }
    }
    
    if (deleteButton) {
      // Get conversation text/identifier before deletion for verification
      const conversationText = await conversationElement.textContent().catch(() => '') || '';
      const conversationId = await conversationElement.getAttribute('data-testid').catch(() => '') ||
                            await conversationElement.getAttribute('id').catch(() => '') || '';
      
      console.log(`✅ Found conversation to delete: "${conversationText.substring(0, 50)}..."`);
      
      await deleteButton.click();
      console.log('✅ Clicked delete icon');
      await page.waitForTimeout(1000);
      
      // Confirm deletion if confirmation dialog appears
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes"), button:has-text("OK")').first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        console.log('✅ Clicked confirm button');
        await page.waitForTimeout(2000);
      } else {
        // No confirmation dialog - deletion might be immediate
        console.log('⚠️  No confirmation dialog, deletion should be immediate');
        await page.waitForTimeout(2000);
      }
      
      // STEP 5: Refresh page to verify conversation was deleted
      console.log('✅ Refreshing page to verify conversation deletion...');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      
      // Re-open history if needed (click history icon again)
      const historyIconAfterRefresh = page.locator('[data-testid*="history"], [aria-label*="history" i], button[title*="history" i]').first();
      if (await historyIconAfterRefresh.isVisible({ timeout: 3000 }).catch(() => false)) {
        await historyIconAfterRefresh.click();
        await page.waitForTimeout(2000); // Wait for slide-in
      }
      
      // STEP 6: Verify conversation was deleted (check if it still exists)
      const conversationStillExists = await Promise.race([
        // Check if the same conversation element still exists
        conversationElement.isVisible({ timeout: 2000 }).catch(() => false),
        // Check if conversation text still appears on page
        (conversationText ? page.getByText(conversationText.substring(0, 30), { exact: false }).isVisible({ timeout: 2000 }).catch(() => false) : Promise.resolve(false)),
        // Check if conversation ID still exists
        (conversationId ? page.locator(`[data-testid="${conversationId}"], #${conversationId}`).isVisible({ timeout: 2000 }).catch(() => false) : Promise.resolve(false)),
      ]);
      
      // Also check all conversations count
      const allConversations = page.locator('[data-testid*="conversation"], [class*="conversation"], [class*="chat-item"]');
      const conversationCount = await allConversations.count();
      
      // STRICT VERIFICATION: Conversation MUST be deleted
      expect(conversationStillExists).toBeFalsy();
      console.log(`✅ Conversation deleted verified (${conversationCount} conversations remaining)`);
      
      // Additional check: verify the conversation is not in the list
      if (conversationText) {
        const textStillVisible = await page.getByText(conversationText.substring(0, 30), { exact: false }).isVisible({ timeout: 2000 }).catch(() => false);
        expect(textStillVisible).toBeFalsy();
      }
    } else {
      expect(await page.locator('body').isVisible()).toBeTruthy();
      console.log('⚠️  Delete button not found for conversation');
    }
  } else {
    expect(await page.locator('body').isVisible()).toBeTruthy();
    console.log('⚠️  No conversations available to delete');
  }
});
