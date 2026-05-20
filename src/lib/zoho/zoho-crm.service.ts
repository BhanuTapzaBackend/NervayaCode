// ─────────────────────────────────────────────────────────────────────────────
// Zoho CRM – Service Helpers
//
// Uses the UPSERT endpoint (/crm/v3/Leads/upsert) with duplicate_check_fields
// ["Email"] so that:
//   • New email  → Zoho CREATES a new Lead record
//   • Known email → Zoho UPDATES the existing Lead record (no duplicate)
//
// All functions are designed to be called fire-and-forget:
//   pushLeadToZoho(...).catch(() => undefined)
// A Zoho outage will NEVER break a user-facing flow.
// ─────────────────────────────────────────────────────────────────────────────

import { getZohoAccessToken } from './zoho-auth';
import { ZohoCRMResponse, ZohoLeadPayload, ZohoUpsertBody } from './types';

// ─── Core upsert function ────────────────────────────────────────────────────

/**
 * Upserts a single lead into Zoho CRM, deduplicating on the Email field.
 *
 * - If no lead with that email exists → creates a new Lead.
 * - If a lead already exists with that email → updates it in place.
 *
 * Safe to call fire-and-forget: `.catch(() => undefined)`
 */
export async function pushLeadToZoho(payload: ZohoLeadPayload): Promise<void> {
  const apiUrl = process.env.ZOHO_API_URL;
  if (!apiUrl) {
    console.warn('[Zoho] ZOHO_API_URL is not set — skipping lead push.');
    return;
  }

  const accessToken = await getZohoAccessToken();

  // Deduplicate on Email always; also on Phone when present so a future
  // mobile-number lookup works without any code changes.
  const duplicateCheckFields = ['Email'];
  if (payload.Phone) duplicateCheckFields.push('Phone');

  const body: ZohoUpsertBody = {
    data: [payload],
    duplicate_check_fields: duplicateCheckFields,
  };

  const response = await fetch(`${apiUrl}/crm/v3/Leads/upsert`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Zoho CRM responded with HTTP ${response.status}`);
  }

  const data = (await response.json()) as ZohoCRMResponse;
  const record = data.data?.[0];

  if (record?.status === 'error') {
    throw new Error(`Zoho rejected lead: ${record.message} (code: ${record.code})`);
  }
}

// ─── Named helpers for specific touchpoints ──────────────────────────────────

/**
 * Push a newly verified Nervaya signup to Zoho CRM.
 * Lead_Source = "Nervaya Signup"
 */
export function pushSignupLeadToZoho(name: string, email: string, phone?: string): Promise<void> {
  const { lastName, firstName } = splitName(name);
  return pushLeadToZoho({
    Last_Name: lastName,
    ...(firstName && { First_Name: firstName }),
    Email: email,
    ...(phone && { Phone: phone }),
    Lead_Source: 'Nervaya Signup',
    Company: 'Nervaya User',
  });
}

/**
 * Push a sleep-assessment completion to Zoho CRM.
 * Updates existing lead with the sleep score details if they've already signed up.
 * Lead_Source = "Sleep Assessment"
 */
export function pushAssessmentLeadToZoho(
  name: string,
  email: string,
  scoreLabel: string,
  phone?: string,
): Promise<void> {
  const { lastName, firstName } = splitName(name);
  return pushLeadToZoho({
    Last_Name: lastName,
    ...(firstName && { First_Name: firstName }),
    Email: email,
    ...(phone && { Phone: phone }),
    Lead_Source: 'Sleep Assessment',
    Description: `Sleep assessment completed. Score band: ${scoreLabel}`,
    Company: 'Nervaya User',
  });
}

/**
 * Push a Deep Rest assessment completion to Zoho CRM.
 * Updates existing lead with the Deep Rest assessment status.
 */
export function pushDeepRestLeadToZoho(name: string, email: string, phone?: string): Promise<void> {
  const { lastName, firstName } = splitName(name);
  return pushLeadToZoho({
    Last_Name: lastName,
    ...(firstName && { First_Name: firstName }),
    Email: email,
    ...(phone && { Phone: phone }),
    Lead_Source: 'Deep Rest Assessment',
    Description: `Deep Rest assessment (Drift Off) completed.`,
    Company: 'Nervaya User',
  });
}

/**
 * Push a support/contact enquiry to Zoho CRM.
 * Lead_Source = "Support Enquiry"
 */
export function pushSupportLeadToZoho(name: string, email: string, message?: string, phone?: string): Promise<void> {
  const { lastName, firstName } = splitName(name);
  return pushLeadToZoho({
    Last_Name: lastName,
    ...(firstName && { First_Name: firstName }),
    Email: email,
    ...(phone && { Phone: phone }),
    Lead_Source: 'Support Enquiry',
    ...(message && { Description: message }),
    Company: 'Nervaya User',
  });
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function splitName(fullName: string): { firstName?: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
