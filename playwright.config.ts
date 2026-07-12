import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config for verifying the Nervaya pre-launch test cases against a LOCAL
 * dev server on :3100 (isolated DB, console-OTP login). See e2e/README.md.
 *
 * - `chromium` runs the full suite.
 * - `firefox` / `webkit` run ONLY the cross-browser spec (TC-121–124) so we
 *   exercise the key public flows on each engine without tripling the run.
 *
 * Single worker: the OTP log reader and the per-phone rate limits make parallel
 * login flows racy, so we keep execution serial and deterministic.
 */
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3100';

export default defineConfig({
  testDir: './e2e/specs',
  outputDir: './e2e/.artifacts/test-output',
  fullyParallel: false,
  workers: 1,
  forbidOnly: false,
  retries: 0,
  timeout: 120_000, // dev server compiles routes on-demand; first hit per route is slow
  expect: { timeout: 12_000 },
  globalSetup: './e2e/global-setup.ts',
  reporter: [
    ['list'],
    ['json', { outputFile: './e2e/.artifacts/results.json' }],
    ['html', { outputFolder: './e2e/.artifacts/html-report', open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /11-cross-browser\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /11-cross-browser\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'bash e2e/scripts/start-test-server.sh',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
