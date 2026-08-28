import { test, expect } from '@playwright/test';

test.describe('Balance Invoice E2E Specs', () => {
  test('should login and navigate to balance-invoices page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'kevorchsbd@gmail.com');
    await page.fill('input[type="password"]', 'kevorch123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.goto('/balance-invoices');

    await expect(page).toHaveURL(/balance-invoices/);
    const heading = page.locator('h1, h2, h3');
    await expect(heading.first()).toBeVisible();
  });
});
