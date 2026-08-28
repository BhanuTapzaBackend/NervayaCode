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

/**
 * Clicks the first bookable slot the popup can reach, or returns false.
 *
 * Two dimensions to walk: today's earlier periods are already in the past, and
 * any single day can be fully booked — so iterate enabled dates, and within each
 * the Morning/Afternoon/Evening carousel. Located structurally
 * (`button:not([disabled])` inside the slot list) rather than by label: the slot
 * aria-label carries a reason string when unavailable, so matching on text is
 * fragile where `disabled` is exact.
 */
async function pickAnySlot(page: Page): Promise<boolean> {
  const freeSlot = () => modal(page).locator('ul[aria-label="Time slots"] button:not([disabled])');
  const nextPeriod = () => modal(page).getByRole('button', { name: /Next time period/ });
  const dates = modal(page).getByRole('button', { name: /^Select \d+\/\d+\/\d+$/ });

  // Both the date change and the period change re-render the grid
  // asynchronously, so each look must WAIT for a slot rather than read the count
  // immediately — reading eagerly sees the previous date's grid.
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

  // Walk MONTHS as well as dates. Every full run of this spec books a real
  // session, so the shared test therapist's near-term slots genuinely run out —
  // at which point a helper that only searched the current month reported "no
  // slot available" and failed a test that had nothing wrong with it. The
  // picker allows up to a month ahead, so two views is the whole range.
  for (let month = 0; month < 2; month++) {
    const dateCount = await dates.count();
    for (let d = 0; d < dateCount; d++) {
      const date = dates.nth(d);
      if (await date.isDisabled()) continue;
      await date.click();
      if (await pickOnCurrentDate()) return true;
    }

    const nextMonth = modal(page).getByRole('button', { name: 'Next month' });
    if (!(await nextMonth.count()) || (await nextMonth.isDisabled())) break;
    await nextMonth.click();
    // The grid re-renders on the month change; wait for it before re-reading.
    await page.waitForTimeout(1_200);
  }
  return false;
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

    // Pick a therapist from the full list. The popup no longer opens on a single
    // "recommended" therapist behind which the rest were hidden — every
    // available therapist is listed, and the slot panel is empty until one is
    // chosen.
    await expect(modal(page).getByText('Select a therapist to see their available times.')).toBeVisible();
    await modal(page).getByRole('radio').first().click();
    await expect(modal(page).getByRole('heading', { name: 'Available Time Slots' })).toBeVisible();

    const picked = await pickAnySlot(page);
    expect(picked, 'a bookable slot was available in the visible month').toBe(true);

    await modal(page)
      .getByRole('button', { name: /Confirm & Start My Sleep Plan/ })
      .click();

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
    // The point of the single-order route is that the SESSION is priced by the
    // plan, on the plan's order. Compared against the server quote rather than
    // asserted non-zero: the discount percentage is admin-configured and may
    // legitimately be 0, which would make a `> 0` check a test of the seed data
    // instead of a test of the routing.
    const planQuote = await page.evaluate(async () => {
      const res = await fetch('/api/sleep-plan/quote?services=SUPPLEMENT,THERAPY,GUIDED_AUDIO', {
        credentials: 'include',
      });
      return res.json();
    });
    recordActual(
      testInfo,
      `Order priced by the plan, not the cart: promoCode=${order?.data?.promoCode}, ` +
        `promoDiscount=${order?.data?.promoDiscount} vs quote discount=${planQuote?.data?.discountAmount}, ` +
        `total=${order?.data?.totalAmount} vs quote total=${planQuote?.data?.total}.`,
    );
    // `promoCode` is the fingerprint of the plan route — the cart route never
    // sets it, so this is what proves the session was not billed separately.
    expect(order?.data?.promoCode).toBe('sleep-plan-bundle');
    expect(order?.data?.promoDiscount ?? 0).toBe(planQuote?.data?.discountAmount ?? 0);
    expect(order?.data?.totalAmount).toBe(planQuote?.data?.total);

    // And nothing else was left behind to pay for separately.
    const cart = await page.evaluate(async () => {
      const res = await fetch('/api/cart', { credentials: 'include' });
      return res.json();
    });
    const cartItems = cart?.data?.items ?? [];
    recordActual(testInfo, `Cart after the package purchase holds ${cartItems.length} item(s).`);
    expect(cartItems, 'the package did not park anything in the cart for a second payment').toEqual([]);
  });

  test('TC-129 No cart route is offered for a plan containing therapy', async ({ page }, testInfo) => {
    await openRecommendation(page);

    // "Add Plan to Cart" is deliberately absent here. The cart cannot express a
    // therapist and a held slot, and `createOrder` receives promoDiscount from
    // its caller rather than deriving it — so that button charged MORE than the
    // plan price and settled the session in a second payment.
    const cartBtn = planCard(page).getByRole('button', { name: /Add Plan to Cart/ });
    const count = await cartBtn.count();

    recordActual(
      testInfo,
      `Plan includes THERAPY; "Add Plan to Cart" buttons rendered=${count} (expected 0, single-payment route only).`,
    );
    expect(count).toBe(0);
    await expect(startBtn(page)).toBeEnabled();
  });

  test('TC-130 A therapist + slot pick is restored after a reload', async ({ page }, testInfo) => {
    await openRecommendation(page);
    await startBtn(page).click();
    await expect(modal(page)).toBeVisible({ timeout: 20_000 });

    await modal(page).getByRole('radio').first().click();
    await expect(modal(page).getByRole('heading', { name: 'Available Time Slots' })).toBeVisible();
    const chosenName = (await modal(page).getByRole('radio').first().innerText()).split('\n')[0];

    // Nothing is written until the pick is COMPLETE, so make it complete.
    const picked = await pickAnySlot(page);
    expect(picked, 'a bookable slot was available to select').toBe(true);
    await expect(modal(page).getByRole('button', { name: /Confirm & Start My Sleep Plan/ })).toBeEnabled();

    const stored = await page.evaluate(() => localStorage.getItem('nervaya.planTherapySelection'));
    expect(stored, 'a complete pick is persisted').toBeTruthy();

    // The real test: reload (as a login redirect or an accidental refresh would)
    // and reopen. The pick must come back rather than starting from scratch.
    await page.reload();
    await expect(planCard(page)).toBeVisible({ timeout: 45_000 });
    await startBtn(page).click();
    await expect(modal(page)).toBeVisible({ timeout: 20_000 });

    const restoredCard = modal(page).getByRole('radio', { checked: true });
    await expect(restoredCard).toHaveCount(1);
    const restoredName = (await restoredCard.innerText()).split('\n')[0];

    // Slots load for the restored therapist without any further clicking.
    await expect(modal(page).getByRole('heading', { name: 'Available Time Slots' })).toBeVisible();

    recordActual(
      testInfo,
      `Chose "${chosenName}", reloaded, reopened: therapist restored as "${restoredName}" ` +
        `with the slot panel already loaded. Stored payload=${stored}.`,
    );
    expect(restoredName).toBe(chosenName);
  });

  test('TC-131 A stale saved slot is rejected, not carried into checkout', async ({ page }, testInfo) => {
    await openRecommendation(page);
    const therapistId = await page.evaluate(async () => {
      const res = await fetch('/api/therapists?isAvailable=true', { credentials: 'include' });
      const json = await res.json();
      return json?.data?.[0]?._id ?? json?.data?.therapists?.[0]?._id ?? '';
    });
    expect(therapistId, 'a therapist exists to attach the stale pick to').toBeTruthy();

    // A real therapist, a time that is not on any grid. This is what a pick
    // saved days ago looks like once the slot has gone.
    const today = new Date().toISOString().slice(0, 10);
    await page.addInitScript(
      ([id, date]) => {
        localStorage.setItem(
          'nervaya.planTherapySelection',
          JSON.stringify({
            therapistId: id,
            therapistName: 'Stale Pick',
            sessionFee: 1499,
            date,
            slot: '3:33 AM',
            savedAt: Date.now(),
          }),
        );
      },
      [therapistId, today],
    );

    await page.reload();
    await expect(planCard(page)).toBeVisible({ timeout: 45_000 });
    await startBtn(page).click();
    await expect(modal(page)).toBeVisible({ timeout: 20_000 });

    // The therapist comes back, the dead slot does not — and the user is told.
    await expect(modal(page).getByText(/has been taken\. Please choose another slot/i)).toBeVisible({
      timeout: 20_000,
    });
    const confirm = modal(page).getByRole('button', { name: /Confirm & Start My Sleep Plan/ });
    await expect(confirm).toBeDisabled();

    recordActual(
      testInfo,
      'A saved slot that no longer exists is surfaced as "taken, choose another" and Confirm stays disabled — ' +
        'the stale pick is never submitted to checkout.',
    );
  });

  test('TC-132 Dropping therapy from the plan restores the cart route', async ({ page }, testInfo) => {
    await openRecommendation(page);
    await expect(planCard(page).getByRole('button', { name: /Add Plan to Cart/ })).toHaveCount(0);

    // Un-tick Therapy Corner. Without a session there is no slot to hold and the
    // cart can price the remainder, so the cart button is legitimate again.
    await planCard(page).getByRole('checkbox', { name: 'Therapy Corner' }).click();

    const cartBtn = planCard(page).getByRole('button', { name: /Add Plan to Cart/ });
    await expect(cartBtn).toBeVisible();

    recordActual(
      testInfo,
      'Cart button is hidden only while THERAPY is part of the plan; de-selecting it brings the cart route back.',
    );
    await expect(cartBtn).toBeEnabled();
  });

  test('TC-133 The standalone therapy tile goes to Therapy Corner, not the plan popup', async ({ page }, testInfo) => {
    await openRecommendation(page);

    // The popup buys the WHOLE plan now, so a standalone "just therapy" user
    // must not land in it.
    await page.getByRole('button', { name: 'Choose a Therapist' }).first().click();
    await page.waitForURL(/\/therapy-corner/, { timeout: 30_000 });

    recordActual(testInfo, `Standalone therapy CTA navigated to ${page.url()} and did not open the plan popup.`);
    await expect(modal(page)).toBeHidden();
  });
});
