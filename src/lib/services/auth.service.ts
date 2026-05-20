import bcrypt from 'bcryptjs';
import User from '@/lib/models/user.model';
import { generateToken } from '@/lib/utils/jwt.util';
import { validateEmail, validatePassword, validateName } from '@/lib/utils/validation.util';
import { ValidationError, AuthenticationError } from '@/lib/utils/error.util';
import connectDB from '@/lib/db/mongodb';
import { ROLES, Role } from '@/lib/constants/roles';

export async function registerUser(email: string, password: string, name: string, role: Role = ROLES.CUSTOMER) {
  await connectDB();

  if (!validateEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw new ValidationError(passwordValidation.message || 'Invalid password');
  }

  if (!validateName(name)) {
    throw new ValidationError('Name must be at least 2 characters long');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  if (!Object.values(ROLES).includes(role)) {
    throw new ValidationError('Invalid role');
  }

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    name,
    role,
  });

  const token = await generateToken(user._id.toString(), user.role);

  return {
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      ...(user.therapistId && { therapistId: user.therapistId.toString() }),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token,
  };
}

export async function createUserAfterOtpVerification(
  email: string,
  password: string,
  name: string,
  role: Role = ROLES.CUSTOMER,
) {
  await connectDB();

  if (!validateEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw new ValidationError(passwordValidation.message || 'Invalid password');
  }

  if (!validateName(name)) {
    throw new ValidationError('Name must be at least 2 characters long');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  if (!Object.values(ROLES).includes(role)) {
    throw new ValidationError('Invalid role');
  }

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    name,
    role,
    emailVerified: true,
  });

  const token = await generateToken(user._id.toString(), user.role);

  return {
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      ...(user.therapistId && { therapistId: user.therapistId.toString() }),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token,
  };
}

export async function loginUser(email: string, password: string) {
  await connectDB();

  if (!validateEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  if (!password) {
    throw new ValidationError('Password is required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  const token = await generateToken(user._id.toString(), user.role);

  return {
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      ...(user.therapistId && { therapistId: user.therapistId.toString() }),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token,
  };
}

export async function createSessionAfterOtp(email: string) {
  await connectDB();

  if (!validateEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  const token = await generateToken(user._id.toString(), user.role);

  return {
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      ...(user.therapistId && { therapistId: user.therapistId.toString() }),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
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
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      ...(user.therapistId && { therapistId: user.therapistId.toString() }),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  await connectDB();

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  const isCurrentValid = await bcrypt.compare(currentPassword.trim(), user.password);
  if (!isCurrentValid) {
    throw new AuthenticationError('Current password is incorrect');
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw new ValidationError(passwordValidation.message || 'Invalid new password');
  }

  user.password = newPassword.trim();
  await user.save();

  return { message: 'Password updated successfully' };
}
