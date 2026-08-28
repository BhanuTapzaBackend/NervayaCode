import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/utils/error.util';
import { normalizePhone, toNationalDigits, validateIndianMobile } from '@/lib/utils/validation.util';
import { AUTH_PROVIDERS } from '@/lib/constants/enums';

/**
 * Attaching a WhatsApp number to an account that signed up without one.
 *
 * Signup no longer demands a phone, so a Google user reaches booking or
 * checkout with `phone: null`. Those flows genuinely need one (session links
 * and reminders go out over WhatsApp), so it is collected there — always with
 * an OTP, never on trust.
 */

/** Normalises and validates, or throws with a message safe to show the user. */
export function assertUsablePhone(rawPhone: string): string {
  const normalized = normalizePhone(rawPhone);
  if (!normalized) {
    throw new ValidationError('Enter a valid 10-digit Indian mobile number');
  }

  const national = toNationalDigits(normalized);
  if (!national || !validateIndianMobile(national)) {
    throw new ValidationError('Enter a valid Indian mobile number starting with 6, 7, 8 or 9');
  }

  return normalized;
}

/**
 * Pre-flight check so the user finds out BEFORE we spend a WhatsApp message.
 *
 * Advisory only — two people can pass this concurrently. The unique index is
 * the real authority; see the E11000 branch in `attachPhoneToUser`.
 */
export async function assertPhoneAvailable(phone: string, userId: string): Promise<void> {
  await connectDB();

  const owner = await User.findOne({ phone }).select('_id').lean();
  if (owner && owner._id.toString() !== userId) {
    throw new ConflictError(
      'That WhatsApp number is already linked to another account. Log in with that account, or use a different number.',
    );
  }
}

/**
 * Writes the verified number onto the account.
 *
 * Call ONLY after `verifyOtp` has succeeded for this exact number — nothing in
 * here re-checks that, and an unverified write would recreate the phone-gate
 * bypass this whole flow exists to close.
 */
export async function attachPhoneToUser(userId: string, phone: string) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  // Only ever ADD a number, never replace one.
  //
  // Auth is passwordless, so `phone` IS the credential. This flow proves
  // ownership of the NEW number but nothing authorises detaching the OLD one —
  // so anyone with a session (a shared device, a stolen cookie) could point the
  // account at their own phone and lock the owner out silently. Changing a
  // number needs its own flow that verifies both.
  if (user.phone && user.phone !== phone) {
    throw new ConflictError('This account already has a WhatsApp number. Contact support to change it.');
  }

  user.phone = phone;
  user.phoneVerified = true;
  if (!user.authProviders?.includes(AUTH_PROVIDERS.WHATSAPP)) {
    user.authProviders = [...(user.authProviders ?? []), AUTH_PROVIDERS.WHATSAPP];
  }

  try {
    await user.save();
  } catch (error) {
    // The pre-check has a race window; the index closes it.
    if (typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000) {
      throw new ConflictError(
        'That WhatsApp number is already linked to another account. Log in with that account, or use a different number.',
      );
    }
    throw error;
  }

  return user;
}
