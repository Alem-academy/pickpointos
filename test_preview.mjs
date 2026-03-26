import { test, expect } from '@playwright/test';

test('Document Preview Test', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"], input[name="email"]', 'hr@pvz.kz');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/hr/**');
  
  // Go to employees
  await page.goto('http://localhost:5173/hr/employees');
  await page.waitForSelector('[data-testid="employee-card"], .employee-card, text=Сотрудники');
  
  // Click first employee
  const firstEmployee = page.locator('[data-testid="employee-card"], .employee-card, .bg-white').first();
  await firstEmployee.click();
  await page.waitForURL('**/hr/employees/*');
  
  // Wait for documents to load
  await page.waitForSelector('text=Документы', { timeout: 10000 });
  
  // Click preview button (eye icon)
  const previewButton = page.locator('button[title="Просмотр"], button:has(.eye), .lucide-eye').first();
  await previewButton.click();
  
  // Check if modal appears
  const modal = page.locator('role=dialog, [role="dialog"], .fixed.inset-0, text=Просмотр');
  await expect(modal).toBeVisible({ timeout: 5000 });
  
  console.log('✅ Modal is visible!');
  
  // Check for content
  const content = page.locator('[dangerouslySetInnerHTML], iframe, .prose');
  const contentExists = await content.count() > 0;
  console.log('Content exists:', contentExists);
  
  await page.screenshot({ path: 'test-preview-result.png' });
});
