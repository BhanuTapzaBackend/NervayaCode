import { Role } from '@/lib/constants/roles';
import PendingSignup from '@/lib/models/pendingSignup.model';
import connectDB from '@/lib/db/mongodb';

const PENDING_SIGNUP_TTL_MS = 10 * 60 * 1000;

export interface PendingSignupData {
  email: string;
  password: string;
  name: string;
  role?: Role;
  expiresAt: number;
}

export async function savePendingSignup(email: string, password: string, name: string, role?: Role): Promise<void> {
  await connectDB();
  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = new Date(Date.now() + PENDING_SIGNUP_TTL_MS);

  await PendingSignup.findOneAndUpdate(
    { email: normalizedEmail },
    { password, name: name.trim(), role, expiresAt },
    { upsert: true },
  );
}

export async function consumePendingSignup(email: string): Promise<Omit<PendingSignupData, 'expiresAt'> | null> {
  await connectDB();
  const normalizedEmail = email.toLowerCase().trim();
  const doc = await PendingSignup.findOneAndDelete({ email: normalizedEmail });

  if (!doc) return null;
  if (new Date() > doc.expiresAt) return null;

  return {
    email: doc.email,
    password: doc.password,
    name: doc.name,
    role: doc.role as Role | undefined,
  };
}

export async function hasPendingSignup(email: string): Promise<boolean> {
  await connectDB();
  const normalizedEmail = email.toLowerCase().trim();
  const doc = await PendingSignup.findOne({ email: normalizedEmail });

  if (!doc) return false;
  if (new Date() > doc.expiresAt) {
    await PendingSignup.deleteOne({ email: normalizedEmail });
    return false;
  }
  return true;
}

export async function clearPendingSignup(email: string): Promise<void> {
  await connectDB();
  const normalizedEmail = email.toLowerCase().trim();
  await PendingSignup.deleteOne({ email: normalizedEmail });
}
