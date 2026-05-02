import { expect, test } from '@playwright/test';

test.describe('marketing smoke', () => {
  test('default locale route returns 200', async ({ page }) => {
    const res = await page.goto('/en');
    expect(res?.ok()).toBeTruthy();
  });
});
