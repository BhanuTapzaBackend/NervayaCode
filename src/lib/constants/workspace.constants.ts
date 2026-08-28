/**
 * How the Calendar API is authenticated.
 *
 *  - `oauth`     — ONE Google account (a plain Gmail is fine) grants offline
 *                  access once, and every session event lives on its calendar.
 *                  This is the default because it needs no Google Workspace.
 *  - `delegated` — a service account with domain-wide delegation impersonates
 *                  each therapist's own @nervaya.com mailbox. Requires
 *                  Workspace: delegation is authorised in the Admin console,
 *                  which a consumer Gmail does not have.
 *
 * The two modes differ only in how a client is built — event tagging,
 * per-therapist filtering and the rest of the pipeline are identical.
 *
 * ⚠️ Switching to `delegated` is NOT just an env-var flip. Every historical
 * event lives on the old consumer Gmail, which a domain-delegated service
 * account cannot reach (it can only impersonate accounts inside the domain).
 * So every therapist's calendar would read empty, and every stored
 * `Session.googleEventId` would become unresolvable — breaking cancel and
 * reschedule for all pre-migration sessions. A cross-account event migration
 * has to be written first.
 */
export type CalendarAuthMode = 'oauth' | 'delegated';

export function getCalendarAuthMode(): CalendarAuthMode {
  return process.env.GOOGLE_CALENDAR_AUTH_MODE?.trim().toLowerCase() === 'delegated' ? 'delegated' : 'oauth';
}

/**
 * The single account that owns every event in `oauth` mode.
 *
 * Display only — API calls target that account's `primary` calendar via its
 * refresh token, so the value here never selects anything.
 */
export const CALENDAR_ACCOUNT_EMAIL = (process.env.GOOGLE_CALENDAR_ACCOUNT || 'Nervaya calendar').trim().toLowerCase();

/**
 * The Google Workspace domain therapists belong to.
 *
 * A therapist's email is load-bearing in three places at once: it is their
 * Google sign-in identity, it is the value that promotes their User to the
 * THERAPIST role, and — when it is a workspace address — the mailbox the
 * Calendar service account impersonates. A typo breaks all three.
 *
 * Public on purpose (NEXT_PUBLIC_): the admin form validates the domain
 * client-side before submit. It is a domain name, not a secret.
 */
export const WORKSPACE_DOMAIN = (process.env.NEXT_PUBLIC_GOOGLE_WORKSPACE_DOMAIN || 'nervaya.com').trim().toLowerCase();

/**
 * Fallback calendar for therapists who do NOT have a workspace mailbox.
 *
 * Domain-wide delegation can only impersonate accounts inside the domain, so a
 * therapist on a personal Gmail cannot host their own event. Rather than block
 * their bookings, their sessions live on this one shared Nervaya calendar and
 * are filtered back out per therapist for their dashboard — see
 * `resolveCalendarOwner`. They are still invited as an attendee, so the Meet
 * link reaches them.
 */
export const SHARED_CALENDAR_MAILBOX = (process.env.GOOGLE_SHARED_CALENDAR_MAILBOX || `sessions@${WORKSPACE_DOMAIN}`)
  .trim()
  .toLowerCase();

/** The mailbox that owns free-consultation events (no therapist is assigned yet). */
export const CONSULTATION_MAILBOX = (process.env.GOOGLE_CONSULTATION_MAILBOX || `consultations@${WORKSPACE_DOMAIN}`)
  .trim()
  .toLowerCase();

/**
 * True when `email` is a mailbox inside the Workspace domain.
 *
 * Only addresses that pass this may be used as a Calendar impersonation
 * subject — the service account can act as ANY user in the domain, so the
 * target must never be attacker- or typo-influenced into something else.
 */
export function isWorkspaceEmail(email: string | null | undefined): boolean {
  if (typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  // Reject embedded '@' (a@b@nervaya.com) so the suffix check can't be spoofed.
  const parts = normalized.split('@');
  return parts.length === 2 && parts[0].length > 0 && parts[1] === WORKSPACE_DOMAIN;
}
