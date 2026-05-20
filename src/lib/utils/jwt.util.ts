import { SignJWT, jwtVerify } from 'jose';
import { Role } from '../constants/roles';

if (!process.env.JWT_SECRET) {
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  if (process.env.NODE_ENV === 'production' && !isCI) {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-fallback-secret-key-change-in-production');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '3h';

export async function generateToken(userId: string, role: string): Promise<string> {
  const alg = 'HS256';
  return new SignJWT({ userId, role }).setProtectedHeader({ alg }).setExpirationTime(JWT_EXPIRES_IN).sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string; role: Role } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as { userId: string; role: Role };
  } catch (_error) {
    return null;
  }
}
