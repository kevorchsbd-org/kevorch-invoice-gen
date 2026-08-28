import { test, expect } from '@playwright/test';

test.describe('Responsive Viewport E2E Specs', () => {
  test('should render login page cleanly without horizontal overflow', async ({ page }) => {
    await page.goto('/login');

    const bodyWidth = await page.evaluate(() => document.body.clientWidth);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    expect(scrollWidth).toBeLessThanOrEqual(bodyWidth + 2);
  });
});
