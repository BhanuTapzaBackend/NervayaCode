import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';
import { ROLES } from '@/lib/constants/roles';
import { AUTH_PROVIDERS } from '@/lib/constants/enums';
import type { GoogleProfile } from '@/lib/utils/google-oauth.util';

type UserDoc = InstanceType<typeof User>;

export interface ResolvedGoogleIdentity {
  user: UserDoc;
  isFirstTime: boolean;
}

/** Raised when an email is already held by an account we cannot safely link to. */
export class GoogleEmailConflictError extends Error {
  constructor() {
    super('That email already belongs to another Nervaya account');
    this.name = 'GoogleEmailConflictError';
  }
}

/** Fills in details Google knows and we don't, without overwriting user edits. */
function backfillProfile(user: UserDoc, profile: GoogleProfile): void {
  // Never rebind an account that already carries a different Google identity.
  // `sub` is the stable key; a deleted-and-recreated Google account reuses the
  // address with a new sub, and silently repointing would hand the account over.
  if (!user.googleId) user.googleId = profile.sub;
  if (!user.avatarUrl) user.avatarUrl = profile.picture;
  if (!user.name?.trim()) user.name = profile.name;
  if (!user.authProviders?.includes(AUTH_PROVIDERS.GOOGLE)) {
    user.authProviders = [...(user.authProviders ?? []), AUTH_PROVIDERS.GOOGLE];
  }
}

/**
 * Maps a verified Google profile onto a user account.
 *
 *   1. Known googleId          -> log that user in.
 *   2. Known email, no googleId -> LINK Google to the existing account.
 *   3. Neither                  -> create a new account with NO phone.
 *
 * Case 2 is why `verifyGoogleIdToken` insists on `email_verified`: linking by
 * address is only safe if Google has proven the address belongs to the person
 * signing in.
 *
 * Note the known gap: a user who signed up by phone and never gave an email has
 * no identifier in common with their Google account, so they get a second
 * account. Inherent to treating both providers as equal; merging is out of scope.
 */
export async function resolveGoogleIdentity(profile: GoogleProfile): Promise<ResolvedGoogleIdentity> {
  await connectDB();

  const byGoogleId = await User.findOne({ googleId: profile.sub });
  if (byGoogleId) {
    backfillProfile(byGoogleId, profile);
    if (byGoogleId.isModified()) await byGoogleId.save();
    return { user: byGoogleId, isFirstTime: false };
  }

  const byEmail = await User.findOne({ email: profile.email });
  if (byEmail) {
    // A different Google account already holds this user. `sub` is the stable
    // identity; rebinding would hand the account to whoever re-registered the
    // address. This one genuinely is a conflict.
    if (byEmail.googleId && byEmail.googleId !== profile.sub) {
      throw new GoogleEmailConflictError();
    }

    if (byEmail.emailVerified) {
      byEmail.googleId = profile.sub;
      backfillProfile(byEmail, profile);
      await byEmail.save();
      return { user: byEmail, isFirstTime: false };
    }

    // The existing account holds this address but never PROVED it —
    // `updateProfile` accepts any email without a verification round trip, so
    // an attacker could claim victim@example.com and wait. Linking on Google's
    // assertion alone would drop the victim into the attacker's account.
    //
    // Google has proof and that account does not, so the address moves. The old
    // account keeps its phone login and all its data; it only loses a claim it
    // never substantiated. Refusing outright was the previous behaviour and it
    // locked every phone-signup user out of Google permanently — including
    // therapists, for whom a verified email is now the only route to the role.
    console.warn(`[google-identity] releasing unverified email ${profile.email} from user ${byEmail._id.toString()}`);
    byEmail.email = null;

    // If that account held the therapist role on the strength of this address,
    // it must lose it too. Nothing else can take it back: the role heals only
    // via a VERIFIED email match, `syncTherapistLinkByEmail` demotes by email,
    // and the email is now null — so the account would keep therapist access to
    // a profile it can no longer prove any connection to, indefinitely, while a
    // second account gets promoted for the same profile.
    if (byEmail.role === ROLES.THERAPIST) {
      byEmail.role = ROLES.CUSTOMER;
      byEmail.therapistId = null;
    }

    await byEmail.save();
  }

  try {
    const created = await User.create({
      googleId: profile.sub,
      email: profile.email,
      emailVerified: true,
      name: profile.name,
      avatarUrl: profile.picture,
      // No phone. Collected later, with OTP verification, only where needed.
      phone: null,
      phoneVerified: false,
      role: ROLES.CUSTOMER,
      authProviders: [AUTH_PROVIDERS.GOOGLE],
    });
    return { user: created, isFirstTime: true };
  } catch (error) {
    // Two concurrent first-logins for the same Google account can both reach
    // this branch; the unique index settles it. Re-read rather than fail —
    // cheaper and simpler than wrapping the whole flow in a transaction.
    if (typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000) {
      const keyPattern = (error as { keyPattern?: Record<string, unknown> }).keyPattern ?? {};

      // Only googleId/email collisions mean "someone else won the race". A
      // collision on `phone` means the migration script never ran and the stale
      // non-partial index is rejecting `phone: null` — log which key it was,
      // because that failure otherwise surfaces as an unexplainable
      // "google_failed" for every new user.
      if ('googleId' in keyPattern || 'email' in keyPattern) {
        const existing = await User.findOne({ $or: [{ googleId: profile.sub }, { email: profile.email }] });
        if (existing) {
          backfillProfile(existing, profile);
          if (existing.isModified()) await existing.save();
          return { user: existing, isFirstTime: false };
        }
      }
      console.error('[google-identity] duplicate key on', keyPattern, '— has fix-user-identity-indexes.ts been run?');
    }
    throw error;
  }
}
