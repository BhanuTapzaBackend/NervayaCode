import { google, type calendar_v3 } from 'googleapis';

import { WORKSPACE_DOMAIN, isWorkspaceEmail, getCalendarAuthMode } from '@/lib/constants/workspace.constants';

/**
 * Google Calendar access, in one of two modes. See CalendarAuthMode.
 *
 * `oauth` (default) — one Google account holds a refresh token and owns every
 * event. Works with an ordinary Gmail, which is what Nervaya has today: there
 * is no Workspace tenant yet, and domain-wide delegation is impossible without
 * one (it is authorised in the Admin console, which consumer accounts lack).
 *
 * `delegated` — a service account impersonates each therapist's own workspace
 * mailbox. Better (every therapist hosts their own Meet on their own calendar),
 * but gated on buying Workspace.
 *
 * ⚠️ Either credential is highly privileged: the refresh token can read and
 * write that account's whole calendar, and a service account key can act as ANY
 * user in the domain. Treat both like JWT_SECRET — server-only, never
 * NEXT_PUBLIC_.
 */

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

function readPrivateKey(): string {
  const raw = process.env.GOOGLE_SA_PRIVATE_KEY;
  if (!raw?.trim()) throw new Error('GOOGLE_SA_PRIVATE_KEY is not set');
  // Env vars flatten newlines; the PEM parser needs them back.
  return raw.replace(/\\n/g, '\n');
}

function readOAuthClientId(): string {
  const value = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!value) throw new Error('GOOGLE_CLIENT_ID is not set');
  return value;
}

function readOAuthClientSecret(): string {
  const value = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!value) throw new Error('GOOGLE_CLIENT_SECRET is not set');
  return value;
}

/**
 * The calendar grant's refresh token — a different env var from anything the
 * login flow uses, so re-granting calendar access cannot disturb sign-in.
 *
 * ⚠️ The CLIENT ID AND SECRET ARE SHARED with the login flow
 * (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`). A refresh token is bound to
 * the OAuth client that issued it, so rotating the secret for a login-side
 * incident — or repointing GOOGLE_CLIENT_ID at a different client — kills
 * calendar immediately with `invalid_grant`, and every booking degrades to
 * `meetStatus: 'pending'`. Give calendar its own OAuth client if that coupling
 * is unacceptable.
 */
function readOAuthRefreshToken(): string {
  const value = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN?.trim();
  if (!value) throw new Error('GOOGLE_CALENDAR_REFRESH_TOKEN is not set');
  return value;
}

function readClientEmail(): string {
  const value = process.env.GOOGLE_SA_CLIENT_EMAIL?.trim();
  if (!value) throw new Error('GOOGLE_SA_CLIENT_EMAIL is not set');
  return value;
}

/** True when the active mode's credentials are present. Callers degrade rather than throw. */
export function hasCalendarCredentials(): boolean {
  if (getCalendarAuthMode() === 'delegated') {
    return Boolean(process.env.GOOGLE_SA_CLIENT_EMAIL?.trim() && process.env.GOOGLE_SA_PRIVATE_KEY?.trim());
  }
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim() &&
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN?.trim(),
  );
}

/**
 * A Calendar client for the calendar identified by `mailbox`.
 *
 * Built per call, never cached at module scope. In `delegated` mode a client is
 * bound to one impersonation subject, and a shared instance would leak one
 * therapist's calendar into another's request as soon as a serverless container
 * is reused. Construction is local (a signed JWT, or setting credentials on an
 * OAuth2 client), so this is cheap.
 */
export function getCalendarClientFor(mailbox: string): calendar_v3.Calendar {
  if (getCalendarAuthMode() === 'delegated') {
    const subject = mailbox.trim().toLowerCase();

    // Hard stop: the key can impersonate anyone in the domain, so the subject
    // is never allowed to be a value that drifted in from user input.
    if (!isWorkspaceEmail(subject)) {
      throw new Error(`Refusing to impersonate "${subject}" — not a @${WORKSPACE_DOMAIN} mailbox`);
    }

    const auth = new google.auth.JWT({
      email: readClientEmail(),
      key: readPrivateKey(),
      scopes: [CALENDAR_SCOPE],
      subject,
    });

    return google.calendar({ version: 'v3', auth });
  }

  // oauth mode: there is exactly one calendar, reached through the refresh
  // token of the account that granted access. `mailbox` is not used to select
  // anything here — every write lands on that account's `primary` calendar.
  const auth = new google.auth.OAuth2(readOAuthClientId(), readOAuthClientSecret());
  auth.setCredentials({ refresh_token: readOAuthRefreshToken() });

  return google.calendar({ version: 'v3', auth });
}

/**
 * Classifies a Google API failure so callers know whether retrying helps.
 *
 * `config` covers the setup mistakes that look identical at runtime: a revoked
 * or expired refresh token, delegation not authorised, a missing mailbox. All
 * need a human, so they must never be retried in a request path.
 */
export type CalendarErrorKind = 'config' | 'retryable' | 'fatal';

export function classifyCalendarError(error: unknown): CalendarErrorKind {
  const err = error as {
    code?: number | string;
    status?: number;
    message?: string;
    errors?: Array<{ reason?: string }>;
  };

  const status = typeof err?.code === 'number' ? err.code : err?.status;
  const reason = err?.errors?.[0]?.reason ?? '';
  const message = String(err?.message ?? '');

  // Rate limits MUST be tested before the bare status check. Google answers
  // quota exhaustion with 403 far more often than 429, so an earlier
  // `status === 403 -> config` would swallow every rate limit and refuse to
  // retry it — stranding a paid booking with no link on ordinary load.
  const RATE_LIMIT_REASONS = ['rateLimitExceeded', 'userRateLimitExceeded', 'quotaExceeded', 'usageLimits'];
  if (status === 429 || RATE_LIMIT_REASONS.includes(reason) || message.includes('usageLimits')) {
    return 'retryable';
  }

  if (
    message.includes('unauthorized_client') ||
    message.includes('invalid_grant') ||
    message.includes('Refusing to impersonate') ||
    message.includes('is not set') ||
    reason === 'forbidden' ||
    reason === 'insufficientPermissions'
  ) {
    return 'config';
  }
  if (status === 401 || status === 403) return 'config';
  if (typeof status === 'number' && status >= 500) return 'retryable';
  if (message.includes('ETIMEDOUT') || message.includes('ECONNRESET')) return 'retryable';

  return 'fatal';
}
