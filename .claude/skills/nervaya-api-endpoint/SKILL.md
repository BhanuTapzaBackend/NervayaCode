---
name: nervaya-api-endpoint
description: Build a Nervaya backend endpoint the house way — thin Route Handler → Service → Model, with requireAuth, response envelope, input clamping, and post-commit side-effects. Use when creating or modifying anything under src/app/api/.
---

# Nervaya API Endpoint

Full rules: `FRONTEND_STANDARDS.md` §3 (API layer), §7 (auth), §8 (DB).

## The three layers — never skip one

1. **Route Handler** `src/app/api/<domain>/route.ts` — auth, parse, delegate, respond. NO business logic, NO model imports.
2. **Service** `src/lib/services/<domain>.service.ts` — ALL business logic and DB access. Explicit return types.
3. **Model** `src/lib/models/<domain>.model.ts` — Mongoose schema.

## Route handler template

```ts
import { NextRequest, NextResponse } from 'next/server';
import { doThing } from '@/lib/services/thing.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) {
      return authResult; // 401/403 already built
    }

    const { searchParams } = new URL(request.url);
    // Clamp EVERY numeric param — never trust raw searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    const result = await doThing(authResult.user.userId, page, limit);
    return NextResponse.json(successResponse('Fetched', result));
  } catch (error) {
    return handleError(error);
  }
}
```

Reference implementation: `src/app/api/orders/route.ts`.

## Checklist

- [ ] `requireAuth(request, [ROLES.X])` on every protected route; check `instanceof NextResponse`. `src/middleware.ts` is routing convenience, NOT authorization.
- [ ] Add `requirePhone(userId)` (from `@/lib/middleware/phone-gate`) for order/session flows.
- [ ] Every response is `successResponse()`/`errorResponse()` — never hand-built JSON.
- [ ] Validate input at the edge: clamp numbers, check enums against `src/lib/constants/enums.ts` values, 400 early on bad input.
- [ ] NEVER put user input in `new RegExp()` (escape it first — ReDoS) or `path.join()` (path traversal).
- [ ] Public endpoints (no auth) get a per-IP/per-phone rate limit backed by the `rateLimit` TTL collection.
- [ ] External I/O (email, WhatsApp, Zoho, PDF) runs AFTER the DB transaction commits, never inside it. Fire-and-forget calls MUST log failures via `console.error` — never `.catch(() => undefined)`.
- [ ] Webhooks: verify signature (HMAC) first, dedupe on a unique key, always return 200.
- [ ] Errors thrown are `Error` objects, caught as `unknown`, narrowed with `instanceof`.
