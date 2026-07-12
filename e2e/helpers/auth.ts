import { expect, type Page } from '@playwright/test';
import { logOffset, waitForOtp } from './otp';

export const SEEDED = {
  admin: '+919000000001',
  customer: '+919000000002',
  therapist: '+919000000003',
} as const;

/**
 * Drives the real login UI for an EXISTING user, reading the OTP from the dev
 * server log. Mirrors the flow in LoginSignupForm: fill phone -> "Send code"
 * (backend sends one OTP) -> 6-digit input -> "Verify".
 *
 * `returnUrl` appends ?returnUrl=... so we can assert post-login redirect (TC-022/024).
 */
export async function loginViaOtp(page: Page, phone: string, returnUrl?: string): Promise<void> {
  const loginPath = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login';
  await page.goto(loginPath);

  await page.locator('#login-phone').fill(phone);
  const offset = logOffset();
  await page.getByRole('button', { name: 'Send code' }).click();

  // OTP step appears.
  await expect(page.getByRole('heading', { name: 'Enter verification code' })).toBeVisible();

  const code = await waitForOtp(phone, offset);
  // Filling digit 1 with the full code triggers the paste-distribute branch.
  await page.getByLabel('Digit 1 of 6').fill(code);
  await page.getByRole('button', { name: 'Verify code' }).click();

  // Auth completes: httpOnly cookie set + client localStorage flag flips.
  await expect
    .poll(async () => (await page.context().cookies()).some((c) => c.name === 'auth_token'), { timeout: 15_000 })
    .toBe(true);
  await page.waitForFunction(() => localStorage.getItem('isLoggedIn') === 'true', { timeout: 15_000 });
}

/** True if the current page is authenticated (client-side flag present). */
export async function isLoggedIn(page: Page): Promise<boolean> {
  return page.evaluate(() => localStorage.getItem('isLoggedIn') === 'true');
}
