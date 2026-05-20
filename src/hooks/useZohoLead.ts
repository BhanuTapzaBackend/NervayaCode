// ─────────────────────────────────────────────────────────────────────────────
// useZohoLead – lightweight client-side hook
//
// Calls POST /api/zoho/lead (our secure Next.js server route).
// Always fire-and-forget: a Zoho failure must NEVER surface to the user.
//
// Usage:
//   const { pushLead } = useZohoLead();
//   pushLead({ firstName: 'John', lastName: 'Doe', email: 'j@example.com' });
// ─────────────────────────────────────────────────────────────────────────────

export interface ZohoLeadInput {
  /** Full name (e.g., 'John Doe'). If provided, firstName and lastName will be inferred. */
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  /** Optional mobile — used now and will auto-populate Phone in Zoho when collected */
  phone?: string;
  source?: string;
  message?: string;
}

export function useZohoLead() {
  const pushLead = (input: ZohoLeadInput): void => {
    let { firstName, lastName } = input;
    const { name } = input;

    // Auto-split name if firstName/lastName aren't provided
    if (name && !lastName) {
      const parts = name.trim().split(/\s+/);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || firstName;
    }

    if (!lastName) return; // Fallback safeguard

    // Fire-and-forget — intentionally not awaited
    fetch('/api/zoho/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        firstName,
        lastName,
      }),
    }).catch(() => {
      // Silently swallow — Zoho errors must never surface to users
    });
  };

  return { pushLead };
}
