// ─────────────────────────────────────────────────────────────────────────────
// Zoho CRM – Access Token Utility
//
// Zoho Access Tokens expire after exactly 1 hour. This module fetches a fresh
// token on every call using the stored Refresh Token. This is the safest
// approach for Vercel serverless functions because there is no persistent
// process to cache an in-memory token across invocations.
//
// ⚠️  All env vars are server-only. Never prefix them with NEXT_PUBLIC_.
// ─────────────────────────────────────────────────────────────────────────────

import { AppError } from '@/lib/utils/error.util';
import { ZohoTokenResponse } from './types';

function assertEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new AppError(`Missing required environment variable: ${name}`, 500);
  }
  return value;
}

/**
 * Zoho console values are routinely copied with a trailing slash. Appending a
 * path to one produces a double slash, which Zoho answers with 404 rather than
 * normalising — so every base URL is trimmed before use.
 */
function assertBaseUrl(name: string): string {
  return assertEnvVar(name).replace(/\/+$/, '');
}

/** Trimmed `ZOHO_API_URL`, e.g. `https://www.zohoapis.in`. */
export function getZohoApiBaseUrl(): string {
  return assertBaseUrl('ZOHO_API_URL');
}

/**
 * Cached access token, shared by every push in the same warm lambda.
 *
 * Zoho rate-limits refresh-token → access-token exchanges (roughly 15 per 10
 * minutes per refresh token) and answers HTTP 400 once exceeded. Fetching a
 * fresh token on every push burns that budget fast: a handful of signups plus a
 * purchase in the same window is enough to start failing. Vercel reuses warm
 * lambdas, so a module-level cache is both safe and the standard approach.
 */
let cachedToken: { value: string; expiresAt: number } | null = null;

/** Refresh this long before real expiry, so an in-flight request cannot age out. */
const TOKEN_EXPIRY_MARGIN_MS = 5 * 60 * 1000;

/**
 * Returns a valid Zoho OAuth access token, reusing a cached one when possible.
 *
 * @returns A valid Zoho OAuth access token string.
 * @throws {AppError} when env vars are missing or Zoho returns an error.
 */
export async function getZohoAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const accountsUrl = assertBaseUrl('ZOHO_ACCOUNTS_URL');
  const clientId = assertEnvVar('ZOHO_CLIENT_ID');
  const clientSecret = assertEnvVar('ZOHO_CLIENT_SECRET');
  const refreshToken = assertEnvVar('ZOHO_REFRESH_TOKEN');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(`${accountsUrl}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new AppError(`Zoho token request failed with status ${response.status}`, 502);
  }

  const data = (await response.json()) as ZohoTokenResponse;

  if (data.error) {
    throw new AppError(`Zoho OAuth error: ${data.error}`, 502);
  }

  if (!data.access_token) {
    throw new AppError('Zoho returned no access_token in response', 502);
  }

  const lifetimeMs = (data.expires_in ?? 3600) * 1000;
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + Math.max(0, lifetimeMs - TOKEN_EXPIRY_MARGIN_MS),
  };

  return data.access_token;
}
