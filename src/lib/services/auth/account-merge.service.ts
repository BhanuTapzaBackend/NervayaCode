import mongoose, { Types } from 'mongoose';

import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/user.model';
import Order from '@/lib/models/order.model';
import Session from '@/lib/models/session.model';
import SleepAssessmentResponse from '@/lib/models/sleepAssessmentResponse.model';
import DriftOffOrder from '@/lib/models/driftOffOrder.model';
import DriftOffResponse from '@/lib/models/driftOffResponse.model';
import Feedback from '@/lib/models/feedback.model';
import Therapist from '@/lib/models/therapist.model';
import { ROLES } from '@/lib/constants/roles';
import { AUTH_PROVIDERS } from '@/lib/constants/enums';
import { ConflictError } from '@/lib/utils/error.util';
import { getTestLogin } from '@/lib/constants/test-logins';

/**
 * Combining two accounts belonging to the same person.
 *
 * Passwordless auth has two front doors — Google (email, no phone) and WhatsApp
 * OTP (phone, often no email) — so the same human routinely ends up with two
 * accounts. They only collide at the phone gate, where the Google account tries
 * to add a number the phone account already owns. That used to be a flat 409
 * mid-checkout with no way forward.
 *
 * ⚠️ DIRECTION IS FIXED: the SIGNED-IN account always wins.
 * `requireAuth` verifies a signed `userId` claim and nothing else, so a session
 * cannot be re-pointed at a different `_id` mid-flight. Absorbing the
 * signed-in account instead would leave its own token resolving to a tombstone
 * — `/api/auth/me` 401s on that (see the guard below), i.e. a silent logout in
 * the middle of a purchase.
 */

/**
 * Collections whose `userId` may be reparented with a blind `updateMany`.
 *
 * Every one of these was verified against the live database to carry only
 * NON-unique indexes on `userId`. Deliberately absent:
 *
 * - `carts` — `userId_1` is genuinely UNIQUE (confirmed on the live DB), so a
 *   blind move throws E11000. It is also the wrong thing to do: the user is
 *   standing at checkout looking at the winner's cart, and injecting items from
 *   an abandoned account into the order they are about to pay for would have
 *   them buying things they never chose. The loser's cart is left untouched.
 * - `reviews` — the live DB carries TWO unique indexes, `{userId, productId}`
 *   and `{userId, productId, itemType}`, and NEITHER is partial (the schema's
 *   `$ne` partial filter is illegal in MongoDB and was dropped). Moving reviews
 *   would collide on both. There is no per-user review surface in the app and
 *   the author name is denormalised onto the row, so nothing visible is lost.
 * - `slotholds` — TTL-expiring in minutes, belonging to a booking attempt that
 *   is not happening.
 * - `consultationleads` — has no `userId` at all; keyed on email/mobile, both of
 *   which the winner now holds.
 * - `systemconfigs.updatedBy` — an audit stamp. Reparenting it would rewrite
 *   history, and admins cannot be merged anyway.
 */
const REPARENTED_MODELS = [
  { name: 'orders', model: Order },
  { name: 'sessions', model: Session },
  { name: 'sleepAssessments', model: SleepAssessmentResponse },
  { name: 'driftOffOrders', model: DriftOffOrder },
  { name: 'driftOffResponses', model: DriftOffResponse },
  { name: 'feedbacks', model: Feedback },
] as const;

export type MergeMovedCounts = Record<string, number>;

export interface PhoneClaim {
  /** `free` — nobody owns it. `mine` — already this user's. */
  status: 'free' | 'mine' | 'mergeable' | 'blocked';
  /** Present only for `blocked`, to explain the refusal to the user. */
  reason?: string;
}

/** Test-login numbers are guessable and live in production; never mergeable. */
function isTestNumber(phone: string): boolean {
  return getTestLogin(phone) !== null;
}

/**
 * Decides what adding `phone` to `currentUserId` should do.
 *
 * Replaces the old unconditional throw so the caller can offer a merge instead
 * of a dead end. Read-only and safe to call twice — the authoritative re-check
 * happens inside the merge transaction, because ownership can change in
 * between.
 */
export async function resolvePhoneClaim(phone: string, currentUserId: string): Promise<PhoneClaim> {
  await connectDB();

  const owner = await User.findOne({ phone }).select('_id role therapistId googleId mergedIntoUserId').lean();
  if (!owner) return { status: 'free' };
  if (owner._id.toString() === currentUserId) return { status: 'mine' };

  const blocked = (reason: string): PhoneClaim => ({ status: 'blocked', reason });

  if (owner.mergedIntoUserId) return blocked('That number belongs to an account that has already been merged.');
  if (isTestNumber(phone)) return blocked('That number cannot be linked to this account.');

  // A privileged account must never be absorbed self-service. The winner would
  // inherit its identifiers, and a Google-verified @nervaya.com address is
  // promoted to THERAPIST by role resolution on the very next session.
  if (owner.role !== ROLES.CUSTOMER || owner.therapistId) {
    return blocked('That number belongs to a staff account. Please contact support.');
  }

  // The absorbed account must have no Google identity of its own. If it did and
  // we cleared it, their next Google sign-in would match nothing and silently
  // create a THIRD account, stranding the data we just moved.
  if (owner.googleId) {
    return blocked('That number belongs to an account with its own Google sign-in. Please contact support.');
  }

  const current = await User.findById(currentUserId).select('phone role therapistId').lean();
  if (!current) return blocked('Account not found.');
  if (current.role !== ROLES.CUSTOMER || current.therapistId) {
    return blocked('Staff accounts cannot be merged. Please contact support.');
  }
  // Never a back-door phone change: `attachPhoneToUser` refuses to replace a
  // number, and a merge must not become a way around that.
  if (current.phone && current.phone !== phone) {
    return blocked('This account already has a WhatsApp number. Contact support to change it.');
  }

  return { status: 'mergeable' };
}

export interface MergeResult {
  winnerId: string;
  absorbedId: string;
  moved: MergeMovedCounts;
  /** True when the merge had already happened and this call changed nothing. */
  alreadyMerged: boolean;
}

/**
 * Absorbs the account owning `verifiedPhone` into `winnerUserId`.
 *
 * ⚠️ CALL ONLY AFTER an OTP to `verifiedPhone` has been verified. Nothing in
 * here re-checks that, and the whole security model rests on it: in a
 * passwordless system the phone OTP IS the credential for that account, so
 * proving control of the number is authenticating as it. Merging on a bare
 * phone match would be the pre-hijacking pattern that
 * `google-identity.service.ts` already guards against on the Google side.
 *
 * The absorbed account is NEVER supplied by the caller — it is derived from the
 * verified number inside the transaction, so a client cannot point this at an
 * account it has not proven ownership of.
 */
export async function mergeAccountByPhone(winnerUserId: string, verifiedPhone: string): Promise<MergeResult> {
  await connectDB();

  // Idempotency: a retried request must not fail or double-apply.
  const existing = await User.findOne({ phone: null, mergedIntoUserId: winnerUserId }).select('_id').lean();
  const priorOwner = await User.findOne({ phone: verifiedPhone }).select('_id').lean();
  if (!priorOwner && existing) {
    return { winnerId: winnerUserId, absorbedId: existing._id.toString(), moved: {}, alreadyMerged: true };
  }

  const claim = await resolvePhoneClaim(verifiedPhone, winnerUserId);
  if (claim.status === 'mine') {
    return { winnerId: winnerUserId, absorbedId: '', moved: {}, alreadyMerged: true };
  }
  if (claim.status !== 'mergeable') {
    throw new ConflictError(claim.reason ?? 'That number cannot be linked to this account.');
  }

  const moved: MergeMovedCounts = {};
  let absorbedId = '';

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // `withTransaction` re-runs this callback on a transient error, so reset
      // anything accumulated outside it — the pattern payment.service.ts uses.
      for (const key of Object.keys(moved)) delete moved[key];

      const loser = await User.findOne({ phone: verifiedPhone }).session(session);
      const winner = await User.findById(winnerUserId).session(session);
      if (!loser || !winner) throw new ConflictError('That number is no longer available to link.');
      if (loser._id.toString() === winner._id.toString()) {
        throw new ConflictError('That number is already on this account.');
      }

      // Re-assert everything inside the lock: ownership and roles can have
      // changed since the read above, and this is the authoritative check.
      if (loser.mergedIntoUserId) throw new ConflictError('That account has already been merged.');
      if (loser.role !== ROLES.CUSTOMER || loser.therapistId || loser.googleId) {
        throw new ConflictError('That account cannot be merged. Please contact support.');
      }
      if (winner.role !== ROLES.CUSTOMER || winner.therapistId) {
        throw new ConflictError('Staff accounts cannot be merged. Please contact support.');
      }
      if (winner.phone && winner.phone !== verifiedPhone) {
        throw new ConflictError('This account already has a WhatsApp number. Contact support to change it.');
      }
      if (loser.email && (await Therapist.exists({ email: loser.email }).session(session))) {
        throw new ConflictError('That account cannot be merged. Please contact support.');
      }

      absorbedId = loser._id.toString();

      // Free the number BEFORE claiming it. `phone_1` is a unique partial index
      // and is enforced immediately inside a transaction, not deferred to
      // commit, so the order here is load-bearing rather than stylistic.
      loser.phone = null;
      loser.phoneVerified = false;
      loser.authProviders = [];
      loser.mergedIntoUserId = new Types.ObjectId(winnerUserId);
      loser.mergedAt = new Date();
      await loser.save({ session });

      for (const { name, model } of REPARENTED_MODELS) {
        const res = await (model as mongoose.Model<unknown>).updateMany(
          { userId: loser._id },
          { $set: { userId: winner._id } },
          { session },
        );
        moved[name] = res.modifiedCount;
      }

      winner.phone = verifiedPhone;
      winner.phoneVerified = true;
      if (!winner.authProviders?.includes(AUTH_PROVIDERS.WHATSAPP)) {
        winner.authProviders = [...(winner.authProviders ?? []), AUTH_PROVIDERS.WHATSAPP];
      }
      // Only fill gaps. The winner's own name/avatar/email are what the user is
      // looking at right now and must not be overwritten by the older account.
      if (!winner.email && loser.email) {
        winner.email = loser.email;
        // `emailVerified` is set ONLY by Google sign-in, and the loser has no
        // googleId (guarded above), so its address was never proven. Inheriting
        // the flag would hand a route to THERAPIST via role resolution.
        winner.emailVerified = false;
      }
      await winner.save({ session });
    });
  } finally {
    await session.endSession();
  }

  console.warn(`[account-merge] ${absorbedId} absorbed into ${winnerUserId} via ${verifiedPhone}`);

  return { winnerId: winnerUserId, absorbedId, moved, alreadyMerged: false };
}
