import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Reads the one-time OTP from the dev-server log.
 *
 * ConsoleOtpDelivery (src/lib/services/otp/console-otp-delivery.ts) logs:
 *   [OTP] WhatsApp not configured — code for +919000000002: 123456
 * to server stdout, which start-test-server.sh tee's into this file. The OTP is
 * NOT in the browser console, so a Playwright `page.on('console')` listener can
 * never see it — we must grep the server log.
 */
const LOG_PATH = resolve(process.cwd(), 'e2e/.artifacts/dev-server.log');

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Current byte length of the log — take this BEFORE triggering a send so we
 * only match codes produced afterwards (avoids reusing a stale OTP). */
export function logOffset(): number {
  return existsSync(LOG_PATH) ? statSync(LOG_PATH).size : 0;
}

/**
 * Polls the log (from `fromOffset`) until a fresh OTP for `phone` appears.
 * Returns the most recent 6-digit code, or throws on timeout.
 */
export async function waitForOtp(phone: string, fromOffset: number, timeoutMs = 20_000): Promise<string> {
  const pattern = new RegExp(`\\[OTP\\] WhatsApp not configured — code for ${escapeRegExp(phone)}: (\\d{6})`, 'g');
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (existsSync(LOG_PATH)) {
      const buf = readFileSync(LOG_PATH);
      const slice = buf.subarray(Math.min(fromOffset, buf.length)).toString('utf8');
      let lastCode: string | undefined;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(slice)) !== null) lastCode = m[1];
      if (lastCode) return lastCode;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for OTP for ${phone} in ${LOG_PATH}. ` +
      `Is the dev server logging via ConsoleOtpDelivery? (WhatsApp creds must be blank.)`,
  );
}
