import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should allow a user to login and reach the playground', async ({ page }) => {
        // Go to login page
        await page.goto('/login');

        // Fill in credentials
        await page.fill('input[name="email"]', 'test@apico.dev');
        await page.fill('input[name="password"]', 'Test1234!');

        // Submit form
        await page.click('button[type="submit"]');

        // Should redirect to playground (workspace view)
        // Adjust based on your actual post-login route
        await expect(page).toHaveURL(/.*playground/);

        // Check if some playground element is visible
        await expect(page.locator('text=Postman Clone')).toBeVisible();
    });

    test('should show error on invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'wrong@apico.dev');
        await page.fill('input[name="password"]', 'wrongpass');
        await page.click('button[type="submit"]');

        // Should show error message
        // Adjust the selector/text based on your actual UI
        await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });
});
