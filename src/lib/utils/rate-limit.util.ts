import {
  MAX_LOGIN_ATTEMPTS,
  LOGIN_WINDOW_MS,
  MAX_SIGNUP_ATTEMPTS,
  SIGNUP_WINDOW_MS,
  MAX_OTP_SEND_PER_EMAIL,
  OTP_SEND_WINDOW_MS,
  MAX_OTP_VERIFY_ATTEMPTS,
  OTP_VERIFY_WINDOW_MS,
} from '@/lib/constants/otp.constants';
import RateLimit from '@/lib/models/rateLimit.model';
import connectDB from '@/lib/db/mongodb';

export interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetTime?: number;
}

async function checkWindow(
  prefix: string,
  identifier: string,
  maxAttempts: number,
  windowMs: number,
): Promise<RateLimitResult> {
  await connectDB();
  const key = `${prefix}:${identifier}`;
  const now = new Date();

  const entry = await RateLimit.findOneAndUpdate(
    { key },
    {
      $setOnInsert: { sendCount: 0, expiresAt: new Date(now.getTime() + windowMs) },
      $inc: { count: 1 },
    },
    { upsert: true, new: true },
  );

  if (now > entry.expiresAt) {
    await RateLimit.findOneAndUpdate(
      { key },
      { count: 1, sendCount: 0, expiresAt: new Date(now.getTime() + windowMs) },
    );
    return { allowed: true, remaining: maxAttempts - 1, resetTime: now.getTime() + windowMs };
  }

  if (entry.count > maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: entry.expiresAt.getTime() };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - entry.count),
    resetTime: entry.expiresAt.getTime(),
  };
}

export async function checkLoginRateLimit(identifier: string): Promise<boolean> {
  const result = await checkWindow('login', identifier, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS);
  return result.allowed;
}

export async function checkSignupRateLimit(identifier: string): Promise<boolean> {
  const result = await checkWindow('signup', identifier, MAX_SIGNUP_ATTEMPTS, SIGNUP_WINDOW_MS);
  return result.allowed;
}

export interface OTPSendLimitResult {
  allowed: boolean;
  sendCount: number;
  resetTime?: number;
}

export async function checkOTPSendLimit(identifier: string): Promise<OTPSendLimitResult> {
  await connectDB();
  const key = `otp-send:${identifier}`;
  const now = new Date();

  const entry = await RateLimit.findOneAndUpdate(
    { key },
    {
      $setOnInsert: { expiresAt: new Date(now.getTime() + OTP_SEND_WINDOW_MS) },
      $inc: { count: 1, sendCount: 1 },
    },
    { upsert: true, new: true },
  );

  if (now > entry.expiresAt) {
    await RateLimit.findOneAndUpdate(
      { key },
      { count: 1, sendCount: 1, expiresAt: new Date(now.getTime() + OTP_SEND_WINDOW_MS) },
    );
    return { allowed: true, sendCount: 1, resetTime: now.getTime() + OTP_SEND_WINDOW_MS };
  }

  if (entry.sendCount > MAX_OTP_SEND_PER_EMAIL) {
    return { allowed: false, sendCount: entry.sendCount, resetTime: entry.expiresAt.getTime() };
  }

  return { allowed: true, sendCount: entry.sendCount, resetTime: entry.expiresAt.getTime() };
}

export async function checkOTPVerifyRateLimit(identifier: string): Promise<boolean> {
  const result = await checkWindow('otp-verify', identifier, MAX_OTP_VERIFY_ATTEMPTS, OTP_VERIFY_WINDOW_MS);
  return result.allowed;
}
