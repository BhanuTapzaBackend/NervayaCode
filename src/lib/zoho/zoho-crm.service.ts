// ─────────────────────────────────────────────────────────────────────────────
// Zoho CRM – Service Helpers
//
// Uses the UPSERT endpoint (/crm/v3/Leads/upsert), matching on every identifier
// the payload carries (Phone and/or Email) so that:
//   • New contact   → Zoho CREATES a new Lead record
//   • Known contact → Zoho UPDATES the existing Lead record (no duplicate)
//
// All functions are designed to be called fire-and-forget, via:
//   pushLeadSafely('label', () => pushXLeadToZoho(...))
// A Zoho outage will NEVER break a user-facing flow — but unlike a bare
// `.catch(() => undefined)`, the failure is logged rather than lost.
// ─────────────────────────────────────────────────────────────────────────────

import { getZohoAccessToken, getZohoApiBaseUrl } from './zoho-auth';
import { ZohoCRMResponse, ZohoLeadPayload, ZohoUpsertBody } from './types';
import { npsCategoryFor } from '@/utils/nps.util';

// ─── Core upsert function ────────────────────────────────────────────────────

/**
 * Find an existing lead by the identifiers we hold, returning its record id.
 *
 * Necessary because `duplicate_check_fields` only matches on fields Zoho treats
 * as unique. `Email` is unique on Leads by default but `Phone` is NOT, so a
 * phone-only upsert silently creates a second record for someone who is already
 * in the CRM. Verified: a purchase pushed 45s after a signup, same phone, made
 * two leads. Searching first is what makes phone-keyed dedup actually work.
 *
 * Returns null when nothing matches, or when the search itself fails — the
 * caller then falls back to upsert, which is never worse than today's behaviour.
 */
async function findExistingLeadId(
  apiUrl: string,
  accessToken: string,
  payload: ZohoLeadPayload,
): Promise<string | null> {
  const criteria = [
    ...(payload.Phone ? [`(Phone:equals:${payload.Phone})`] : []),
    ...(payload.Email ? [`(Email:equals:${payload.Email})`] : []),
  ];
  if (criteria.length === 0) return null;

  const query = criteria.length > 1 ? `(or${criteria.join('')})` : criteria[0];

  try {
    const response = await fetch(`${apiUrl}/crm/v3/Leads/search?criteria=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });
    // 204 = no match. Anything else non-OK: fall through to upsert.
    if (response.status !== 200) return null;
    const data = (await response.json()) as { data?: Array<{ id?: string }> };
    return data.data?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Write a lead into Zoho CRM, deduplicating on every identifier the payload
 * carries (Phone and/or Email).
 *
 * - No matching lead → creates one.
 * - Matching lead → updates it in place, touching only the fields supplied.
 *
 * Safe to call fire-and-forget — prefer `pushLeadSafely()` so failures are logged.
 */
export async function pushLeadToZoho(payload: ZohoLeadPayload): Promise<void> {
  const apiUrl = getZohoApiBaseUrl();
  const accessToken = await getZohoAccessToken();

  // Match on EVERY identifier we hold, not just the preferred one.
  //
  // Signup no longer requires a phone, so a Google user is first upserted with
  // only an Email. Checking Phone alone once they later add a number would miss
  // that existing lead and create a duplicate for the same person. Passing both
  // lets Zoho match the earlier Email-keyed record and merge the phone into it.
  const duplicateCheckFields = [...(payload.Phone ? ['Phone'] : []), ...(payload.Email ? ['Email'] : [])];

  // With no identifier Zoho cannot match an existing record, so an upsert would
  // create a fresh duplicate on every call. Skip instead.
  if (duplicateCheckFields.length === 0) {
    throw new Error('Zoho lead has neither Phone nor Email — refusing to create an undeduplicable record');
  }

  // Update in place when the person is already in the CRM. Only the supplied
  // fields are touched, so a purchase push cannot blank an existing Lead_Source.
  const existingId = await findExistingLeadId(apiUrl, accessToken, payload);

  const body: ZohoUpsertBody = {
    data: [payload],
    duplicate_check_fields: duplicateCheckFields,
  };

  const response = existingId
    ? await fetch(`${apiUrl}/crm/v3/Leads`, {
        method: 'PUT',
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [{ id: existingId, ...payload }] }),
      })
    : await fetch(`${apiUrl}/crm/v3/Leads/upsert`, {
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
export function pushSignupLeadToZoho(name: string, email?: string, phone?: string): Promise<void> {
  const { lastName, firstName } = splitName(name);
  return pushLeadToZoho({
    Last_Name: lastName,
    ...(firstName && { First_Name: firstName }),
    ...(email && { Email: email }),
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
  email: string | undefined,
  scoreLabel: string,
  phone?: string,
): Promise<void> {
  const { lastName, firstName } = splitName(name);
  return pushLeadToZoho({
    Last_Name: lastName,
    ...(firstName && { First_Name: firstName }),
    ...(email && { Email: email }),
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
export function pushDeepRestLeadToZoho(name: string, email?: string, phone?: string): Promise<void> {
  const { lastName, firstName } = splitName(name);
  return pushLeadToZoho({
    Last_Name: lastName,
    ...(firstName && { First_Name: firstName }),
    ...(email && { Email: email }),
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
export function pushSupportLeadToZoho(name: string, email?: string, message?: string, phone?: string): Promise<void> {
  const { lastName, firstName } = splitName(name);
  return pushLeadToZoho({
    Last_Name: lastName,
    ...(firstName && { First_Name: firstName }),
    ...(email && { Email: email }),
    ...(phone && { Phone: phone }),
    Lead_Source: 'Support Enquiry',
    ...(message && { Description: message }),
    Company: 'Nervaya User',
  });
}

/**
 * Push a free-consultation booking to Zoho CRM.
 *
 * The client used to push this too, under a second Lead_Source, so whichever
 * request landed last decided the attribution. The server is the only producer
 * now. Lead_Source = "Free Consultation"
 */
export function pushConsultationLeadToZoho(params: {
  name: string;
  email?: string | undefined;
  phone?: string | undefined;
  message?: string;
}): Promise<void> {
  const { lastName, firstName } = splitName(params.name);
  return pushLeadToZoho({
    Last_Name: lastName,
    ...(firstName && { First_Name: firstName }),
    ...(params.email && { Email: params.email }),
    ...(params.phone && { Phone: params.phone }),
    Lead_Source: 'Free Consultation',
    ...(params.message && { Description: params.message }),
    Company: 'Nervaya User',
  });
}

/**
 * Record an NPS response against the responder's lead.
 *
 * Like purchases, this omits `Lead_Source` so it updates the existing record
 * without rewriting how that person was acquired. A detractor is the single most
 * useful thing customer success can see on a lead, so the band is spelled out
 * rather than left as a bare number.
 */
export function pushNpsLeadToZoho(params: {
  name: string;
  email?: string | undefined;
  phone?: string | undefined;
  score: number;
  comment?: string | undefined;
  pageUrl?: string | undefined;
}): Promise<void> {
  const { lastName, firstName } = splitName(params.name);
  const band = npsCategoryFor(params.score).toUpperCase();
  return pushLeadToZoho({
    Last_Name: lastName,
    ...(firstName && { First_Name: firstName }),
    ...(params.email && { Email: params.email }),
    ...(params.phone && { Phone: params.phone }),
    Description: `NPS ${params.score}/10 — ${band}${params.pageUrl ? ` (from ${params.pageUrl})` : ''}${
      params.comment ? `. "${params.comment}"` : ''
    }`,
  });
}

/**
 * Record a product/session review against the reviewer's lead.
 *
 * Omits `Lead_Source` for the same reason as purchases and NPS.
 */
export function pushReviewLeadToZoho(params: {
  name: string;
  email?: string | undefined;
  phone?: string | undefined;
  rating: number;
  itemType: string;
  comment?: string | undefined;
}): Promise<void> {
  const { lastName, firstName } = splitName(params.name);
  return pushLeadToZoho({
    Last_Name: lastName,
    ...(firstName && { First_Name: firstName }),
    ...(params.email && { Email: params.email }),
    ...(params.phone && { Phone: params.phone }),
    Description: `Reviewed ${params.itemType} — ${params.rating}/5${params.comment ? `. "${params.comment}"` : ''}`,
  });
}

/** One purchased line item, as it should read to a salesperson in the CRM. */
export interface ZohoPurchaseItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ZohoPurchaseLead {
  name: string;
  email?: string | undefined;
  phone?: string | undefined;
  orderId: string;
  amount: number;
  items: ZohoPurchaseItem[];
  /** Which flow the money came through, e.g. "Supplement order", "Deep Rest". */
  channel: string;
}

/**
 * Record a completed purchase against the buyer's lead.
 *
 * Deliberately omits `Lead_Source`: the buyer already has one from signup or an
 * assessment, and an upsert would overwrite that original attribution. Only the
 * fields listed here are touched.
 */
export function pushPurchaseLeadToZoho(purchase: ZohoPurchaseLead): Promise<void> {
  const { lastName, firstName } = splitName(purchase.name);
  const lines = purchase.items.map((i) => `${i.name} x${i.quantity} (${formatInr(i.price * i.quantity)})`).join(', ');
  return pushLeadToZoho({
    Last_Name: lastName,
    ...(firstName && { First_Name: firstName }),
    ...(purchase.email && { Email: purchase.email }),
    ...(purchase.phone && { Phone: purchase.phone }),
    Company: 'Nervaya Customer',
    Description: `${purchase.channel} paid — ${formatInr(purchase.amount)} (order ${purchase.orderId})${
      lines ? `. Items: ${lines}` : ''
    }`,
  });
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Fire-and-forget wrapper. Zoho must never break a user-facing flow, but a
 * silent `.catch(() => undefined)` is why a 404 went unnoticed for so long — so
 * failures are logged instead of swallowed.
 */
export function pushLeadSafely(label: string, push: () => Promise<void>): void {
  void push().catch((error: unknown) => {
    console.error(`[Zoho] ${label} lead push failed:`, error instanceof Error ? error.message : error);
  });
}

function formatInr(amount: number): string {
  return `INR ${amount.toLocaleString('en-IN')}`;
}

function splitName(fullName: string): { firstName?: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
