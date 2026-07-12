import { test, expect } from '@playwright/test';
import { recordActual } from '../helpers/record';

/** CROSS-BROWSER (TC-121 Chrome, TC-122 Firefox, TC-123 Safari/WebKit).
 *  This file runs on chromium, firefox AND webkit projects (see config). It
 *  exercises the key PUBLIC flows on each engine; full checkout/booking across
 *  browsers stays out of scope (payment/booking integrations). */

test.describe('Cross-browser key public flows', () => {
  test('Homepage, assessment (12 Qs) and shop load correctly', async ({ page, browserName }, testInfo) => {
    // Homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/nervaya/i);

    // Assessment loads with 12 questions
    await page.goto('/sleep-assessment');
    const counter = (await page.locator('text=/^\\d+\\/\\d+$/').first().textContent()) ?? '0/0';
    const total = Number(counter.split('/')[1]);

    // Shop renders a product
    await page.goto('/sleep-supplements');
    await page.waitForTimeout(600);
    const addToCart = await page.getByRole('button', { name: /add to cart/i }).count();

    recordActual(
      testInfo,
      `[${browserName}] homepage title OK, assessment total questions=${total}, shop Add-to-Cart present=${addToCart > 0}.`,
    );
    expect(total).toBe(12);
    expect(addToCart).toBeGreaterThan(0);
  });
});
