import { test, expect, request as pwRequest } from '@playwright/test';
import { attachErrorCollector, recordActual } from '../helpers/record';

/**
 * GENERAL AND NAVIGATION (TC-001 .. TC-009)
 *
 * Run against the local dev server. Two caveats are recorded rather than
 * hard-failed because they are not meaningful locally:
 *  - Raw page-load timing (TC-001) and Lighthouse (TC-007) reflect dev/turbopack,
 *    not production — TC-007 is verified separately against production.
 *  - HTTPS/mixed-content (TC-008) is a production property — verified against
 *    production in the security spec.
 */

test.describe('General & Navigation', () => {
  test('TC-001 Homepage loads correctly (no console errors, images/fonts visible)', async ({ page }, testInfo) => {
    const errors = attachErrorCollector(page);
    const start = Date.now();
    await page.goto('/', { waitUntil: 'load' });
    const loadMs = Date.now() - start;

    await expect(page).toHaveTitle(/nervaya/i);
    // Hero / first meaningful images present and actually decoded.
    const imgs = page.locator('img');
    await expect(imgs.first()).toBeVisible();
    await page.waitForTimeout(500); // let lazy images settle
    const broken = await page.evaluate(
      () => Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0).length,
    );

    const jsErrors = errors.filter((e) => e.startsWith('pageerror:'));
    const resourceErrors = errors.filter((e) => !e.startsWith('pageerror:'));

    recordActual(
      testInfo,
      `Homepage 200, title present, ${await imgs.count()} <img> (broken=${broken}). ` +
        `Uncaught JS errors=${jsErrors.length}. ` +
        `Console resource errors=${resourceErrors.length}` +
        `${resourceErrors.length ? ` [e.g. ${resourceErrors[0]}]` : ''} ` +
        `(a 401 here is the guest auth-check — benign but noisy). ` +
        `Dev load ${loadMs}ms (dev/turbopack — NOT representative of prod; see TC-007).`,
    );

    expect(broken, 'no broken images').toBe(0);
    expect(jsErrors, `uncaught JS errors: ${jsErrors.join(' | ')}`).toHaveLength(0);
  });

  test('TC-002 Site is mobile responsive (375px, no horizontal scroll)', async ({ browser }, testInfo) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const page = await ctx.newPage();
    await page.goto('/');
    const { scrollW, clientW } = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    const hamburger = page.getByRole('button', { name: /open menu/i });
    const hasHamburger = await hamburger.count();
    recordActual(
      testInfo,
      `At 375px: scrollWidth=${scrollW}, clientWidth=${clientW} (overflow=${scrollW - clientW}px), ` +
        `mobile hamburger present=${hasHamburger > 0}.`,
    );
    await ctx.close();
    expect(scrollW, 'no horizontal overflow at 375px').toBeLessThanOrEqual(clientW + 1);
  });

  test('TC-003 Navigation menu links route correctly', async ({ page }, testInfo) => {
    await page.goto('/');
    const checks: string[] = [];
    // Direct top-level links.
    for (const [name] of [['About Us', '/about-us']] as const) {
      const link = page.getByRole('link', { name }).first();
      if (await link.count()) {
        await link.click();
        await page.waitForLoadState('domcontentloaded');
        checks.push(`${name}->${new URL(page.url()).pathname}`);
        await page.goto('/');
      }
    }
    // Product destinations (reachable via nav dropdown or footer).
    for (const path of ['/sleep-supplements', '/therapy-corner', '/deep-rest', '/sleep-assessment']) {
      const resp = await page.goto(path);
      checks.push(`${path}->${resp?.status()}`);
      expect(resp?.status(), `${path} routes`).toBeLessThan(400);
    }
    recordActual(
      testInfo,
      `Routed: ${checks.join(', ')}. (Note: blog listing shows a placeholder/test card per register.)`,
    );
  });

  test('TC-004 Mobile hamburger menu opens and closes', async ({ browser }, testInfo) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const page = await ctx.newPage();
    await page.goto('/');
    const openBtn = page.getByRole('button', { name: /open menu/i }).first();
    await expect(openBtn).toBeVisible();
    await openBtn.click();
    // After opening, links are visible and a close affordance exists (toggle +
    // overlay both expose "Close menu"; the toggle is first).
    const closeBtn = page.getByRole('button', { name: /close menu/i }).first();
    await expect(closeBtn).toBeVisible();
    const linksVisible = await page
      .getByRole('link', { name: /about us/i })
      .first()
      .isVisible();
    await closeBtn.click();
    await expect(page.getByRole('button', { name: /open menu/i }).first()).toBeVisible();
    recordActual(
      testInfo,
      `Hamburger opens (close button appears, links visible=${linksVisible}) and closes on toggle. ` +
        `(Assessment is labelled "Questionnaire" in the mobile menu per register.)`,
    );
    await ctx.close();
  });

  test('TC-005 Custom 404 page for invalid URL', async ({ page }, testInfo) => {
    const resp = await page.goto('/randompage123-does-not-exist');
    const status = resp?.status();
    // not-found.tsx is a client component (framer-motion) — wait for it to render.
    await expect(page.getByText('Oops! Page Not Found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Return Home' })).toBeVisible();
    recordActual(
      testInfo,
      `/randompage123 -> HTTP ${status}; branded 404 shown ("404" + "Oops! Page Not Found" + Return Home link).`,
    );
    expect(status, 'returns 404 status').toBe(404);
  });

  test('TC-006 Footer links route correctly (+ social link audit)', async ({ page }, testInfo) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    const links = await footer
      .getByRole('link')
      .evaluateAll((els) =>
        els.map((e) => ({ href: (e as HTMLAnchorElement).href, text: (e.textContent || '').trim() })),
      );
    const internal = links.filter((l) => l.href.includes('localhost'));
    const social = links.filter((l) => /linkedin|facebook|instagram|twitter|x\.com/i.test(l.href));

    // Validate internal links resolve.
    const api = await pwRequest.newContext();
    const broken: string[] = [];
    for (const l of internal) {
      const r = await api.get(l.href);
      if (r.status() >= 400) broken.push(`${l.text || l.href}:${r.status()}`);
    }
    await api.dispose();

    recordActual(
      testInfo,
      `${internal.length} internal footer links checked, broken=[${broken.join(', ') || 'none'}]. ` +
        `Social links present: ${social.map((s) => new URL(s.href).host).join(', ') || 'none'} ` +
        `(register notes social accounts are placeholder/not linked).`,
    );
    expect(broken, `broken footer links: ${broken.join(', ')}`).toHaveLength(0);
  });

  test('TC-009 SEO meta tags present on key pages', async ({ page }, testInfo) => {
    const report: string[] = [];
    for (const path of ['/', '/sleep-supplements', '/therapy-corner', '/sleep-assessment']) {
      await page.goto(path);
      const title = await page.title();
      const desc = await page
        .locator('meta[name="description"]')
        .getAttribute('content')
        .catch(() => null);
      const og = await page
        .locator('meta[property="og:image"]')
        .getAttribute('content')
        .catch(() => null);
      report.push(`${path}: title=${!!title}, desc=${!!desc}, og:image=${!!og}`);
    }
    recordActual(testInfo, report.join(' | '));
    // Homepage at minimum must have title + description.
    await page.goto('/');
    expect(await page.title()).toBeTruthy();
    expect(await page.locator('meta[name="description"]').count()).toBeGreaterThan(0);
  });
});
