# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build (webpack)
npm run lint         # Check ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format with Prettier
```

Run one-off scripts with `npx tsx`:

```bash
npx tsx scripts/verify-auth.ts                         # Seed DB with admin/customer/therapist users
npx tsx scripts/backfill-therapists-profile-fields.ts  # One-time DB migration for therapist records
```

There is no test suite in this repository.

## Architecture Overview

Nervaya is a Next.js 16 (App Router) fullstack mental health platform. The backend runs entirely as Next.js Route Handlers inside `src/app/api/`. The database is MongoDB via Mongoose. There is no separate backend server.

### Route Groups

The App Router uses three route groups to enforce role-based layouts:

- `src/app/(admin)/admin/*` — Admin-only pages (stats dashboard, manage therapists, supplements, blogs, orders, Deep Rest sessions, promo codes)
- `src/app/(customer)/*` — Customer pages (dashboard, supplements shop, cart, checkout, Deep Rest, sleep assessment, therapy booking, account)
- `src/app/(therapist)/therapist/*` — Therapist pages (dashboard, schedule management)
- Public pages live at the `src/app/` root: `/`, `/login`, `/signup`, `/about-us`, `/blog`, etc.

### Authentication & RBAC

**Middleware** (`src/proxy.ts`, consumed by `middleware.ts`): runs at the edge, reads the `auth_token` httpOnly cookie, verifies the JWT, and enforces role-based redirects. Therapists are hard-redirected to `/therapist/*` for all non-public routes; admins cannot access customer-only routes.

**API route auth**: every protected API route calls `requireAuth(request, [ROLES.X])` from `src/lib/middleware/auth.middleware.ts`. This verifies the cookie token and checks the role.

**Client-side auth**: `AuthContext` (`src/context/AuthContext.tsx`) hydrates from localStorage (`nervaya_auth_user`) on load, with a 7-day expiry stored alongside it. The actual session token lives in the httpOnly cookie only. A custom DOM event `auth-state-changed` keeps `CartContext` and the axios interceptor in sync when auth state changes.

Three roles: `ADMIN`, `CUSTOMER`, `THERAPIST` (see `src/lib/constants/enums.ts`).

### API Layer Pattern

All API routes follow this pattern:

1. `src/app/api/**` — Route Handlers (thin; call services, return JSON)
2. `src/lib/services/*.service.ts` — Business logic (one service file per domain, e.g. `supplement.service.ts`)
3. `src/lib/models/*.model.ts` — Mongoose schemas/models
4. `src/lib/utils/response.util.ts` — All API responses use `successResponse()` / `errorResponse()`, which return `{ success, message, data, statusCode }`

For complex domains (therapist scheduling), services are split into focused files: `therapistSchedule-generate.service.ts`, `therapistSchedule-query.service.ts`, `therapistSchedule-slot.service.ts`, `therapistSchedule.service.ts`.

### Client-Side Data Fetching

There is **no React Query / TanStack Query**. Data fetching uses custom hooks in `src/queries/` that wrap `useState` + `useEffect` + the API client. The API client modules live in `src/lib/api/` and call the axios instance from `src/lib/axios.ts` (baseURL `/api`, `withCredentials: true`; the response interceptor unwraps `.data` and handles 401s).

### Context Providers

Nested in `src/components/Providers.tsx` (innermost to outermost):
`SidebarProvider` → `LoadingProvider` → `CartProvider` → `AuthGuard` → `AuthProvider`

`AuthGuard` (`src/components/AuthGuard.tsx`) shows a loading screen while `AuthContext` is initializing (`initializing: true`), preventing layout flashes.

### Payments

Razorpay is used for both supplement orders and Deep Rest (sleep program) purchases. Two independent payment flows exist:

- `src/app/api/payments/` — supplement order payments
- `src/app/api/payments/deep-rest/` — Deep Rest program payments

The Razorpay script is loaded client-side via `src/components/common/RazorpayCheckoutScript/` and the checkout hook is `src/hooks/useRazorpayCheckout.ts`.

### "Deep Rest" / "Drift Off" Feature

The sleep therapy program was renamed from "Drift Off" to "Deep Rest". Permanent redirects from `/drift-off*` → `/deep-rest*` are configured in `next.config.ts`. Code files still use the `DriftOff` naming in many places (models, services, components).

### OTP Flow

Signup requires email OTP verification. Login OTP is controlled by the `REQUIRE_OTP_FOR_LOGIN=true` env var (default off). OTP delivery falls back from Gmail SMTP to console logging if `OTP_EMAIL_USER`/`OTP_EMAIL_APP_PASSWORD` are absent. The OTP store is in-memory (process-scoped).

### Zoho CRM Integration

The app integrates with Zoho CRM to capture leads at key touchpoints. All Zoho API calls are **fire-and-forget** (never block user flows).

**Architecture:**

- `src/lib/zoho/zoho-auth.ts` — OAuth token management (fetches fresh access token on every call; perfect for serverless)
- `src/lib/zoho/zoho-crm.service.ts` — Business logic with named helpers (`pushSignupLeadToZoho`, `pushAssessmentLeadToZoho`, etc.)
- `src/lib/zoho/types.ts` — TypeScript definitions
- `src/app/api/zoho/lead/route.ts` — Secure Next.js API route for client-side lead submissions
- `src/hooks/useZohoLead.ts` — Client-side hook for forms

**Key Integration Points:**

1. **Signup** (`api/auth/otp/verify/route.ts`) — pushes new user as Lead with source "Nervaya Signup"
2. **Sleep Assessment** (`api/sleep-assessment/responses/complete/route.ts`) — updates Lead with sleep score
3. **Deep Rest Assessment** (`api/deep-rest/responses/complete/route.ts`) — updates Lead with program completion
4. **Support/Consultation** (`api/consultations/route.ts`) — creates Lead from contact forms

**UPSERT Strategy:** Uses `/crm/v3/Leads/upsert` with `duplicate_check_fields: ["Email"]` to prevent duplicates (new email → create, existing email → update).

**Safety:** All Zoho calls wrapped in `(async () => { ... })().catch(() => undefined)` pattern. Zoho outages never surface to users.

### Styling

CSS Modules (`.module.css`) only — no Tailwind. CSS custom properties for theming are defined in `src/styles/colors.css` and `src/styles/spacing.css`. Media queries are placed directly under the selector they modify, not grouped at the bottom of the file. No inline `style={{ }}` except for CSS custom property assignments on layout elements.

### File Conventions

- Keep source files under ~200 lines; extract sub-components, utilities, or types when files grow large.
- Component folders: `ComponentName/index.tsx` + `ComponentName/styles.module.css`.
- Page-specific sub-components and custom hooks are co-located inside the page's folder (e.g. `src/app/(customer)/checkout/useCheckout/`).
- Barrel exports (`index.ts`) for component and utility directories.
- Named exports are preferred over default exports.
- No `@ts-ignore` or `any` — use `unknown` with type guards.

### Git Conventions

Commits follow Conventional Commits: `<type>(<scope>): <description>` (imperative mood, ≤72 chars). Types: `feat`, `fix`, `refactor`, `docs`, `style`, `perf`, `chore`, `build`, `ci`. Branch names: `feature/`, `fix/`, `hotfix/`, `refactor/`, `docs/`, `chore/` prefix with kebab-case description.

## Environment Variables

Required to run the app:

| Variable                                                                 | Purpose                                |
| ------------------------------------------------------------------------ | -------------------------------------- |
| `MONGODB_URI`                                                            | MongoDB Atlas connection string        |
| `JWT_SECRET`                                                             | Secret for signing/verifying JWTs      |
| `JWT_EXPIRES_IN`                                                         | Token TTL (e.g. `7d`)                  |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Media uploads                          |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`                                | Payment processing                     |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`                                            | Razorpay public key exposed to browser |
| `OTP_EMAIL_USER` / `OTP_EMAIL_APP_PASSWORD` / `OTP_EMAIL_FROM_NAME`      | Gmail SMTP for OTP emails              |

Optional:

| Variable                  | Purpose                                 |
| ------------------------- | --------------------------------------- |
| `REQUIRE_OTP_FOR_LOGIN`   | Set to `true` to require OTP on login   |
| `RAZORPAY_WEBHOOK_SECRET` | For verifying Razorpay webhook payloads |
| `NEXT_PUBLIC_GA_ID`       | Google Analytics 4 measurement ID       |
| `NEXT_PUBLIC_GTM_ID`      | Google Tag Manager container ID         |
