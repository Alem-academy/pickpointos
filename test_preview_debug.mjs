import { test, expect } from '@playwright/test';

test('Document Preview Debug', async ({ page, context }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log('📝 Console:', msg.text());
  });
  
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'hr@pvz.kz');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/hr/**');
  
  // Go to employees and click first one
  await page.goto('http://localhost:5173/hr/employees');
  await page.waitForSelector('.bg-white');
  const firstEmployee = page.locator('.bg-white').first();
  await firstEmployee.click();
  await page.waitForURL('**/hr/employees/*');
  
  // Wait for documents
  await page.waitForSelector('text=Документы', { timeout: 10000 });
  
  // Click preview button
  const previewButton = page.locator('button[title="Просмотр"]').first();
  await previewButton.click();
  
  // Wait a bit for API call
  await page.waitForTimeout(2000);
  
  // Check if modal exists
  const modal = page.locator('[role="dialog"], .fixed.inset-0, text=Просмотр документа');
  const modalExists = await modal.count() > 0;
  console.log('Modal exists:', modalExists);
  
  // Check if new tab was opened
  const pages = context.pages();
  console.log('Number of pages:', pages.length);
  
  // Take screenshot
  await page.screenshot({ path: 'test-preview-debug.png' });
  
  if (!modalExists && pages.length > 1) {
    console.log('❌ ISSUE: New tab opened instead of modal!');
  } else if (modalExists) {
    console.log('✅ Modal is showing correctly');
  }
});
