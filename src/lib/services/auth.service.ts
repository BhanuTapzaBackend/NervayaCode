import User from '@/lib/models/user.model';
import { generateToken } from '@/lib/utils/jwt.util';
import {
  validatePhone,
  validateName,
  validateEmail,
  normalizePhone,
  validateIndianMobile,
} from '@/lib/utils/validation.util';
import { ValidationError, AuthenticationError } from '@/lib/utils/error.util';
import connectDB from '@/lib/db/mongodb';
import { ROLES, Role } from '@/lib/constants/roles';

type SessionUser = {
  _id: string;
  phone: string;
  name: string;
  role: Role;
  email?: string;
  therapistId?: string;
  createdAt: Date;
  updatedAt: Date;
};

function toSessionUser(user: InstanceType<typeof User>): SessionUser {
  return {
    _id: user._id.toString(),
    phone: user.phone,
    name: user.name,
    role: user.role,
    ...(user.email && { email: user.email }),
    ...(user.therapistId && { therapistId: user.therapistId.toString() }),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createUserAfterOtpVerification(phone: string, name: string, role: Role = ROLES.CUSTOMER) {
  await connectDB();

  if (!validatePhone(phone)) {
    throw new ValidationError('Invalid phone number');
  }

  if (!validateName(name)) {
    throw new ValidationError('Name must be at least 2 characters long');
  }

  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    throw new ValidationError('User with this phone already exists');
  }

  if (!Object.values(ROLES).includes(role)) {
    throw new ValidationError('Invalid role');
  }

  const user = await User.create({
    phone,
    name,
    role,
    phoneVerified: true,
  });

  const token = await generateToken(user._id.toString(), user.role);

  return {
    user: toSessionUser(user),
    token,
  };
}

export async function createSessionAfterOtp(phone: string) {
  await connectDB();

  if (!validatePhone(phone)) {
    throw new ValidationError('Invalid phone number');
  }

  const user = await User.findOne({ phone });
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  const token = await generateToken(user._id.toString(), user.role);

  return {
    user: toSessionUser(user),
    token,
  };
}

/**
 * Updates the profile. `email` and `phone` are both optional: omit a key to
 * leave that field untouched.
 *
 * ⚠️ Changing `phone` changes the login credential. Auth is passwordless, so the
 * new number IS how this account signs in from now on, and it is accepted here
 * WITHOUT an OTP to the new number — a valid-but-wrong number locks the user out
 * with no self-service recovery. Deliberate product decision; if that becomes a
 * support burden, the fix is to verify the new number before switching.
 */
export async function updateProfile(userId: string, name: string, email?: string | null, phone?: string) {
  await connectDB();

  if (!validateName(name)) {
    throw new ValidationError('Name must be at least 2 characters long');
  }

  const update: { name: string; email?: string | null; phone?: string; phoneVerified?: boolean } = {
    name: name.trim(),
  };

  if (phone !== undefined) {
    // Must be a real Indian mobile: 10 digits starting 6-9. Anything else
    // cannot receive a WhatsApp OTP, so it would be an unreachable login.
    const normalized = normalizePhone(phone);
    const national = normalized?.slice(-10);
    if (!normalized || !national || !validateIndianMobile(national)) {
      throw new ValidationError('Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9');
    }

    const current = await User.findById(userId).select('phone').lean();
    if (current && current.phone !== normalized) {
      const taken = await User.findOne({ phone: normalized }).select('_id').lean();
      if (taken) {
        throw new ValidationError('That WhatsApp number is already linked to another account');
      }
      update.phone = normalized;
      // The new number hasn't received an OTP, so it isn't a verified number.
      update.phoneVerified = false;
    }
  }

  // Email is optional (phone is the identifier). `undefined` means "not
  // submitted, leave alone"; an empty string means the user cleared it, which
  // must store null — "" would collide on the sparse unique index the moment a
  // second user also cleared theirs.
  if (email !== undefined) {
    const trimmed = email?.trim() ?? '';
    if (trimmed && !validateEmail(trimmed)) {
      throw new ValidationError('Please enter a valid email address');
    }
    update.email = trimmed ? trimmed.toLowerCase() : null;
  }

  const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true }).catch((error) => {
    // Unique index on phone, sparse unique on email.
    if ((error as { code?: number }).code === 11000) {
      const duplicated = String((error as { message?: string }).message ?? '');
      throw new ValidationError(
        duplicated.includes('phone')
          ? 'That WhatsApp number is already linked to another account'
          : 'That email is already linked to another account',
      );
    }
    throw error;
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  return {
    user: toSessionUser(user),
  };
}
