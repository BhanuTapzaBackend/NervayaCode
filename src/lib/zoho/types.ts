// ─────────────────────────────────────────────────────────────────────────────
// Zoho CRM – Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

/** Payload to create a Lead in Zoho CRM. */
export interface ZohoLeadPayload {
  /** Required by Zoho: the lead's last name. */
  Last_Name: string;
  First_Name?: string;
  Email?: string;
  Phone?: string;
  Company?: string;
  Lead_Source?: string;
  Description?: string;
}

/** Raw structure returned by Zoho's OAuth token endpoint. */
export interface ZohoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  /** Only present if grant_type=authorization_code and access_type=offline */
  refresh_token?: string;
  error?: string;
}

/** Individual record result inside a Zoho CRM write response. */
export interface ZohoRecordResult {
  code: string;
  details: Record<string, string>;
  message: string;
  status: 'success' | 'error';
}

/** Top-level response from Zoho CRM when inserting records. */
export interface ZohoCRMResponse {
  data: ZohoRecordResult[];
}

/** Upsert request body — Zoho deduplicates on the specified fields. */
export interface ZohoUpsertBody {
  data: ZohoLeadPayload[];
  /** Fields Zoho uses to check for an existing record before creating a new one. */
  duplicate_check_fields: string[];
}

/** Shape of the request body sent by the Nervaya frontend to our internal API route. */
export interface CreateLeadRequest {
  firstName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  message?: string;
}
