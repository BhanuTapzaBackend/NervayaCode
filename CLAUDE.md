# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
npx tsx scripts/verify-auth.ts                         # Seed DB with test users
npx tsx scripts/backfill-therapists-profile-fields.ts  # One-time therapist data migration
```

There is no test suite. Husky + lint-staged runs Prettier and ESLint on pre-commit.

## Architecture

Nervaya is a **Next.js 16 (App Router) fullstack mental health platform**. The backend runs entirely as Next.js Route Handlers inside `src/app/api/`. Database is MongoDB via Mongoose. No separate backend server.

### Three-Layer API Pattern

Every API endpoint follows: **Route Handler → Service → Model**.

1. **Route Handler** (`src/app/api/**`) — thin wrapper that calls `requireAuth()`, parses the request, delegates to a service, and returns `successResponse()` or `errorResponse()`
2. **Service** (`src/lib/services/*.service.ts`) — all business logic lives here
3. **Model** (`src/lib/models/*.model.ts`) — Mongoose schemas

All API responses use `src/lib/utils/response.util.ts`: `{ success, message, data, statusCode }`.

### Authentication & RBAC

Three roles: `ADMIN`, `CUSTOMER`, `THERAPIST` (defined in `src/lib/constants/enums.ts`).

Auth is **passwordless**: the WhatsApp phone number (stored E.164, e.g. `+919876543210`) is the unique primary identifier on the `User` model. Email is optional (used for receipts/CRM only). There are no passwords.

- **Edge middleware** (`src/middleware.ts`): reads `auth_token` httpOnly cookie, verifies JWT, enforces role-based redirects. Next.js requires this exact filename — renaming it will silently disable all edge-level route protection.
- **API auth** (`src/lib/middleware/auth.middleware.ts`): `requireAuth(request, [ROLES.X])` on protected routes
- **Client auth** (`src/context/AuthContext.tsx`): hydrates from localStorage with 7-day expiry; custom `auth-state-changed` DOM event syncs state across contexts

### Route Groups

- `src/app/(admin)/admin/*` — Admin pages
- `src/app/(customer)/*` — Customer pages
- `src/app/(therapist)/therapist/*` — Therapist pages
- Public pages at `src/app/` root (`/login`, `/signup`, `/about-us`, `/blog`, etc.)

### Client-Side Data Fetching

No React Query. Custom hooks in `src/queries/` use `useState` + `useEffect` + API client modules from `src/lib/api/`. Axios instance (`src/lib/axios.ts`) sets `baseURL: /api` with `withCredentials: true`.

### Context Providers

Nested in `src/components/Providers.tsx` (outermost to innermost): `AuthProvider` → `AuthGuard` → `CartProvider` → `LoadingProvider` → `SidebarProvider`.

### Payments

Razorpay with two independent flows:

- Supplement orders: `src/app/api/payments/`
- Deep Rest program: `src/app/api/payments/deep-rest/`

Client-side checkout hook: `src/hooks/useRazorpayCheckout.ts`.

### "Deep Rest" / "Drift Off" Naming

The sleep therapy program was renamed from "Drift Off" to "Deep Rest". Code still uses `DriftOff` in models, services, and types. Permanent redirects from `/drift-off*` → `/deep-rest*` in `next.config.ts`.

### Zoho CRM Integration

Fire-and-forget lead tracking at signup, sleep assessment, Deep Rest completion, and contact forms. All calls wrapped in `.catch(() => undefined)` — Zoho outages never block users. Uses UPSERT with `duplicate_check_fields: ["Phone"]` (falls back to `["Email"]` when no phone is present).

### OTP & WhatsApp

Both signup and login require a WhatsApp OTP (passwordless). OTP delivery goes through the **Meta WhatsApp Cloud API** (`src/lib/whatsapp/whatsapp-client.ts` + `src/lib/services/otp/whatsapp-otp-delivery.ts`) using an approved authentication message template. The OTP store is MongoDB-backed (`otpToken` collection, TTL-expiring), keyed on `phone:purpose`. When WhatsApp creds are missing it falls back to `ConsoleOtpDelivery`, which logs the code — keeps local/dev flows testable without credentials.

Signup is two-stage: `pendingSignup` (phone-keyed, TTL 10 min) holds the name until the OTP is verified, then the `User` is created with `phoneVerified: true`.

### WhatsApp Webhook

`src/app/api/whatsapp/webhook/route.ts` handles Meta callbacks: **GET** answers the verification handshake (`hub.challenge` against `WHATSAPP_VERIFY_TOKEN`); **POST** verifies the `X-Hub-Signature-256` HMAC with `WHATSAPP_APP_SECRET`, then idempotently persists delivery-status and inbound-message events to the `whatsappWebhookEvent` collection (unique on `messageId`). Always returns 200 so Meta does not retry-storm.

## Code Conventions

- **Styling**: CSS Modules only (no Tailwind). Theme variables in `src/styles/colors.css` and `src/styles/spacing.css`. Media queries placed directly under the selector they modify.
- **Components**: `ComponentName/index.tsx` + `styles.module.css`. Named exports preferred.
- **TypeScript**: Strict mode, no `any` (use `unknown` + type guards), no `@ts-ignore`. Explicit return types preferred.
- **Files**: Keep under ~200 lines; extract when growing.
- **Git**: Conventional Commits `<type>(<scope>): <description>` (imperative, ≤72 chars). Branch prefixes: `feature/`, `fix/`, `hotfix/`, `refactor/`, `docs/`, `chore/`.
- **ESLint**: 120-char line width, 2-space indent, no unused vars, no console in production.

## Environment Variables

**Required:** `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET`, `RAZORPAY_KEY_ID`/`KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_OTP_TEMPLATE_NAME`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`

**Optional:** `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_API_VERSION` (default `v21.0`), `OTP_EMAIL_USER`/`OTP_EMAIL_APP_PASSWORD`/`OTP_EMAIL_FROM_NAME` (email receipts only), `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `ZOHO_CLIENT_ID`/`ZOHO_CLIENT_SECRET`/`ZOHO_REFRESH_TOKEN`, `NEXT_PUBLIC_APP_URL` (absolute site origin used in meeting links/emails)

### Therapy Session Video (Jitsi / JaaS)

1:1 therapist–customer video calls run on **Jitsi as a Service (JaaS)** by 8x8, embedded in-app via the iframe SDK (`@jitsi/react-sdk`). Each booked session gets a deterministic room (`nervaya-<sessionId>`); a short-lived RS256 JWT minted in `src/lib/services/jitsi.service.ts` (signed with `jose`) authorizes each participant — therapist/admin as moderator, customer as guest. The booking flow stores the in-app room URL (`/session/<id>/room`) in `Session.meetLink`; no external API call happens at booking time (rooms are created lazily on first join). This replaced the previous Google Calendar / Google Meet integration.

**Swappable provider:** session video runs through a provider abstraction (`src/lib/services/meeting-provider.service.ts`). `MEETING_PROVIDER=jitsi` (default) uses the embedded JaaS room; `MEETING_PROVIDER=google` switches back to Google Meet (via `src/lib/services/googleCalendar.service.ts`) with no code changes. Both write `Session.meetLink`, which every Join button consumes; Google additionally stores its event id in `Session.googleEventId` for cleanup on cancel/reschedule. Note: the embedded room page and the free-consultation flow are Jitsi-only — switching to Google affects the booked-session links (they become external Meet URLs).

**JaaS env vars (required for live video; calls fall back gracefully and booking still works without them):** `JAAS_APP_ID` (8x8 AppID / tenant, e.g. `vpaas-magic-cookie-...`), `JAAS_KID` (API key id), `JAAS_PRIVATE_KEY` (RSA private key PEM), `NEXT_PUBLIC_JAAS_APP_ID` (same AppID, exposed client-side for the iframe). Generate all four in the JaaS console (jaas.8x8.vc).

**Google Meet env vars (only when `MEETING_PROVIDER=google`):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` (default `primary`).

**Meeting link delivery:** the room link is delivered to the user by **email** (session-confirmation template / consultation iCal invite) and over **WhatsApp** (`sendMeetLinkViaWhatsApp` in `src/lib/services/meet-link-whatsapp.service.ts`). WhatsApp sends are fire-and-forget — an outage never blocks a booking, and they no-op when unconfigured. Because business-initiated WhatsApp messages require a **pre-approved template**, create a **Utility** template named `nervaya_session_link` in the WhatsApp Manager with four ordered body variables — `{{1}}` name, `{{2}}` date, `{{3}}` time, `{{4}}` meeting link. The body must not begin/end with a variable nor place two adjacent (Meta rule), e.g. _"Hi {{1}}, your Nervaya session is confirmed for {{2}} at {{3}}. Tap to join your video call: {{4}} — please join a few minutes early. See you soon!"_ Then set `WHATSAPP_SESSION_TEMPLATE_NAME=nervaya_session_link` (and optional `WHATSAPP_SESSION_TEMPLATE_LANG`, default `en_US`). Reuses the existing `WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_ACCESS_TOKEN` creds.

**~1h-before reminder (cron):** `src/app/api/cron/session-reminders/route.ts` is triggered by **Vercel Cron** (`vercel.json`, every 15 min) and calls `sendDueSessionReminders` (`src/lib/services/session-reminder.service.ts`), which finds confirmed/pending sessions starting within the next ~70 min that have not been reminded and sends each a WhatsApp reminder once (deduped via `Session.reminderSentAt`, claimed atomically). Times are interpreted in IST (Asia/Kolkata). Create a second Utility template (same 4 body vars) and set `WHATSAPP_REMINDER_TEMPLATE_NAME`. The route is guarded by `CRON_SECRET` (Vercel Cron sends it as `Authorization: Bearer <CRON_SECRET>`). **Note:** sub-daily cron schedules require a Vercel **Pro** plan; on Hobby, point any external scheduler (e.g. cron-job.org) at the same URL with that bearer header instead.

## Code Review Tools

Two static analysis tools are configured for this project: **Semgrep** (security) and **SonarQube** (code quality).

### Semgrep (Security Scanner)

Semgrep scans for security vulnerabilities, injection risks, and unsafe patterns.

```bash
# Install (one-time)
brew install semgrep

# Run security scan on entire codebase
semgrep --config auto .

# Run quietly (findings only)
semgrep --config auto --quiet .
```

### SonarQube (Code Quality Scanner)

SonarQube scans for bugs, code smells, duplication, and cognitive complexity. Requires Docker.

```bash
# 1. Start SonarQube server (one-time, or whenever you need it)
docker run -d --name sonarqube -p 9000:9000 sonarqube:community

# If container already exists but is stopped:
docker start sonarqube

# 2. Install the scanner CLI (one-time)
brew install sonar-scanner

# 3. Create sonar-project.properties in project root (not committed — in .gitignore)
cat > sonar-project.properties <<EOF
sonar.projectKey=nervaya
sonar.projectName=Nervaya
sonar.sources=src
sonar.host.url=http://localhost:9000
sonar.token=<YOUR_TOKEN>
sonar.sourceEncoding=UTF-8
sonar.exclusions=**/node_modules/**,**/.next/**,**/public/**,**/*.css
EOF

# 4. Generate a token:
#    - Open http://localhost:9000 (default login: admin/admin, you'll be asked to change it)
#    - Go to My Account → Security → Generate Token
#    - Paste the token into sonar.token in sonar-project.properties

# 5. Run the scan
sonar-scanner

# 6. View results at http://localhost:9000/dashboard?id=nervaya
```

### Known Issues (as of 2026-04-05)

**Security (Semgrep):**

- Path traversal risk in `src/app/api/admin/deep-rest/upload-video/route.ts` — user input in `path.join()`
- ReDoS risk in `src/lib/services/blog.service.ts` — `new RegExp()` with user-supplied search input

**Code Quality (SonarQube):**

- 39 bugs, 718 code smells, 6.3% duplication across 37,907 lines
- High cognitive complexity in: `cart.service.ts` (50), `order.service.ts` (44), `payment.service.ts` (39), `middleware.ts` (32)
- Multiple click handlers missing keyboard listeners (accessibility)
