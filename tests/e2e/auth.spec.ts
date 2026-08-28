import { test, expect } from '@playwright/test';

test.describe('Authentication Flow E2E Specs', () => {
  test('should render login page with email and password controls at /login', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should display validation feedback on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid_user_999@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Target the login error alert message box directly
    const errorAlert = page.locator('div:has-text("Failed to login"), div:has-text("Invalid"), p:has-text("Failed to login"), .bg-red-50');
    await expect(errorAlert.first()).toBeVisible({ timeout: 15000 });
  });
});
