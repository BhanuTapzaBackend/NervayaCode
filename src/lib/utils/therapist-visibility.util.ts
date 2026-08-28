import { NextRequest } from 'next/server';

import { authenticateRequest } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

/**
 * Fields that must not reach an unauthenticated caller.
 *
 * `email` used to be a display field with no index. It is now the therapist's
 * Google sign-in address, the value that promotes their User to THERAPIST, and
 * (under domain-wide delegation) a valid Calendar impersonation subject —
 * while `GET /api/therapists` stayed public so the booking directory works.
 * Publishing it hands out the target list for those paths.
 */
const PRIVATE_THERAPIST_FIELDS = ['email'] as const;

/** True when the request carries a valid ADMIN session. Never throws. */
export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  try {
    const result = await authenticateRequest(request);
    return 'user' in result && result.user.role === ROLES.ADMIN;
  } catch {
    return false;
  }
}

/** Removes private fields from a therapist document (or a list of them). */
export function stripPrivateTherapistFields<T extends Record<string, unknown>>(therapist: T): T {
  const clone = { ...therapist };
  for (const field of PRIVATE_THERAPIST_FIELDS) {
    delete clone[field];
  }
  return clone;
}

export function stripPrivateTherapistFieldsFromList<T extends Record<string, unknown>>(therapists: T[]): T[] {
  return therapists.map(stripPrivateTherapistFields);
}
