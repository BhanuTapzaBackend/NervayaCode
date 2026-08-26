import { test, expect, chromium, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { recordActual, attachErrorCollector } from '../helpers/record';
import { FIXED_LOGINS, loginWithFixedOtp } from '../helpers/auth';
import { ITEM_TYPE, PAYMENT_STATUS } from '../../src/lib/constants/enums';

/**
 * SLEEP PLAN PACKAGE CHECKOUT
 *
 * Regression cover for the package flow: "Start My Sleep Plan" on the
 * recommendation page hung on "Starting..." forever whenever THERAPY was part of
 * the bundle. `handleStartPlan` set the busy state and asked for the therapist
 * modal, but the modal's render site was additionally gated on
 * THERAPIST_RECOMMENDATION_MODAL_ENABLED (false), so nothing mounted, nothing
 * could reset the state, and the plan was unbuyable.
 *
 * Runs as the payment-bypass test customer (+918888888888), so the full purchase
 * settles server-side without a real Razorpay card entry.
 */

const ARTIFACTS = resolve(process.cwd(), 'e2e/.artifacts');
const BYPASS_STATE = resolve(ARTIFACTS, 'auth-customer-bypass.json');

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  mkdirSync(ARTIFACTS, { recursive: true });

  // The recommendation only routes through the therapist modal when THERAPY is
  // 'High', which needs the ALL_THREE segment. Seed those answers directly —
  // driving the form picks option index 0 everywhere, which scores NO_DOMAIN.
  execFileSync('npx', ['tsx', '--env-file=.env', 'e2e/scripts/seed-worst-case-assessment.ts'], {
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (existsSync(BYPASS_STATE)) return;
  const browser = await chromium.launch();
  try {
    // storageState: undefined is required — Playwright otherwise injects the
    // describe's `test.use` storageState into newContext, and this hook is what
    // creates that very file.
    const ctx = await browser.newContext({
      baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3100',
      storageState: undefined,
    });
    const page = await ctx.newPage();
    await loginWithFixedOtp(page, FIXED_LOGINS.customerBypass.phone, FIXED_LOGINS.customerBypass.otp);
    await ctx.storageState({ path: BYPASS_STATE });
    await ctx.close();
  } finally {
    await browser.close();
  }
});

const planCard = (page: Page) => page.getByRole('region', { name: 'Your personalized sleep plan' });
const startBtn = (page: Page) => planCard(page).getByRole('button', { name: /Start My Sleep Plan|Starting\.\.\./ });
const modal = (page: Page) => page.getByRole('dialog', { name: 'Choose a therapist for your sleep plan' });

async function openRecommendation(page: Page): Promise<void> {
  await page.goto('/sleep-assessment');
  await expect(planCard(page)).toBeVisible({ timeout: 45_000 });
  // The card renders a local price first and re-renders on the server quote;
  // wait for the CTA row so we never click mid-swap.
  await expect(startBtn(page)).toBeEnabled();
}

test.describe('Sleep plan package', () => {
  test.use({ storageState: BYPASS_STATE });

  test('TC-125 Package bundle includes therapy at the configured plan price', async ({ page }, testInfo) => {
    await openRecommendation(page);

    const quote = await page.evaluate(async () => {
      const res = await fetch('/api/sleep-plan/quote?services=SUPPLEMENT,THERAPY,GUIDED_AUDIO', {
        credentials: 'include',
      });
      return res.json();
    });

    const services = (quote?.data?.lines ?? []).map((l: { service: string }) => l.service).sort();
    const cardText = await planCard(page).innerText();

    recordActual(
      testInfo,
      `Recommendation shows the 3-support package. Server quote lines=${services.join(',')}, ` +
        `subtotal=${quote?.data?.subtotal}, discount=${quote?.data?.discountAmount}, total=${quote?.data?.total}. ` +
        `Card copy mentions Therapy Corner=${/therapy corner/i.test(cardText)}.`,
    );

    expect(services).toEqual(['GUIDED_AUDIO', 'SUPPLEMENT', 'THERAPY']);
    expect(quote?.data?.total).toBeGreaterThan(0);
    expect(cardText).toMatch(/therapy corner/i);
  });

  test('TC-126 "Start My Sleep Plan" opens the therapist modal (does not hang on "Starting...")', async ({
    page,
  }, testInfo) => {
    const errors = attachErrorCollector(page);
    await openRecommendation(page);

    await startBtn(page).click();

    // The regression: the button flipped to "Starting..." and the modal never
    // mounted, leaving the CTA permanently disabled.
    await expect(modal(page)).toBeVisible({ timeout: 20_000 });
    const label = (await startBtn(page).innerText()).trim();

    recordActual(
      testInfo,
      `Clicking "Start My Sleep Plan" mounted the therapist modal ("Choose a therapist for your sleep plan"); ` +
        `CTA label while the modal is open="${label}". Console errors=${errors.length}.`,
    );
    expect(errors, 'no console/page errors on the package CTA').toEqual([]);
  });

  test('TC-127 Dismissing the therapist modal releases the CTA', async ({ page }, testInfo) => {
    await openRecommendation(page);
    await startBtn(page).click();
    await expect(modal(page)).toBeVisible({ timeout: 20_000 });

    await modal(page).getByRole('button', { name: 'Close' }).click();
    await expect(modal(page)).toBeHidden();

    // Must return to the idle label AND be clickable again — the bug's real cost
    // was a dead-end with no way back.
    await expect(startBtn(page)).toHaveText('Start My Sleep Plan');
    await expect(startBtn(page)).toBeEnabled();

    recordActual(
      testInfo,
      'Closing the therapist modal reset the CTA to "Start My Sleep Plan" and re-enabled it (no stuck busy state).',
    );
  });

  test('TC-128 Package purchase creates one order with all three items', async ({ page }, testInfo) => {
    await openRecommendation(page);
    await startBtn(page).click();
    await expect(modal(page)).toBeVisible({ timeout: 20_000 });

    await modal(page).getByRole('button', { name: 'Book Now' }).click();
    await expect(modal(page).getByRole('heading', { name: 'Available Time Slots' })).toBeVisible();

    // Find a bookable slot. Two dimensions to walk: today's earlier periods are
    // already in the past, and any single day can be fully booked — so iterate
    // enabled dates, and within each, the Morning/Afternoon/Evening carousel.
    // Located structurally (`button:not([disabled])` inside the slot list) rather
    // than by label: the slot aria-label carries a reason string when the slot is
    // unavailable, so matching on text is fragile where `disabled` is exact.
    const freeSlot = () => modal(page).locator('ul[aria-label="Time slots"] button:not([disabled])');
    const nextPeriod = () => modal(page).getByRole('button', { name: /Next time period/ });
    const dates = modal(page).getByRole('button', { name: /^Select \d+\/\d+\/\d+$/ });

    // Both the date change and the period change re-render the grid
    // asynchronously, so each look must WAIT for a slot rather than read the
    // count immediately — reading eagerly sees the previous date's grid.
    const pickOnCurrentDate = async (): Promise<boolean> => {
      for (let period = 0; period < 4; period++) {
        const appeared = await freeSlot()
          .first()
          .waitFor({ state: 'visible', timeout: 4_000 })
          .then(() => true)
          .catch(() => false);
        if (appeared) {
          await freeSlot().first().click();
          return true;
        }
        if (!(await nextPeriod().count()) || (await nextPeriod().isDisabled())) return false;
        await nextPeriod().click();
      }
      return false;
    };

    let picked = false;
    const dateCount = await dates.count();
    expect(dateCount, 'the date picker rendered selectable dates').toBeGreaterThan(0);
    for (let d = 0; d < dateCount && !picked; d++) {
      const date = dates.nth(d);
      if (await date.isDisabled()) continue;
      await date.click();
      picked = await pickOnCurrentDate();
    }
    expect(picked, 'a bookable slot was available in the visible month').toBe(true);

    await modal(page).getByRole('button', { name: 'Confirm & Book Now' }).click();

    // Payment bypass settles the order server-side and lands on the success page.
    await page.waitForURL(/\/order-success\//, { timeout: 60_000 });
    const orderId = page.url().split('/order-success/')[1]?.split(/[?#]/)[0] ?? '';

    const order = await page.evaluate(async (id) => {
      const res = await fetch(`/api/orders/${id}`, { credentials: 'include' });
      return res.json();
    }, orderId);

    const items = order?.data?.items ?? [];
    const types = items.map((i: { itemType: string }) => i.itemType).sort();
    const therapy = items.find((i: { itemType: string }) => i.itemType === ITEM_TYPE.THERAPY);

    recordActual(
      testInfo,
      `One order ${orderId} created for the whole package: itemTypes=${types.join(',')}, ` +
        `total=${order?.data?.totalAmount}, promoDiscount=${order?.data?.promoDiscount}, ` +
        `paymentStatus=${order?.data?.paymentStatus}. Therapy item carries slot metadata=` +
        `${JSON.stringify(therapy?.metadata ?? null)}.`,
    );

    expect(types).toEqual([ITEM_TYPE.DRIFT_OFF, ITEM_TYPE.SUPPLEMENT, ITEM_TYPE.THERAPY].sort());
    expect(order?.data?.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    expect(therapy?.metadata?.date, 'therapy item carries the chosen date').toBeTruthy();
    expect(therapy?.metadata?.slot, 'therapy item carries the chosen slot').toBeTruthy();
  });
});
