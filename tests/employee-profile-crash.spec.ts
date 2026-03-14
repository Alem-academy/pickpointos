import { test, expect } from '@playwright/test';

test.describe('Employee Profile Crash Test', () => {
    test('should not crash when emergency_contacts is a JSON string', async ({ page }) => {

        // 1. Mock the auth endpoints
        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: 'fake-token',
                    user: { id: 'test-hr', role: 'hr', email: 'test@example.com' }
                })
            });
        });

        await page.route('**/api/auth/me', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: { id: 'test-hr', role: 'hr', email: 'test@example.com' }
                })
            });
        });

        // 2. Mock the employee endpoint to return a string for emergency_contacts
        await page.route('**/api/employees/test-123', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'test-123',
                    full_name: 'Иванов Иван',
                    iin: '900101400000',
                    role: 'employee',
                    status: 'active',
                    // The issue was here: providing string instead of array
                    emergency_contacts: '[{"name":"Мама","phone":"+77011111111","relationship":"мать"}]',
                    created_at: new Date().toISOString()
                })
            });
        });

        // Mock documents so it doesn't fail
        await page.route('**/api/employees/test-123/documents', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        // 2. Perform actual UI login
        await page.goto('/login');
        const emailInput = page.getByPlaceholder('name@company.com');
        const passwordInput = page.getByPlaceholder('Пароль');
        const submitButton = page.getByRole('button', { name: 'Войти в панель' });

        await emailInput.fill('madina.kimadi.1994@gmail.com');
        await passwordInput.fill('password123');
        await submitButton.click();

        // 3. Wait for dashboard to load (successful login)
        await page.waitForURL('**/hr**');

        // 4. Navigate to the specific employee profile
        await page.goto('/hr/employees/test-123');

        // 5. Wait for the main heading to ensure page loaded
        const heading = page.locator('h1', { hasText: 'Иванов Иван' });
        await expect(heading).toBeVisible({ timeout: 10000 });

        // 6. Also verify that the emergency contact is displayed correctly
        const contactName = page.locator('text=Мама');
        await expect(contactName).toBeVisible();

        // 7. Verify it didn't show the error boundary
        const errorOverlay = page.locator('text=Something went wrong');
        await expect(errorOverlay).not.toBeVisible();

        // Take a screenshot of the successful render
        await page.screenshot({ path: 'test-results/employee-profile-success-fixed.png' });
    });
});
