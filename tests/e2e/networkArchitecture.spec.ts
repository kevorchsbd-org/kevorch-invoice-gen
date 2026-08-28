import { test, expect } from '@playwright/test';

test.describe('Network Architecture Security Audit E2E Specs', () => {
  test('should verify zero outgoing requests to forbidden cloud storage domains', async ({ page }) => {
    const forbiddenRequests: string[] = [];

    page.on('request', (request) => {
      const url = request.url().toLowerCase();
      if (
        url.includes('supabase.co') ||
        url.includes('cloudfunctions.net') ||
        url.includes('firebasestorage.googleapis.com')
      ) {
        forbiddenRequests.push(request.url());
      }
    });

    await page.goto('/login');
    await page.waitForTimeout(1000);

    expect(forbiddenRequests.length).toBe(0);
    expect(forbiddenRequests).toEqual([]);
  });
});
