/** The public brand origin. Every customer-facing link falls back to this. */
export const CANONICAL_SITE_URL = 'https://nervaya.com';

/**
 * Absolute origin for links we hand to users (meeting rooms, emails, WhatsApp).
 *
 * `NEXT_PUBLIC_APP_URL` is honoured so local dev and self-hosted setups work,
 * with one exception: Vercel's own `*.vercel.app` deployment hostnames are
 * ignored. Those are per-project/per-deploy URLs — shipping one to a customer
 * makes a session link look like it isn't Nervaya, and preview URLs rot once a
 * newer deploy lands. In both cases the branded domain is the right answer.
 *
 * Returns an origin with no trailing slash, e.g. `https://nervaya.com`.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) return CANONICAL_SITE_URL;

  let hostname: string;
  try {
    hostname = new URL(configured).hostname;
  } catch {
    // Malformed value — don't build user-facing links out of it.
    return CANONICAL_SITE_URL;
  }

  if (/(^|\.)vercel\.app$/i.test(hostname)) return CANONICAL_SITE_URL;

  return configured.replace(/\/+$/, '');
}
