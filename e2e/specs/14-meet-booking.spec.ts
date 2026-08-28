import { test, expect, type Locator, type Page } from '@playwright/test';

import { FIXED_LOGINS, loginWithFixedOtp } from '../helpers/auth';
import { recordActual } from '../helpers/record';

/**
 * Google Meet booking, end to end through the real UI.
 *
 * Uses the payment-bypass test customer, so the order settles server-side and
 * `processPaymentSuccess` runs `finalizeSessionBooking` for real — which is the
 * only path that produces a Meet link. Stubbing payment would skip exactly the
 * code under test.
 */

/**
 * Walks forward through the date picker until a day offers a bookable slot.
 *
 * Today almost always shows zero: its slots are struck through as past. The
 * picker also only renders one time-of-day band at a time, so each candidate
 * date needs the Morning/Afternoon/Evening bands stepped through too.
 */
async function selectFirstBookableSlot(page: Page): Promise<string> {
  // Two traps here, both of which silently produce "no slots found":
  //
  //  1. Dates are `Select 8/28/2026`, slots are `Select 9:00 AM to 10:00 AM`.
  //     Both start with "Select ", so a date locator must exclude the " to "
  //     form or it clicks disabled slot buttons instead.
  //  2. getByRole matches DISABLED buttons too. Every past date is disabled, so
  //     indexing over all of them walks Aug 1..14 and never reaches the first
  //     bookable day. Filter in the selector, not in the loop.
  //  3. The month view is not the whole picker. This spec books a real session
  //     on a shared test therapist, so running it repeatedly fills up the near
  //     dates; once the visible month is fully booked EVERY date in it is
  //     disabled and this locator matches nothing. That surfaced as an
  //     "intermittent" timeout waiting for a date, which it never was — the
  //     data had simply run out. Advance the month before giving up.
  const enabledDays = page.locator('button[aria-label^="Select "]:not([disabled]):not([aria-label*=" to "])');

  for (let month = 0; month < 2; month += 1) {
    const found = await pickFromVisibleMonth(page, enabledDays);
    if (found) return found;

    const nextMonth = page.getByRole('button', { name: 'Next month' });
    if (!(await nextMonth.count()) || !(await nextMonth.isEnabled().catch(() => false))) break;
    await nextMonth.click();
    await page.waitForTimeout(1_000);
  }
  throw new Error('No bookable slot found in the next two months — the test therapist may be fully booked');
}

/** Walks the dates currently rendered, returning the chosen slot label or null. */
async function pickFromVisibleMonth(page: Page, enabledDays: Locator): Promise<string | null> {
  // Snapshot the labels rather than holding a live nth() handle.
  //
  // A date renders enabled until its availability arrives, then flips to
  // disabled if it turns out to be fully booked. An `nth()` locator resolved
  // during that window keeps pointing at the element it first matched, so
  // Playwright retried the click for the full 20s timeout against a button that
  // had since become disabled — and threw, instead of simply trying the next
  // date or the next month.
  const labels = (await enabledDays.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')))).filter(
    (label): label is string => !!label,
  );

  for (const label of labels.slice(0, 14)) {
    const day = page.getByRole('button', { name: label, exact: true });
    if (!(await day.isEnabled().catch(() => false))) continue;

    // No isVisible() guard: the modal body scrolls, so future dates sit below
    // the fold and report not-visible even though they are perfectly clickable.
    // Skipping on that silently walked past every bookable day.
    await day.scrollIntoViewIfNeeded().catch(() => undefined);
    const clicked = await day
      .click({ timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (!clicked) continue; // became unavailable under us
    await page.waitForTimeout(600); // slots refetch on date change

    for (let band = 0; band < 3; band += 1) {
      const slot = page
        .getByRole('button', { name: /^Select .+ to .+$/ })
        .and(page.locator(':not([disabled])'))
        .first();
      if ((await slot.count()) && (await slot.isEnabled().catch(() => false))) {
        const label = (await slot.getAttribute('aria-label')) ?? '';
        await slot.click();
        return label.replace(/^Select /, '');
      }
      const next = page.getByRole('button', { name: /next time period/i });
      if (await next.isEnabled().catch(() => false)) {
        await next.click();
        await page.waitForTimeout(300);
      } else {
        break;
      }
    }
  }
  return null;
}

test.describe('Google Meet booking', () => {
  test('books a therapy session and issues a Google Meet link', async ({ page }, testInfo) => {
    // ── 1. Sign in ────────────────────────────────────────────────
    await loginWithFixedOtp(page, FIXED_LOGINS.customerBypass.phone, FIXED_LOGINS.customerBypass.otp);
    await testInfo.attach('01-logged-in', { body: await page.screenshot(), contentType: 'image/png' });

    // ── 2. Open the booking modal ─────────────────────────────────
    await page.goto('/therapy-corner');
    await page
      .getByRole('button', { name: /book now/i })
      .first()
      .click();
    await expect(page.getByRole('heading', { name: /book your appointment/i })).toBeVisible({ timeout: 30_000 });

    // ── 3. Pick a real, bookable slot ─────────────────────────────
    const slotLabel = await selectFirstBookableSlot(page);
    await testInfo.attach('02-slot-selected', { body: await page.screenshot(), contentType: 'image/png' });

    // aria-label is "Book selected session", which overrides the visible
    // "Book Session" text as the accessible name.
    await page.getByRole('button', { name: /^Book selected session$/ }).click();
    await page.getByRole('button', { name: /^Confirm$/ }).click();

    // ── 4. Settle payment (bypassed for this account) ─────────────
    await page.waitForURL(/\/(checkout|order-success)/, { timeout: 90_000 });
    await testInfo.attach('03-after-confirm', { body: await page.screenshot(), contentType: 'image/png' });

    if (page.url().includes('/checkout')) {
      await page
        .getByRole('button', { name: /proceed to payment|place order|pay now/i })
        .first()
        .click();
      await page.waitForURL(/\/order-success/, { timeout: 120_000 });
      await testInfo.attach('04-order-success', { body: await page.screenshot(), contentType: 'image/png' });
    }

    // ── 5. The link must actually reach the customer ──────────────
    // finalizeSessionBooking runs AFTER the payment transaction commits, so the
    // link lands a moment later — poll rather than assume it is instant.
    //
    // Asserted through the API, not the DOM: the UI opens the room with
    // window.open() from a <button>, so there is no anchor href to query.
    const meetLink = await expect
      .poll(
        async () => {
          const res = await page.request.get('/api/sessions');
          if (!res.ok()) return null;
          const body = (await res.json()) as { data?: Array<{ meetLink?: string; createdAt?: string }> };
          const newest = (body.data ?? [])
            .filter((r) => r.meetLink?.includes('meet.google.com'))
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
          return newest?.meetLink ?? null;
        },
        { timeout: 120_000, intervals: [4000] },
      )
      .not.toBeNull()
      .then(async () => {
        const res = await page.request.get('/api/sessions');
        const body = (await res.json()) as { data?: Array<{ meetLink?: string; createdAt?: string }> };
        return (body.data ?? [])
          .filter((r) => r.meetLink?.includes('meet.google.com'))
          .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0]?.meetLink;
      });

    await page.goto('/account?tab=sessions');
    await testInfo.attach('05-my-sessions', { body: await page.screenshot(), contentType: 'image/png' });

    recordActual(testInfo, `Booked ${slotLabel}. Meet link shown to customer: ${meetLink}`);
    expect(meetLink).toMatch(/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
  });
});
