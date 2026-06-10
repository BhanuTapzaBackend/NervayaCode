import { Role } from '@/lib/constants/roles';
import PendingSignup from '@/lib/models/pendingSignup.model';
import connectDB from '@/lib/db/mongodb';

const PENDING_SIGNUP_TTL_MS = 10 * 60 * 1000;

export interface PendingSignupData {
  phone: string;
  name: string;
  role?: Role;
  expiresAt: number;
}

export async function savePendingSignup(phone: string, name: string, role?: Role): Promise<void> {
  await connectDB();
  const normalizedPhone = phone.trim();
  const expiresAt = new Date(Date.now() + PENDING_SIGNUP_TTL_MS);

  await PendingSignup.findOneAndUpdate(
    { phone: normalizedPhone },
    { name: name.trim(), role, expiresAt },
    { upsert: true },
  );
}

export async function consumePendingSignup(phone: string): Promise<Omit<PendingSignupData, 'expiresAt'> | null> {
  await connectDB();
  const normalizedPhone = phone.trim();
  const doc = await PendingSignup.findOneAndDelete({ phone: normalizedPhone });

  if (!doc) return null;
  if (new Date() > doc.expiresAt) return null;

  return {
    phone: doc.phone,
    name: doc.name,
    role: doc.role as Role | undefined,
  };
}

export async function hasPendingSignup(phone: string): Promise<boolean> {
  await connectDB();
  const normalizedPhone = phone.trim();
  const doc = await PendingSignup.findOne({ phone: normalizedPhone });

  if (!doc) return false;
  if (new Date() > doc.expiresAt) {
    await PendingSignup.deleteOne({ phone: normalizedPhone });
    return false;
  }
  return true;
}

export async function clearPendingSignup(phone: string): Promise<void> {
  await connectDB();
  const normalizedPhone = phone.trim();
  await PendingSignup.deleteOne({ phone: normalizedPhone });
}
