import { createHash, randomInt } from 'crypto';
import { OTP_TTL_MS, OTP_LENGTH } from '@/lib/constants/otp.constants';
import OtpToken from '@/lib/models/otpToken.model';
import connectDB from '@/lib/db/mongodb';

export type OtpPurpose = 'login' | 'signup';

function key(email: string, purpose: OtpPurpose): string {
  return `${email.toLowerCase().trim()}:${purpose}`;
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function generateOtpCode(): string {
  const digits: string[] = [];
  for (let i = 0; i < OTP_LENGTH; i++) {
    digits.push(String(randomInt(0, 10)));
  }
  return digits.join('');
}

export async function saveOtp(email: string, purpose: OtpPurpose, code: string): Promise<void> {
  await connectDB();
  const k = key(email, purpose);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await OtpToken.findOneAndUpdate({ key: k }, { hashedOtp: hashCode(code), purpose, expiresAt }, { upsert: true });
}

export async function verifyAndConsumeOtp(email: string, purpose: OtpPurpose, code: string): Promise<boolean> {
  await connectDB();
  const k = key(email, purpose);
  const entry = await OtpToken.findOne({ key: k });
  if (!entry) return false;
  if (new Date() > entry.expiresAt) {
    await OtpToken.deleteOne({ key: k });
    return false;
  }
  const match = entry.hashedOtp === hashCode(code);
  if (match) {
    await OtpToken.deleteOne({ key: k });
  }
  return match;
}

export async function hasValidOtp(email: string, purpose: OtpPurpose): Promise<boolean> {
  await connectDB();
  const k = key(email, purpose);
  const entry = await OtpToken.findOne({ key: k });
  if (!entry) return false;
  if (new Date() > entry.expiresAt) {
    await OtpToken.deleteOne({ key: k });
    return false;
  }
  return true;
}
