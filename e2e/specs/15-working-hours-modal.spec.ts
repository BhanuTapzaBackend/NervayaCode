import { expect, test } from '@playwright/test';

import { loginWithFixedOtp } from '../helpers/auth';

/**
 * Regression cover for the working-hours editor on /therapist/schedule.
 *
 * The bug: Radix Select renders its dropdown through a portal on `document.body`,
 * so `useModalDismiss`'s `contains()` check treated a click on a time option as
 * a click OUTSIDE the modal and closed the whole dialog. Picking any AM/PM time
 * was impossible — the editor shut before the value could be committed.
 */
const THERAPIST = { phone: '+917777777777', otp: '777777' };

/** Bounding box of a locator, failing the test rather than asserting non-null. */
async function boxOf(locator: import('@playwright/test').Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('expected the element to have a bounding box');
  return box;
}

test('therapist can pick a time in the working-hours editor', async ({ page }) => {
  await loginWithFixedOtp(page, THERAPIST.phone, THERAPIST.otp);

  await page.goto('/therapist/schedule');

  const editButton = page.getByRole('button', { name: /edit working hours/i });
  await expect(editButton).toBeEnabled({ timeout: 30_000 });
  await editButton.click();

  const dialog = page.getByRole('dialog', { name: 'Working hours' });
  await expect(dialog).toBeVisible();

  // Monday is enabled in the seeded hours; use its start-time select.
  const startSelect = dialog.getByRole('combobox', { name: 'Monday start time' });
  await expect(startSelect).toBeVisible();
  const before = (await startSelect.textContent())?.trim();

  await startSelect.click();
  const option = page.getByRole('option', { name: '11:30 AM', exact: true });
  await expect(option).toBeVisible();
  await option.click();

  // THE ASSERTION: the dialog survived the click on a portalled option...
  await expect(dialog).toBeVisible();
  // ...and the value actually changed.
  await expect(startSelect).toHaveText('11:30 AM');
  expect(before).not.toBe('11:30 AM');

  // Abandoning a dropdown by clicking elsewhere in the modal must NOT close the
  // modal. An open Radix layer sets `body { pointer-events: none }`, so that
  // click retargets to <html> — neither portalled content nor inside the modal —
  // which the outside-click check used to read as "clicked outside".
  // Measured BEFORE opening the dropdown: Radix marks the rest of the page
  // aria-hidden while its layer is open, so the `dialog` role stops matching.
  const dialogBox = await boxOf(dialog);

  await startSelect.click();
  await expect(page.getByRole('option', { name: '2:00 AM', exact: true })).toBeVisible();

  // Raw mouse event on purpose. Playwright's normal `.click()` refuses here —
  // its actionability check sees the element cannot receive pointer events,
  // which is the very condition being tested. A real user's click is not
  // blocked; it just retargets. Aimed at the modal's left edge, clear of the
  // open dropdown.
  await page.mouse.click(dialogBox.x + 20, dialogBox.y + dialogBox.height / 2);

  // Still open, and NOT showing the discard prompt — dismissing a dropdown is
  // not an attempt to leave the editor. Asserting visibility alone would pass
  // even when the dialog only survived because the unsaved-changes guard caught
  // it, which is the wrong reason.
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Discard' })).toBeHidden();
  await expect(startSelect).toHaveText('11:30 AM');

  // A PM value too, since the report was specifically about AM/PM.
  const endSelect = dialog.getByRole('combobox', { name: 'Monday end time' });
  await endSelect.click();
  await page.getByRole('option', { name: '7:00 PM', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(endSelect).toHaveText('7:00 PM');

  // Cancel must DISCARD — via the explicit confirmation, since the draft is
  // unsaved and dismissing it silently would be data loss.
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await dialog.getByRole('button', { name: 'Discard' }).click();
  await expect(dialog).toBeHidden();

  await editButton.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('combobox', { name: 'Monday start time' })).toHaveText(before ?? '');
});

test('backdrop click still dismisses when nothing was edited', async ({ page }) => {
  await loginWithFixedOtp(page, THERAPIST.phone, THERAPIST.otp);
  await page.goto('/therapist/schedule');

  const editButton = page.getByRole('button', { name: /edit working hours/i });
  await expect(editButton).toBeEnabled({ timeout: 30_000 });
  await editButton.click();

  const dialog = page.getByRole('dialog', { name: 'Working hours' });
  await expect(dialog).toBeVisible();

  // Guarding against retargeted clicks must not break the ordinary one: a click
  // beside the dialog targets the backdrop element, not <html>.
  const box = await boxOf(dialog);
  await page.mouse.click(box.x / 2, box.y + box.height / 2);
  await expect(dialog).toBeHidden();
});
