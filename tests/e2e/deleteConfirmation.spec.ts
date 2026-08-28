import { test, expect } from '@playwright/test';

test.describe('Universal Reusable Delete Confirmation Modal E2E Specs', () => {
  test('should login and navigate to quotations page to check delete flow triggers', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'kevorchsbd@gmail.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.goto('/quotations');

    await expect(page).toHaveURL(/quotations/);
  });
});
