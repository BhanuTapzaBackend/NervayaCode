import type { TestInfo } from '@playwright/test';

/**
 * Records the observed behaviour for a test case onto the test result so the
 * xlsx updater can write it into the "Actual Result" column. Call once per test.
 */
export function recordActual(testInfo: TestInfo, actual: string): void {
  testInfo.annotations.push({ type: 'actual', description: actual });
}

/** Collects console errors + uncaught page errors, filtering known dev noise. */
export function attachErrorCollector(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  const ignore = [
    'favicon',
    'sourcemap',
    'source map',
    'Download the React DevTools',
    'Lighthouse',
    '[Fast Refresh]',
    'hydrat', // hydration dev warnings vary; capture separately if needed
  ];
  const keep = (t: string) => !ignore.some((s) => t.toLowerCase().includes(s.toLowerCase()));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && keep(msg.text())) errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    if (keep(err.message)) errors.push(`pageerror: ${err.message}`);
  });
  return errors;
}
