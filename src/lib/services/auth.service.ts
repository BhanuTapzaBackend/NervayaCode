import User from '@/lib/models/user.model';
import { generateToken } from '@/lib/utils/jwt.util';
import { validatePhone, validateName } from '@/lib/utils/validation.util';
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

export async function updateProfile(userId: string, name: string) {
  await connectDB();

  if (!validateName(name)) {
    throw new ValidationError('Name must be at least 2 characters long');
  }

  const user = await User.findByIdAndUpdate(userId, { name: name.trim() }, { new: true, runValidators: true });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  return {
    user: toSessionUser(user),
  };
}
