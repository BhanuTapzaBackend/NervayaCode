import { execFileSync } from 'node:child_process';
import { test, expect, type Page } from '@playwright/test';
import { recordActual } from '../helpers/record';
import { AUTH_STATE } from '../global-setup';

/**
 * ADMIN-DRIVEN CONSULTATION AVAILABILITY.
 *
 * Drives the whole loop end to end: the admin generates slots, they show up on
 * the public booking form, a customer books one, it disappears, the admin sees
 * the booking and confirms it, the day editor locks it, cancelling it releases
 * the slot, and it becomes bookable again.
 *
 * The two assertions that actually prove the feature are "the booked slot is
 * gone" (TC-127) and "the cancelled slot came back" (TC-131). Everything else
 * is scaffolding around those two.
 *
 * All writes land on a single far-future date so the suite never disturbs real
 * bookings. Slots are 09:00-11:00 so they all fall in TimeSlotGrid's "Morning"
 * group and no period paging is needed.
 */

/**
 * Far enough out that no real booking exists; inside the admin page's 90-day window.
 *
 * The ISO string is built from LOCAL calendar parts, not toISOString(): the app keys
 * dates by the day the user actually sees, and in IST a UTC conversion lands a day early.
 */
const TARGET = new Date(Date.now() + 21 * 86_400_000);
const TARGET_ISO = `${TARGET.getFullYear()}-${String(TARGET.getMonth() + 1).padStart(2, '0')}-${String(
  TARGET.getDate(),
).padStart(2, '0')}`;

const BOOKED_SLOT = '9:00 AM';
const EXPECTED_SLOTS = 4; // 09:00-11:00 in 30-minute steps
const CUSTOMER = {
  firstName: 'E2E',
  lastName: 'Consult',
  email: 'e2e-consult@example.com',
};

/** react-day-picker labels day buttons with date-fns "PPPP" — e.g. "Friday, July 17th, 2026". */
function rdpDayLabel(date: Date): RegExp {
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  return new RegExp(`${month} ${date.getDate()}(st|nd|rd|th), ${date.getFullYear()}`);
}

/** The booking form's DatePicker labels days "Select 7/17/2026" (toLocaleDateString). */
function bookingDayLabel(date: Date): string {
  return `Select ${date.toLocaleDateString('en-US')}`;
}

/** Picks a date in one of the admin DateField popovers. */
async function pickDate(page: Page, fieldLabel: string, date: Date): Promise<void> {
  await page.getByRole('button', { name: fieldLabel }).click();
  const popover = page.getByRole('dialog');
  await expect(popover).toBeVisible();

  // The popover opens on the current month; step forward until the target is shown.
  for (let i = 0; i < 6; i++) {
    const day = popover.getByRole('button', { name: rdpDayLabel(date) });
    if (await day.count()) {
      await day.first().click();
      await expect(popover).toBeHidden();
      return;
    }
    await popover.getByRole('button', { name: /next month/i }).click();
  }
  throw new Error(`Could not reach ${date.toDateString()} in the ${fieldLabel} calendar`);
}

/** Opens the public booking form and selects the target date. Returns the slot list. */
async function openBookingFormOn(page: Page, date: Date) {
  await page.goto('/about-us#assistance');
  await expect(page.getByRole('heading', { name: 'Free 1 on 1 Assistance' })).toBeVisible();

  const day = page.getByRole('button', { name: bookingDayLabel(date) });
  for (let i = 0; i < 6 && !(await day.count()); i++) {
    await page.getByRole('button', { name: 'Next month' }).click();
  }
  await day.click();

  return page.getByRole('list', { name: 'Time slots' }).getByRole('button');
}

test.describe.configure({ mode: 'serial' });

test.describe('Admin-driven consultation availability', () => {
  // The spec books a real slot, so a previous run would leave the target day
  // already booked and skew the counts. Start each run from a clean day.
  test.beforeAll(() => {
    execFileSync('npx', ['tsx', '--env-file=.env', 'scripts/clear-consultation-e2e-data.ts', TARGET_ISO], {
      stdio: 'inherit',
    });
  });

  test('TC-125 Admin generates consultation slots for a date range', async ({ browser }, testInfo) => {
    const page = await browser.newPage({ storageState: AUTH_STATE.admin });
    await page.goto('/admin/consultations/availability');
    await expect(page.getByRole('heading', { name: 'Consultation Slots' })).toBeVisible();

    await pickDate(page, 'Generate from date', TARGET);
    await pickDate(page, 'Generate to date', TARGET);
    await page.locator('#autofill-start-time').fill('09:00');
    await page.locator('#autofill-end-time').fill('11:00');

    // Tick every weekday so the target is included whatever day it lands on.
    for (const day of ['Sat', 'Sun']) {
      const box = page.getByRole('checkbox', { name: day });
      if (!(await box.isChecked())) await box.check();
    }

    await page.getByRole('button', { name: 'Generate slots' }).click();

    const success = page.locator('text=/Generated \\d+ slots across \\d+ days/');
    await expect(success).toBeVisible();
    const message = await success.innerText();

    // The day now appears in the list with its open/booked counts.
    await expect(page.getByRole('button', { name: `Edit slots for ${TARGET_ISO}` })).toContainText(
      `${EXPECTED_SLOTS} open · 0 booked`,
    );

    recordActual(
      testInfo,
      `Auto-fill on ${TARGET_ISO} (09:00-11:00, 30 min): "${message}". Day list shows 4 open · 0 booked.`,
    );
    await page.close();
  });

  test('TC-126 Generated slots appear on the public booking form', async ({ browser }, testInfo) => {
    const page = await browser.newPage(); // signed out — the form is public
    const slots = await openBookingFormOn(page, TARGET);

    await expect(slots).toHaveCount(EXPECTED_SLOTS);
    await expect(page.getByRole('button', { name: new RegExp(`Select ${BOOKED_SLOT}`) })).toBeEnabled();

    recordActual(
      testInfo,
      `Public form on ${TARGET_ISO} offers exactly the ${EXPECTED_SLOTS} admin-generated slots (not the old hardcoded 9-6 grid).`,
    );
    await page.close();
  });

  test('TC-127 Booking a slot removes it from the form', async ({ browser }, testInfo) => {
    const page = await browser.newPage();
    await openBookingFormOn(page, TARGET);

    // The shared Input renders its label unlinked from the field, so target by placeholder.
    await page.getByPlaceholder('John').fill(CUSTOMER.firstName);
    await page.getByPlaceholder('Doe').fill(CUSTOMER.lastName);
    await page.getByPlaceholder('your.email@example.com').fill(CUSTOMER.email); // Video Call is the default
    await page.getByRole('button', { name: new RegExp(`Select ${BOOKED_SLOT}`) }).click();
    await page.getByRole('button', { name: 'Schedule Free Consultation' }).click();

    await expect(page.locator('text=/scheduled successfully/i')).toBeVisible({ timeout: 20_000 });

    // Reload and re-select the day. TimeSlotGrid still RENDERS the taken slot, but
    // disabled — so the check is that it is no longer selectable, not that it vanished.
    const slots = await openBookingFormOn(page, TARGET);
    await expect(slots).toHaveCount(EXPECTED_SLOTS);
    await expect(page.getByRole('button', { name: new RegExp(`^Select ${BOOKED_SLOT}`) })).toHaveCount(0);
    await expect(page.getByRole('button', { name: new RegExp(`^${BOOKED_SLOT} to`) })).toBeDisabled();

    recordActual(
      testInfo,
      `Booked ${BOOKED_SLOT} on ${TARGET_ISO}; after reload that slot renders disabled ("booked") and is no longer selectable, while the other ${EXPECTED_SLOTS - 1} stay open. One booking per slot holds.`,
    );
    await page.close();
  });

  test('TC-128 Booking appears in the admin list and filters work', async ({ browser }, testInfo) => {
    const page = await browser.newPage({ storageState: AUTH_STATE.admin });
    await page.goto('/admin/consultations');
    await expect(page.getByRole('heading', { name: 'Consultations' })).toBeVisible();

    const row = page.getByRole('row', { name: new RegExp(`${CUSTOMER.firstName} ${CUSTOMER.lastName}`) });
    await expect(row).toBeVisible();
    await expect(row).toContainText(TARGET_ISO);
    await expect(row).toContainText('pending');

    // Status filter narrows the list; a non-matching status hides the row.
    await page.getByLabel('Consultation status').click();
    await page.getByRole('option', { name: 'Cancelled' }).click();
    await expect(row).toHaveCount(0);

    await page.getByLabel('Consultation status').click();
    await page.getByRole('option', { name: 'Pending' }).click();
    await expect(row).toBeVisible();

    recordActual(
      testInfo,
      `Booking listed at /admin/consultations as pending on ${TARGET_ISO}. Status filter hides it under "Cancelled" and shows it under "Pending".`,
    );
    await page.close();
  });

  test('TC-129 Admin confirms a booking', async ({ browser }, testInfo) => {
    const page = await browser.newPage({ storageState: AUTH_STATE.admin });
    await page.goto('/admin/consultations');

    const row = page.getByRole('row', { name: new RegExp(`${CUSTOMER.firstName} ${CUSTOMER.lastName}`) });
    await row.getByRole('button', { name: 'Confirm' }).click();
    await expect(row).toContainText('confirmed');

    recordActual(testInfo, `Confirm moved the booking pending -> confirmed.`);
    await page.close();
  });

  test('TC-130 Day editor locks the booked slot', async ({ browser }, testInfo) => {
    const page = await browser.newPage({ storageState: AUTH_STATE.admin });
    await page.goto('/admin/consultations/availability');

    await page.getByRole('button', { name: `Edit slots for ${TARGET_ISO}` }).click();
    await expect(page.getByRole('heading', { name: `Editing ${TARGET_ISO}` })).toBeVisible();

    // The booked slot cannot be removed; the free ones can.
    const bookedRow = page.getByRole('listitem').filter({ hasText: BOOKED_SLOT });
    await expect(bookedRow).toContainText('Booked');
    await expect(bookedRow.getByRole('button', { name: 'Remove' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Remove' })).not.toHaveCount(0);

    recordActual(
      testInfo,
      `Day editor for ${TARGET_ISO}: ${BOOKED_SLOT} renders locked with no Remove control; free slots keep theirs. A booking cannot be deleted out from under the customer.`,
    );
    await page.close();
  });

  test('TC-131 Cancelling a booking releases its slot', async ({ browser }, testInfo) => {
    const admin = await browser.newPage({ storageState: AUTH_STATE.admin });
    await admin.goto('/admin/consultations');

    const row = admin.getByRole('row', { name: new RegExp(`${CUSTOMER.firstName} ${CUSTOMER.lastName}`) });
    await row.getByRole('button', { name: 'Cancel' }).click();
    await expect(row).toContainText('cancelled');
    await admin.close();

    // The freed slot is selectable again on the public form.
    const page = await browser.newPage();
    const slots = await openBookingFormOn(page, TARGET);
    await expect(slots).toHaveCount(EXPECTED_SLOTS);
    await expect(page.getByRole('button', { name: new RegExp(`^Select ${BOOKED_SLOT}`) })).toBeEnabled();

    recordActual(
      testInfo,
      `Cancelling released ${BOOKED_SLOT} on ${TARGET_ISO}: the public form is back to ${EXPECTED_SLOTS} slots and it is selectable again.`,
    );
    await page.close();
  });
});
