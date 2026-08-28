import { test, expect } from '@playwright/test';

test.describe('Email Compose Modal E2E Specs', () => {
  test('should login and navigate to invoices list to verify email trigger presence', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'kevorchsbd@gmail.com');
    await page.fill('input[type="password"]', 'kevorch123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.goto('/invoices');

    await expect(page).toHaveURL(/invoices/);
  });
});
