import { test, expect } from '@playwright/test';

test.describe('Settings Page E2E Specs', () => {
  test('should login and navigate to settings page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'kevorchsbd@gmail.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.goto('/settings');

    await expect(page).toHaveURL(/settings/);
    const heading = page.locator('h1, h2, h3');
    await expect(heading.first()).toBeVisible();
  });
});
