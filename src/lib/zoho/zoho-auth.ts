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
 * Fetches a fresh Zoho OAuth Access Token using the stored Refresh Token.
 *
 * Called inside every API route handler to guarantee the token is always valid.
 * Zoho tokens expire in 3600 seconds; the overhead of one extra POST request
 * per serverless invocation is acceptable and far safer than caching.
 *
 * @returns A valid Zoho OAuth access token string.
 * @throws {AppError} when env vars are missing or Zoho returns an error.
 */
export async function getZohoAccessToken(): Promise<string> {
  const accountsUrl = assertEnvVar('ZOHO_ACCOUNTS_URL');
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

  return data.access_token;
}
