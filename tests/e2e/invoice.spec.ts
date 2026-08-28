import { test, expect } from '@playwright/test';

test.describe('Invoice Workflow E2E Specs', () => {
  test('should login and navigate to invoices page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'kevorchsbd@gmail.com');
    await page.fill('input[type="password"]', 'kevorch123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.goto('/invoices');

    await expect(page).toHaveURL(/invoices/);
    const heading = page.locator('h1, h2, h3');
    await expect(heading.first()).toBeVisible();
  });
});
