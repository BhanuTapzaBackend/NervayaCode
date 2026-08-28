/**
 * Exercises account merging end to end against a real database.
 *
 * The invariants here are data-shaped, not UI-shaped, so this script — not the
 * Playwright spec — is the load-bearing verification. It seeds two accounts in
 * the exact shape that collides in production (a Google account with no phone,
 * and a phone account carrying real history), merges them, and asserts what
 * moved, what deliberately did NOT, and that the absorbed account is inert.
 *
 *   npx tsx --env-file=.env scripts/verify-account-merge.ts
 *   npx tsx --env-file=.env scripts/verify-account-merge.ts --keep
 */
import mongoose, { Types } from 'mongoose';

import connectDB from '../src/lib/db/mongodb';
import User from '../src/lib/models/user.model';
import Order from '../src/lib/models/order.model';
import Session from '../src/lib/models/session.model';
import SleepAssessmentResponse from '../src/lib/models/sleepAssessmentResponse.model';
import Feedback from '../src/lib/models/feedback.model';
import Cart from '../src/lib/models/cart.model';
import { mergeAccountByPhone, resolvePhoneClaim } from '../src/lib/services/auth/account-merge.service';
import { createSessionForUser } from '../src/lib/services/auth.service';
import { ROLES } from '../src/lib/constants/roles';
import { AUTH_PROVIDERS, ITEM_TYPE, PAYMENT_STATUS, ORDER_STATUS } from '../src/lib/constants/enums';

const KEEP = process.argv.includes('--keep');
const STAMP = Date.now();
const PHONE = `+9199${String(STAMP).slice(-8)}`;

let failures = 0;
function check(label: string, ok: boolean, detail = '') {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

async function seed() {
  const winner = await User.create({
    name: 'Merge Winner (google)',
    email: `merge-winner-${STAMP}@example.com`,
    emailVerified: true,
    googleId: `google-sub-${STAMP}`,
    phone: null,
    role: ROLES.CUSTOMER,
    authProviders: [AUTH_PROVIDERS.GOOGLE],
  });

  const loser = await User.create({
    name: 'Merge Loser (phone)',
    phone: PHONE,
    phoneVerified: true,
    role: ROLES.CUSTOMER,
    authProviders: [AUTH_PROVIDERS.WHATSAPP],
  });

  // History that MUST follow the user.
  await Order.create({
    userId: loser._id,
    items: [{ itemType: ITEM_TYPE.SUPPLEMENT, itemId: 'seed-item', name: 'Seed', quantity: 1, price: 100 }],
    totalAmount: 100,
    paymentStatus: PAYMENT_STATUS.PAID,
    orderStatus: ORDER_STATUS.PENDING,
  });
  // A completed assessment must carry at least one answer — the model enforces
  // it in a pre-save hook, so an empty fixture is rejected outright.
  await SleepAssessmentResponse.create({
    userId: loser._id,
    answers: [{ questionId: new Types.ObjectId(), answer: 'seed' }],
    completedAt: new Date(),
  });
  await Feedback.create({ userId: loser._id, score: 9, comment: 'seed', pageUrl: '/' });

  // Data that must deliberately STAY on the absorbed account.
  await Cart.create({ userId: loser._id, items: [], totalAmount: 0 });
  await Cart.create({ userId: winner._id, items: [], totalAmount: 0 });

  return { winner, loser };
}

async function main() {
  await connectDB();
  console.log(`\nSeeding fixtures (phone ${PHONE})…`);
  const { winner, loser } = await seed();
  const winnerId = winner._id.toString();
  const loserId = loser._id.toString();

  console.log('\n1. The collision is detected as mergeable');
  const claim = await resolvePhoneClaim(PHONE, winnerId);
  check('resolvePhoneClaim -> mergeable', claim.status === 'mergeable', `got "${claim.status}"`);

  console.log('\n2. Merge');
  const result = await mergeAccountByPhone(winnerId, PHONE);
  check('absorbed the expected account', result.absorbedId === loserId);
  check('reported moved counts', Object.keys(result.moved).length > 0, JSON.stringify(result.moved));

  console.log('\n3. History followed the user');
  check('orders moved', (await Order.countDocuments({ userId: winner._id })) === 1);
  check('assessments moved', (await SleepAssessmentResponse.countDocuments({ userId: winner._id })) === 1);
  check('feedback moved', (await Feedback.countDocuments({ userId: winner._id })) === 1);
  check('sessions collection untouched but queryable', (await Session.countDocuments({ userId: loser._id })) === 0);
  check('nothing left behind', (await Order.countDocuments({ userId: loser._id })) === 0);

  console.log('\n4. Deliberate non-moves');
  check('loser cart left in place', (await Cart.countDocuments({ userId: loser._id })) === 1);
  check('winner cart untouched', (await Cart.countDocuments({ userId: winner._id })) === 1);

  console.log('\n5. Identifiers transferred, absorbed account tombstoned');
  const w = await User.findById(winnerId);
  const l = await User.findById(loserId);
  check('winner holds the number', w?.phone === PHONE);
  check('winner phoneVerified', w?.phoneVerified === true);
  check('winner kept its own email', w?.email === `merge-winner-${STAMP}@example.com`);
  check('winner gained whatsapp provider', w?.authProviders?.includes(AUTH_PROVIDERS.WHATSAPP) === true);
  check('absorbed released the number', l?.phone === null || l?.phone === undefined);
  check('absorbed points at the winner', l?.mergedIntoUserId?.toString() === winnerId);
  check('absorbed stamped with a time', !!l?.mergedAt);
  check('absorbed has no credentials left', (l?.authProviders?.length ?? 0) === 0);

  console.log('\n6. The tombstone cannot get a session');
  let refused = false;
  try {
    await createSessionForUser(l as NonNullable<typeof l>);
  } catch {
    refused = true;
  }
  check('createSessionForUser refuses a tombstone', refused);

  console.log('\n7. Idempotency — a retried merge changes nothing');
  const again = await mergeAccountByPhone(winnerId, PHONE);
  check('second merge is a no-op', again.alreadyMerged === true);
  check('orders still exactly one', (await Order.countDocuments({ userId: winner._id })) === 1);

  console.log('\n8. Guards refuse what they should');
  const staffPhone = `+9198${String(STAMP).slice(-8)}`;
  const staff = await User.create({
    name: 'Staff',
    phone: staffPhone,
    role: ROLES.THERAPIST,
    therapistId: new Types.ObjectId(),
    authProviders: [AUTH_PROVIDERS.WHATSAPP],
  });
  const other = await User.create({ name: 'Other', email: `other-${STAMP}@example.com`, role: ROLES.CUSTOMER });
  const staffClaim = await resolvePhoneClaim(staffPhone, other._id.toString());
  check('staff account is blocked', staffClaim.status === 'blocked', staffClaim.reason);

  const googlePhone = `+9197${String(STAMP).slice(-8)}`;
  const googleLoser = await User.create({
    name: 'Has Google',
    phone: googlePhone,
    googleId: `sub-${STAMP}-b`,
    role: ROLES.CUSTOMER,
  });
  const gClaim = await resolvePhoneClaim(googlePhone, other._id.toString());
  check('account with its own Google sign-in is blocked', gClaim.status === 'blocked', gClaim.reason);

  if (!KEEP) {
    const ids = [winner._id, loser._id, staff._id, other._id, googleLoser._id];
    await Promise.all([
      User.deleteMany({ _id: { $in: ids } }),
      Order.deleteMany({ userId: { $in: ids } }),
      SleepAssessmentResponse.deleteMany({ userId: { $in: ids } }),
      Feedback.deleteMany({ userId: { $in: ids } }),
      Cart.deleteMany({ userId: { $in: ids } }),
    ]);
    console.log('\nFixtures cleaned up.');
  } else {
    console.log(`\n--keep: winner=${winnerId} absorbed=${loserId}`);
  }

  console.log(failures === 0 ? '\nALL CHECKS PASSED\n' : `\n${failures} CHECK(S) FAILED\n`);
  await mongoose.disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error('\nverify-account-merge crashed:', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
