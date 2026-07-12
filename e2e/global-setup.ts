import { chromium, type FullConfig } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { loginViaOtp, SEEDED } from './helpers/auth';

/** Reuse auth state younger than this so repeated runs don't burn the
 * 5-OTP-sends/hour/phone budget. JWT cookie is comfortably valid in this window. */
const AUTH_STATE_TTL_MS = 30 * 60 * 1000;

const ARTIFACTS = resolve(process.cwd(), 'e2e/.artifacts');

export const AUTH_STATE = {
  customer: resolve(ARTIFACTS, 'auth-customer.json'),
  admin: resolve(ARTIFACTS, 'auth-admin.json'),
} as const;

async function globalSetup(config: FullConfig): Promise<void> {
  mkdirSync(ARTIFACTS, { recursive: true });

  // 0. Reuse recent auth state to conserve the OTP-send budget across reruns.
  const fresh = (p: string) => existsSync(p) && Date.now() - statSync(p).mtimeMs < AUTH_STATE_TTL_MS;
  if (fresh(AUTH_STATE.customer) && fresh(AUTH_STATE.admin)) {
    console.log('[global-setup] reusing recent auth state (skipping seed + login).');
    return;
  }

  // 1. Seed the dev/staging DB (from .env) with admin + customer test users.
  //    NOTE: the therapist branch of verify-auth.ts throws on a pre-existing
  //    schema bug (experience "12 years" vs Number), but admin + customer are
  //    upserted before that point, so we tolerate the non-zero exit.
  console.log('[global-setup] seeding admin + customer via scripts/verify-auth.ts ...');
  try {
    const out = execFileSync('npx', ['tsx', '--env-file=.env', 'scripts/verify-auth.ts'], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    console.log(out.split('\n').filter(Boolean).slice(-3).join('\n'));
  } catch (err) {
    const e = err as { stdout?: string };
    const seededCore = (e.stdout ?? '').includes('Normal User seeded');
    if (!seededCore) throw err;
    console.warn('[global-setup] therapist seed failed (known bug); admin + customer OK, continuing.');
  }

  // 2. Pre-authenticate customer + admin and persist storageState so the specs
  //    reuse the session instead of burning the 5-OTP/hour budget per test.
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3100';
  const browser = await chromium.launch();
  try {
    for (const [role, phone, statePath] of [
      ['customer', SEEDED.customer, AUTH_STATE.customer],
      ['admin', SEEDED.admin, AUTH_STATE.admin],
    ] as const) {
      console.log(`[global-setup] authenticating ${role} (${phone}) ...`);
      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();
      await loginViaOtp(page, phone);
      await context.storageState({ path: statePath });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log('[global-setup] done.');
}

export default globalSetup;
