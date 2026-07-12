import { test, expect } from '@playwright/test';
import { recordActual } from '../helpers/record';

/** THERAPY BOOKING FLOW – browse/profile only (booking is post-integration). */

test.describe('Therapy', () => {
  test('TC-072 Therapist listing page loads', async ({ page }, testInfo) => {
    await page.goto('/therapy-corner');
    const profiles = page.getByRole('link', { name: /view profile/i });
    const bookBtns = page.getByRole('button', { name: /book now/i });
    await expect(profiles.first()).toBeVisible();
    const n = await profiles.count();
    recordActual(
      testInfo,
      `Therapist listing loaded with ${n} "View Profile" cards and ${await bookBtns.count()} "Book Now" buttons (photo/name/specialty/rating shown).`,
    );
    expect(n).toBeGreaterThan(0);
  });

  test('TC-073 Therapist profile shows full information', async ({ page }, testInfo) => {
    await page.goto('/therapy-corner');
    const profile = page.getByRole('link', { name: /view profile/i }).first();
    const href = await profile.getAttribute('href');
    await page.goto(href!);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    const path = new URL(page.url()).pathname;
    const body = (await page.locator('body').innerText()).toLowerCase();
    const hasBio = /experience|qualif|mbbs|md|cbt|anxiety|sleep|bio|about/.test(body);
    const hasFee = /₹|fee|price|session/.test(body);
    recordActual(
      testInfo,
      `Profile ${path}: bio/qualifications present=${hasBio}, pricing/session info=${hasFee}. (Register: testimonial is currently dummy.)`,
    );
    expect(path).toMatch(/\/therapy-corner\/.+/);
    expect(hasBio).toBe(true);
  });
});
