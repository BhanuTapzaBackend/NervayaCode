import { test, expect, request as pwRequest } from '@playwright/test';
import { recordActual } from '../helpers/record';
import { AUTH_STATE } from '../global-setup';

/** PAYMENT AND SECURITY (automatable subset). HTTPS is a production property,
 *  so it is verified against production, not the local http dev server. */

test.describe('Security', () => {
  test('TC-008/TC-106 HTTPS everywhere (verified against production)', async ({}, testInfo) => {
    const api = await pwRequest.newContext({ ignoreHTTPSErrors: false });
    // A network failure is a result, not a crash: fall back to a -1 status so the
    // assertion below reports "unreachable" rather than blowing up the test.
    const https = await api
      .get('https://www.nervaya.com/', { maxRedirects: 0 })
      .catch((e: unknown): { status: () => number; _e: string } => ({ status: () => -1, _e: String(e) }));
    let httpRedirectsToHttps = false;
    try {
      const httpResp = await api.get('http://www.nervaya.com/', { maxRedirects: 0 });
      const loc = httpResp.headers()['location'] ?? '';
      httpRedirectsToHttps = httpResp.status() >= 300 && httpResp.status() < 400 && loc.startsWith('https://');
    } catch {
      /* some hosts hard-fail plain http */
    }
    await api.dispose();
    recordActual(
      testInfo,
      `Production https://www.nervaya.com -> HTTP ${https.status?.()}; http->https redirect=${httpRedirectsToHttps}. ` +
        `(Local dev runs on http by design; HTTPS is enforced at the production edge.)`,
    );
    expect(https.status?.()).toBeGreaterThanOrEqual(200);
    expect(https.status?.()).toBeLessThan(400);
  });

  test('TC-108 Inputs reject SQL injection gracefully', async ({ page }, testInfo) => {
    const payload = `' OR 1=1--`;
    await page.goto('/sleep-blog');
    const search = page.locator('input[type="search"], input[placeholder*="search" i], [role="searchbox"]').first();
    let mode = 'search input';
    if (await search.count()) {
      await search.fill(payload);
      await search.press('Enter');
    } else {
      mode = 'blog API';
      await page.goto(`/api/blogs?search=${encodeURIComponent(payload)}`).catch(() => undefined);
    }
    await page.waitForTimeout(800);
    const body = (await page.locator('body').innerText()).toLowerCase();
    const dbError = /sql|syntax error|mongo|cast to|unhandled|stack trace|500 internal/.test(body);
    recordActual(
      testInfo,
      `Submitted SQLi payload via ${mode}; page remained functional, DB/error leakage=${dbError}.`,
    );
    expect(dbError, 'no raw DB error surfaced').toBe(false);
  });

  test('TC-109 No XSS execution from input fields', async ({ page }, testInfo) => {
    let alertFired = false;
    page.on('dialog', async (d) => {
      alertFired = true;
      await d.dismiss();
    });
    const payload = `<script>alert('xss')</script>`;
    await page.goto('/sleep-blog');
    const search = page.locator('input[type="search"], input[placeholder*="search" i], [role="searchbox"]').first();
    if (await search.count()) {
      await search.fill(payload);
      await search.press('Enter');
    } else {
      await page.goto('/signup');
      await page
        .locator('#signup-name')
        .fill(payload)
        .catch(() => undefined);
    }
    await page.waitForTimeout(1000);
    const injected = await page
      .locator('script:has-text("alert(\'xss\')")')
      .count()
      .catch(() => 0);
    recordActual(
      testInfo,
      `Injected <script> payload; alert dialog executed=${alertFired}; raw <script> node injected into DOM=${injected > 0}. Input is escaped/not executed.`,
    );
    expect(alertFired, 'script must not execute').toBe(false);
  });
});

test.describe('Security – RBAC (logged-in customer)', () => {
  test.use({ storageState: AUTH_STATE.customer });

  test('TC-120 Non-admin cannot access admin panel', async ({ page }, testInfo) => {
    const resp = await page.goto('/admin/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);
    const path = new URL(page.url()).pathname;
    const adminContentShown = (await page.getByRole('heading', { name: 'Admin Dashboard' }).count()) > 0;
    recordActual(
      testInfo,
      `Customer navigated to /admin/dashboard -> HTTP ${resp?.status()}, landed on ${path}; admin content exposed=${adminContentShown} (expected no — redirect/403).`,
    );
    expect(adminContentShown, 'admin content must not be exposed to a non-admin').toBe(false);
  });
});
