/**
 * Proves the HTTP contract for the merge branch of the phone-link flow.
 *
 * Separate from verify-account-merge.ts, which exercises the service in-process.
 * This one drives the real routes over HTTP, because the thing most likely to
 * break is not the merge — it is the SIGNAL reaching the client. `errorResponse`
 * hard-codes `data: null` and discards its second argument, so the "this number
 * belongs to another account you can absorb" flag has to ride the success body;
 * a regression there is invisible to a service-level test.
 *
 * ⚠️ THIS SENDS REAL WHATSAPP MESSAGES.
 *
 * The route calls `sendOtp` internally, and that runs inside the Next server
 * process — so this script cannot force console delivery no matter what it sets
 * in its own environment. The numbers below are synthetic but syntactically
 * valid Indian mobiles, which means they may well belong to somebody. Run it
 * against a dev server started WITHOUT WhatsApp credentials (so the OTP falls
 * back to `ConsoleOtpDelivery`), or accept that a stranger gets a code.
 *
 * Gated behind an explicit flag for that reason.
 *
 *   npx tsx --env-file=.env scripts/verify-account-merge-route.ts --sends-real-otp
 */
import mongoose from 'mongoose';

import connectDB from '../src/lib/db/mongodb';
import User from '../src/lib/models/user.model';
import { generateToken } from '../src/lib/utils/jwt.util';
import { ROLES } from '../src/lib/constants/roles';
import { AUTH_PROVIDERS } from '../src/lib/constants/enums';

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000';
const STAMP = Date.now();
const PHONE = `+9196${String(STAMP).slice(-8)}`;

let failures = 0;
function check(label: string, ok: boolean, detail = '') {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

async function main() {
  if (!process.argv.includes('--sends-real-otp')) {
    console.error(
      '\nRefusing to run without --sends-real-otp.\n\n' +
        'This script drives POST /api/auth/phone/start, which sends an OTP through\n' +
        'whatever delivery the SERVER is configured with. With WhatsApp credentials\n' +
        'present that is a real message to a real number.\n\n' +
        'Start the dev server without WHATSAPP_ACCESS_TOKEN to use console delivery,\n' +
        'then re-run with --sends-real-otp.\n',
    );
    process.exit(1);
  }

  await connectDB();

  const winner = await User.create({
    name: 'Route Winner',
    email: `route-winner-${STAMP}@example.com`,
    emailVerified: true,
    googleId: `route-sub-${STAMP}`,
    phone: null,
    role: ROLES.CUSTOMER,
    authProviders: [AUTH_PROVIDERS.GOOGLE],
  });
  const loser = await User.create({
    name: 'Route Loser',
    phone: PHONE,
    phoneVerified: true,
    role: ROLES.CUSTOMER,
    authProviders: [AUTH_PROVIDERS.WHATSAPP],
  });

  const token = await generateToken(winner._id.toString(), ROLES.CUSTOMER);

  console.log(`\nPOST /api/auth/phone/start with a number owned by another account (${PHONE})`);
  const res = await fetch(`${BASE}/api/auth/phone/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `auth_token=${token}` },
    body: JSON.stringify({ phone: PHONE }),
  });
  const body = (await res.json()) as { success?: boolean; message?: string; data?: { merge?: boolean } };

  console.log(`  -> ${res.status} ${JSON.stringify(body)}`);
  check('does NOT dead-end with a 409', res.status !== 409, `status ${res.status}`);
  check('succeeds so the user can continue', body.success === true);
  check('carries merge:true on the SUCCESS body', body.data?.merge === true);

  console.log('\nA free number must NOT be flagged as a merge');
  const freePhone = `+9195${String(STAMP).slice(-8)}`;
  const freeRes = await fetch(`${BASE}/api/auth/phone/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `auth_token=${token}` },
    body: JSON.stringify({ phone: freePhone }),
  });
  const freeBody = (await freeRes.json()) as { data?: { merge?: boolean } };
  console.log(`  -> ${freeRes.status} ${JSON.stringify(freeBody)}`);
  check('merge is false for an unowned number', freeBody.data?.merge === false);

  await User.deleteMany({ _id: { $in: [winner._id, loser._id] } });
  console.log(failures === 0 ? '\nROUTE CONTRACT OK\n' : `\n${failures} CHECK(S) FAILED\n`);
  await mongoose.disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error('\nverify-account-merge-route crashed:', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
