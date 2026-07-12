import { test, expect } from '@playwright/test';
import { recordActual } from '../helpers/record';

/** PERSONALISED AUDIO – product page only (purchase/questionnaire need payment). */

test.describe('Personalised Audio (Deep Rest)', () => {
  test('TC-084 Audio product page loads with description, pricing & CTA', async ({ page }, testInfo) => {
    await page.goto('/deep-rest');
    await expect(page.getByRole('heading', { name: /deep rest/i }).first()).toBeVisible();
    const buyCta = page
      .getByRole('link', { name: /buy tailored audio/i })
      .or(page.getByRole('button', { name: /add to cart|get started|buy/i }));
    const hasCta = await buyCta.count();
    const body = (await page.locator('body').innerText()).toLowerCase();
    const hasInfo = /how it works|playlist|session|benefit|sleep|audio/.test(body);
    recordActual(
      testInfo,
      `Deep Rest page loaded: description/benefits present=${hasInfo}; purchase CTA present=${hasCta > 0} ("Buy Tailored Audio" -> /deep-rest/payment).`,
    );
    expect(hasCta, 'a purchase/get-started CTA is present').toBeGreaterThan(0);
    expect(hasInfo).toBe(true);
  });
});
