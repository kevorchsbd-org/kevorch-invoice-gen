import { test, expect } from '@playwright/test';

test.describe('Quotation Workflow E2E Specs', () => {
  test('should login and navigate to quotation list', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'kevorchsbd@gmail.com');
    await page.fill('input[type="password"]', 'kevorch123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.goto('/quotations');

    await expect(page).toHaveURL(/quotations/);
    const heading = page.locator('h1, h2, h3');
    await expect(heading.first()).toBeVisible();
  });
});
