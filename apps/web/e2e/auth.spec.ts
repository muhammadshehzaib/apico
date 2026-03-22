import { test, expect } from '@playwright/test';

test.describe('Authentication and Personalization Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Mirror browser console logs to terminal for debugging
        page.on('console', (msg) => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
            }
        });

        // Log request failures (e.g. 404s, connection errors)
        page.on('requestfailed', request => {
            console.log(`[NETWORK ERROR] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
        });
    });

    test('should allow a user to register and reach the workspace dashboard', async ({ page }) => {
        // Generate a robust unique email to avoid collisions between browser runs
        const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const email = `test-${uniqueId}@apico.dev`;

        // 1. Go to register page
        await page.goto('/register');
        await expect(page.getByRole('heading', { name: 'Create Account', level: 1 })).toBeVisible();

        // 2. Fill in registration details
        await page.fill('input[name="name"]', 'E2E Test User');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', 'Test1234!');

        // 3. Submit registration
        await page.click('button[type="submit"]');

        // 4. Should redirect to workspace dashboard
        // We wait longer here because registration + redirect + dev server hydration can be slow
        await expect(page).toHaveURL(/.*\/workspace/, { timeout: 15000 });

        // 5. Verify we reached the dashboard by checking for the main heading
        // Increased timeout to account for the 'isLoading' skeleton state
        await expect(page.getByRole('heading', { name: 'Workspaces', level: 1 })).toBeVisible({ timeout: 15000 });
    });

    test('should show error on invalid login credentials', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('heading', { name: 'Login', level: 1 })).toBeVisible();

        await page.fill('input[name="email"]', 'nonexistent@apico.dev');
        await page.fill('input[name="password"]', 'wrongpass');
        await page.click('button[type="submit"]');

        // Should show the specific UI error message
        // Using a slightly longer timeout for the API response
        await expect(page.getByText('Login failed. Please try again.')).toBeVisible({ timeout: 10000 });
    });
});
