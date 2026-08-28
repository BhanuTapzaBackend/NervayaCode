import { defineConfig, devices } from '@playwright/test';

/**
 * Scratch config for the Meet booking spec.
 *
 * Points at an ALREADY-RUNNING dev server and skips the suite's globalSetup,
 * which logs in a seeded user by scraping OTPs out of the dev-server log — that
 * needs ConsoleOtpDelivery, and a normally-configured server sends over
 * WhatsApp instead. This spec uses the fixed-OTP account, so it needs neither.
 */
export default defineConfig({
  testDir: './e2e/specs',
  testMatch: /15-working-hours-modal\.spec\.ts/,
  outputDir: './e2e/.artifacts/hours-output',
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
