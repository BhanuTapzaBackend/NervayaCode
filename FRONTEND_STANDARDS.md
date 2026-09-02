# Nervaya Engineering Standards — Frontend & Backend

> **Read this before writing or reviewing any change.** These are RULES, not
> guidelines. Every page, component, hook, route handler, service, model,
> style and string in this repo MUST follow them. If a rule conflicts with
> convenience, the rule wins.

**Scope:** the whole repo. Nervaya is a Next.js 16 (App Router) **fullstack**
app — the backend runs as Route Handlers inside `src/app/api/`, so frontend
and backend rules live in this one document. Stack: React 19, TypeScript
strict, CSS Modules (no Tailwind), axios + custom hooks (no React Query),
MongoDB via Mongoose 9, Razorpay, Meta WhatsApp Cloud API, Zoho CRM, JaaS
(Jitsi) video, Playwright e2e.

---

## §0 How to read this document

- **RFC 2119/8174 keywords.** MUST / MUST NOT are absolute; SHOULD needs a
  written justification to skip; MAY is optional.
- **The ratchet.** Parts of this codebase predate these rules (SonarQube
  baseline 2026-04-05: 39 bugs, 718 code smells, 6.3% duplication; cognitive
  complexity hotspots `cart.service.ts` 50, `order.service.ts` 44,
  `payment.service.ts` 39, `src/middleware.ts` 32). **Existing bad code is
  never precedent.** All NEW code MUST comply; when you modify a
  non-compliant line, bring that line into compliance. The baseline numbers
  may only shrink.
- **Exemptions.** Breaking a MUST requires an inline
  `// STANDARDS-EXEMPTION: <rule id> — <reason> — <owner>` comment plus one
  reviewer's agreement.
- **Enforcement tags:** `[LINT]` ESLint/Prettier (`eslint.config.mjs`,
  `.prettierrc`), `[STYLELINT]` Stylelint (`.stylelintrc.json`), `[HOOK]`
  husky pre-commit (`npm run lint` + `lint-staged` runs Prettier +
  `eslint --fix` on staged code and `stylelint --fix` on staged CSS), `[CI]`
  the `Lint & Format Check` job (`.github/workflows/lint.yml` — runs
  `format:check`, `lint`, `typecheck`, `lint:styles` on PRs/pushes to
  `main`), `[SCAN]` Semgrep/SonarQube (see §14), `[REVIEW]` a human blocks
  on it. Bypassing the hook with `--no-verify` doesn't bypass CI — don't
  bother.
- **Ratchet baselines.** Pre-existing violations of the automated rules are
  recorded in `eslint-suppressions.json` (generated once at rule adoption)
  and the legacy-file override list in `.stylelintrc.json`. ESLint applies
  the suppressions automatically: new violations (or more violations of a
  suppressed rule in a suppressed file) fail. After cleaning a file, run
  `npx eslint . --prune-suppressions` (or delete the stylelint override
  entry) to shrink the baseline. You MUST NOT run `--suppress-all`/
  `--suppress-rule`, or add override entries, to admit new violations — the
  baselines only go down.
- **Rule IDs** are stable (`§4.2`); cite them in review comments.

---

## §1 Project structure — the real map

Everything lives under `src/`; imports use the `@/` alias (`@/*` → `./src/*`).

```text
src/
├── middleware.ts             # Edge auth: JWT cookie check + role redirects.
│                             #   Next.js REQUIRES this exact filename — renaming
│                             #   it silently disables all edge route protection.
├── app/
│   ├── api/**                # BACKEND: Next Route Handlers (route.ts). Thin.
│   ├── (admin)/admin/*       # Admin pages        (route group)
│   ├── (customer)/*          # Customer pages     (route group)
│   ├── (therapist)/therapist/* # Therapist pages  (route group)
│   └── <public>/page.tsx     # Public pages (/login, /signup, /about-us, …)
├── components/<Domain>/      # ComponentName/index.tsx + styles.module.css
│   └── common/               # Shared UI kit used by 2+ domains
├── queries/<domain>/         # Client data hooks (useState + useEffect, §2)
├── hooks/                    # Non-server-data hooks (useOTP, useRazorpayCheckout…)
├── context/                  # AuthContext, CartContext, … (see Providers.tsx)
├── lib/
│   ├── axios.ts              # THE axios instance (baseURL /api, withCredentials)
│   ├── api/                  # CLIENT service layer: one module per domain
│   ├── services/             # BACKEND business logic (*.service.ts)
│   ├── models/               # Mongoose schemas (*.model.ts)
│   ├── db/mongodb.ts         # Cached connection + autoIndex policy (§8)
│   ├── middleware/           # requireAuth, phone-gate, rate limits
│   ├── utils/                # response.util.ts, error.util.ts, …
│   ├── constants/            # enums.ts (ROLES, statuses), whatsapp-templates.ts
│   ├── email/  whatsapp/  zoho/  pdf/
├── styles/                   # colors.css, spacing.css, animations.css — THE tokens
├── types/  utils/  constants/
└── (repo root) e2e/          # Playwright specs; scripts/ for npx tsx one-offs
```

- **§1.1 Where does this go?** — decide by this table, not by habit: `[REVIEW]`

  | Adding…                             | Put it in…                                        |
  | ----------------------------------- | ------------------------------------------------- |
  | An HTTP endpoint                    | `src/app/api/<domain>/route.ts` (thin, §3)        |
  | Business logic for an endpoint      | `src/lib/services/<domain>.service.ts`            |
  | A Mongoose schema                   | `src/lib/models/<domain>.model.ts`                |
  | A client-side HTTP call + its types | `src/lib/api/<domain>.ts`                         |
  | A hook that fetches server data     | `src/queries/<domain>/use<Thing>.ts`              |
  | A non-server-data hook              | `src/hooks/`                                      |
  | A component used by ONE domain      | `src/components/<Domain>/`                        |
  | A component used by 2+ domains      | `src/components/common/`                          |
  | A constant / enum / magic number    | `src/lib/constants/` (server) or `src/constants/` |
  | A design token (color, spacing)     | `src/styles/colors.css` / `spacing.css` (§5)      |
  | A one-off migration/seed script     | `scripts/` (run with `npx tsx`)                   |

- **§1.2 Promote upward.** Code used by one domain stays in that domain; used
  by two, it moves to the shared layer (`components/common`, `hooks/`,
  `lib/utils`). Promote when the second consumer appears — never
  preemptively, and never by copy-paste. `[REVIEW]`
- **§1.3 File size.** Keep files under ~200 lines; extract components, hooks,
  or service helpers when a file grows past it. The cognitive-complexity
  monsters in §0 are the anti-pattern this exists to stop. `[REVIEW]`
- **§1.4 Naming.** Components: `PascalCase/index.tsx` + `styles.module.css`,
  named exports preferred. Services: `camelCase.service.ts`. Models:
  `camelCase.model.ts`. Hooks: `useThing.ts`. `[REVIEW]`

---

## §2 Client data layer — three tiers, no shortcuts

- **§2.1** The tiers MUST hold for every domain:
  1. `src/lib/api/<domain>.ts` — axios calls + `ApiResponse<T>` envelope
     handling. **No React.**
  2. `src/queries/<domain>/use<Thing>.ts` — `useState` + `useEffect` hooks
     wrapping tier 1. **No raw HTTP in hooks or components.**
  3. Components consume hooks. **Components never import `@/lib/axios` or
     call `fetch` for our own API.**
     Reference pair to copy: `src/lib/api/orders.ts` ↔
     `src/queries/orders/useOrders.ts`. `[REVIEW]`
- **§2.2 The hook shape is law.** There is no React Query — every data hook
  hand-rolls its lifecycle, so every data hook MUST include:
  - an `active` flag (or AbortController) in the effect, checked before every
    `setState`, reset in the cleanup — this is the only thing preventing
    state-after-unmount and race bugs (`useOrders.ts` is the template);
  - `isLoading` + `error` state, both handled by the consumer (§6.3);
  - a `refetch` via a `fetchKey` counter, not by duplicating the fetch logic;
  - object params serialized to a stable key (`JSON.stringify`) before going
    into the dependency array — an inline object retriggers every render.
    `[REVIEW]`
- **§2.3** ONE axios instance: `src/lib/axios.ts` (`baseURL: '/api'`,
  `withCredentials: true`). You MUST NOT create a second instance or set
  per-call base URLs. `[REVIEW]`
- **§2.4** Auth state lives in `AuthContext` (`src/context/AuthContext.tsx`),
  hydrated from localStorage and synced via the `auth-state-changed` DOM
  event. Fire that event after any client-side auth mutation; never build a
  parallel auth store. Provider nesting in `src/components/Providers.tsx`
  (`AuthProvider` → `CartProvider` → `SidebarProvider`, with `AuthGuard`
  wrapping the page children and `FloatingActionsProvider` alongside) is a
  contract — don't reorder it casually. `[REVIEW]`

---

## §3 Backend API layer — Route Handler → Service → Model

The strongest convention in the repo. Every endpoint follows the three
layers; skipping one is a review-reject.

- **§3.1 Route handlers are thin.** A `route.ts` does exactly: call
  `requireAuth(request, [ROLES.X])` (and `requirePhone` where applicable),
  parse/validate input, delegate to ONE service function, return
  `NextResponse.json(successResponse(...) | errorResponse(...))` with
  `handleError` in the catch. Business logic in a route handler is misplaced
  by definition. Template: `src/app/api/orders/route.ts`. `[REVIEW]`
- **§3.2 The envelope is universal.** Every response goes through
  `src/lib/utils/response.util.ts` — `{ success, message, data, statusCode }`.
  No hand-built JSON bodies. `[REVIEW]`
- **§3.3 Services own the logic.** All business rules, DB access, and
  external calls live in `src/lib/services/*.service.ts`. Services import
  models; route handlers never import models directly. `[REVIEW]`
- **§3.4 Validate input at the edge.** Query params and bodies are untrusted:
  parse numbers with explicit bounds (the orders route clamps
  `limit` to `Math.min(100, Math.max(1, …))` — copy that shape), check enums
  against `src/lib/constants/enums.ts` values, and reject early with a 400
  `errorResponse`. Never pass raw `searchParams` strings into a query. `[REVIEW]`
- **§3.5 User-supplied regex is a ReDoS.** Never feed user input into
  `new RegExp()` without escaping it first (the known defect in
  `blog.service.ts` search is the anti-pattern, not the style). Same for
  user input reaching `path.join()` — the `admin/deep-rest/upload-video`
  route's path-traversal finding must not be copied. `[SCAN Semgrep + REVIEW]`
- **§3.6 Fire-and-forget means logged, not swallowed.** Non-blocking side
  channels (Zoho `pushLeadSafely`, WhatsApp `sendMeetLinkViaWhatsApp`) MUST
  log failures via `console.error` — a silent `.catch(() => undefined)` is
  how a misconfigured Zoho base URL went unnoticed in production. They MUST
  no-op gracefully when their creds are absent. `[REVIEW]`
- **§3.7 Post-payment side-effects run after commit.** External I/O (meeting
  links, emails, WhatsApp, invoice PDFs) MUST NOT run inside a DB
  transaction. The standard is `finalizeSessionBooking`: the caller that owns
  the transaction finalizes **after** commit; `createSession` finalizes
  inline only when invoked standalone. `[REVIEW]`
- **§3.8 Public endpoints are rate-limited.** Anything callable without auth
  (`POST /api/zoho/lead`, OTP send) MUST have a per-IP or per-phone rate
  limit backed by the `rateLimit` TTL collection. `[REVIEW]`
- **§3.9 Webhooks verify, persist idempotently, and return 200.** The
  WhatsApp webhook is the template: verify the `X-Hub-Signature-256` HMAC
  (or Razorpay signature) before trusting a byte, dedupe on a unique key
  (`messageId`), and always return 200 so the provider doesn't retry-storm.
  `[REVIEW]`

---

## §4 Types — strict, named, co-located

- **§4.1** `tsconfig` `strict` stays on. `: any`, `as any`, `@ts-ignore` are
  FORBIDDEN in new code (prefer `@ts-expect-error` with a reason when
  truly unavoidable, plus the §0 exemption comment).
  `[LINT @typescript-eslint/no-explicit-any = error]`
- **§4.2** `unknown` is allowed only at a trust boundary (request body, JSON
  parse, catch clause, `metadata` blobs) and MUST be narrowed with a type
  guard before use. It never appears in an exported signature or prop.
  `[REVIEW]`
- **§4.3** A shape used more than once gets a **named, exported type/interface**
  — never the same inline object literal repeated across files. API
  request/response contracts live beside their client module
  (`src/lib/api/<domain>.ts` or `src/types/`); model document interfaces
  (`IOrder`, `IUser`) live in the model file. `[REVIEW]`
- **§4.4** Roles, statuses, and item types are the typed values from
  `src/lib/constants/enums.ts` / `roles.ts` (`ROLES.ADMIN`,
  `PAYMENT_STATUS`, `ItemType`) — never free-typed strings a union doesn't
  verify. Schema `enum:` arrays MUST reference the exported `*_VALUES`
  constants, not duplicate the literals. `[REVIEW]`
- **§4.5** Explicit return types on exported functions are preferred,
  mandatory on service functions (they are the API between layers). `[REVIEW]`

---

## §5 Styling — CSS Modules and tokens only

- **§5.1** **CSS Modules only. No Tailwind, no styled-components, no inline
  `style={}` for anything a class can express.** One component = one
  co-located module: `ComponentName/index.tsx` + `styles.module.css`.
  `[REVIEW]`
- **§5.2 No raw color values.** Every color comes from the tokens in
  `src/styles/colors.css` (`--color-accent`, `--color-accent-surface`,
  `--color-cream-bg`, …); spacing from `src/styles/spacing.css`. A hex/rgb
  literal in a `.module.css` is a review-reject. Need a token that doesn't
  exist? Define it centrally in `colors.css`/`spacing.css` first, with a
  one-line comment, then use it. `var(--token, #hex)` fallbacks against
  undefined tokens are forbidden — the fallback always wins and you've
  hardcoded the hex with extra steps.
  `[STYLELINT color-no-hex — token files exempt; the 10 legacy hex files are
baselined in .stylelintrc.json overrides and may only shrink + REVIEW for
rgb()/inline style={}]`
- **§5.3** Media queries go **directly under the selector they modify**, not
  collected in a block at the bottom of the file. `[REVIEW]`
- **§5.4** `next/image` for images (`@next/next/no-img-element` = error) and
  `next/link` for internal navigation (`no-html-link-for-pages` = error).
  `[LINT]`

---

## §6 Components & pages

- **§6.1 Reuse before you create.** `src/components/common/` is the shared
  kit; building a parallel version of an existing shared component is a
  review-reject. Need a variant? Add a prop. `[REVIEW]`
- **§6.2 Pages are thin.** A `page.tsx` reads params, wires hooks, and
  composes components. Business logic in a page file is misplaced by
  definition. Route sections stay inside their route group
  (`(admin)`/`(customer)`/`(therapist)`) so the group layout and middleware
  role-guard apply. `[REVIEW]`
- **§6.3** Every data screen handles all four states — loading, error, empty,
  data — using the hook's `isLoading`/`error` outputs, never by assuming
  data arrived. `[REVIEW]`
- **§6.4** Lists use semantic HTML and stable unique `key`s — never the array
  index when items can reorder (`react/no-array-index-key` warns; treat the
  warning as an error in new code). `[LINT + REVIEW]`
- **§6.5** Every side effect a component starts is torn down on unmount:
  listeners, timers, observers, subscriptions — the `useEffect` MUST return
  its cleanup (the `active` flag of §2.2 is the minimum). `[REVIEW]`
- **§6.6** Accessibility baseline: labels tied to inputs, keyboard handlers
  alongside click handlers (a standing SonarQube finding — don't add to it),
  visible focus, ARIA where semantics fall short. `[SCAN + REVIEW]`
- **§6.7** No `console.log` in shipped code; `console.warn`/`console.error`
  are allowed and are the required channel for §3.6 failures.
  `[LINT no-console]`

---

## §7 Auth, RBAC & session — the load-bearing walls

- **§7.1** Auth is **passwordless**: the E.164 WhatsApp phone number
  (`+919876543210`) is the unique primary identifier on `User`. Email is
  optional. Never introduce a password field, and never treat email as an
  identity key. `[REVIEW]`
- **§7.2** Three roles — `ADMIN`, `CUSTOMER`, `THERAPIST` — always via the
  `ROLES` constants. Protection is layered and ALL layers are mandatory:
  1. `src/middleware.ts` (edge) — cookie/JWT check + role redirects. This
     filename is a Next.js contract; renaming it silently disables edge
     protection.
  2. `requireAuth(request, [ROLES.X])` on every protected route handler —
     the middleware is routing convenience, **not** the authorization layer.
  3. Client-side guards (`AuthGuard`) are UX only.
     `[REVIEW]`
- **§7.3 Session duration is defined ONCE**:
  `COOKIE_OPTIONS.AUTH_TOKEN_MAX_AGE` in `src/utils/cookieConstants.ts`. The
  JWT expiry and localStorage expiry both derive from it. Hardcoding a
  duration anywhere else is a review-reject; leave `JWT_EXPIRES_IN` unset so
  token and cookie stay in sync. `GET /api/auth/me` slides the session and
  re-mints on role change — that sliding-window + re-mint behavior is the
  only "revocation" path; don't break it. `[REVIEW]`
- **§7.4** OTP flows go through the delivery abstraction
  (`src/lib/services/otp/`): WhatsApp Cloud API in production,
  `ConsoleOtpDelivery` fallback when creds are missing. OTP and signup state
  live in TTL collections (`otpToken`, `pendingSignup`), keyed
  `phone:purpose` — never in memory. `[REVIEW]`

---

## §8 MongoDB & Mongoose — the DB checks

- **§8.1 Every DB touch goes through `connectDB()`**
  (`src/lib/db/mongodb.ts`) before the first query. The cached-connection
  pattern is mandatory (serverless: one connection per lambda, not per
  request). Never call `mongoose.connect` anywhere else. `[REVIEW]`
- **§8.2 Model registration guard.** Every model exports via
  `mongoose.models.X || mongoose.model<IX>('X', schema)` (with the dev-mode
  `delete mongoose.models.X` HMR guard where the schema is actively edited).
  A bare `mongoose.model()` call crashes on hot reload. `[REVIEW]`
- **§8.3 Index discipline — read the comment in `mongodb.ts` before touching
  an index.** `autoIndex` is OFF in production: index changes ship via
  `scripts/` (`npx tsx`), never implicitly. Mongoose cannot drop an index,
  and a same-name build with different options fails silently — the
  constraint you think you shipped does not exist. Every index change =
  a migration script in the same PR, run against prod, and verified with
  `db.collection.getIndexes()`. `[REVIEW]`
- **§8.4 Every query path is indexed.** A new `find`/`aggregate` filtered or
  sorted on fields without a covering index adds `schema.index({...})` in
  the same PR (plus the §8.3 script). The house shape is compound
  `{ scopeField: 1, createdAt: -1 }` (`orderSchema.index({ userId: 1,
createdAt: -1 })`). Uniqueness is enforced by a **unique index**, not by
  a read-then-write check — reads race. Template:
  `slot-hold.service.ts` claims a slot with a unique index + atomic upsert
  and catches the E11000 duplicate-key error, no transaction needed. `[REVIEW]`
- **§8.5 Validation lives in the schema AND the service.** Schemas declare
  `required`, `min`/`max`, `enum` (from `enums.ts` constants, §4.4),
  `trim`/`lowercase` where relevant. Update operations
  (`findOneAndUpdate`, `updateOne`) MUST pass `{ runValidators: true }` —
  Mongoose skips validators on updates by default, which silently
  un-enforces every schema rule. Services still validate business rules
  before writing. Documented exception: `otp-store.ts`'s `saveOtp`
  deliberately omits it (see the docblock in `otpToken.model.ts` — running
  validators there historically broke phone linking); new exceptions need
  the same kind of docblock plus a §0 exemption. `[REVIEW]`
- **§8.6 Expiring state uses TTL indexes**, not cron sweeps:
  `schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })` (the pattern
  in `otpToken`, `pendingSignup`, `rateLimit`, `slotHold`,
  `guestSleepAssessmentResponse`). `[REVIEW]`
- **§8.7 Money and multi-document writes use transactions.** Anything that
  writes 2+ documents that must agree (payment capture + order + cart clear,
  session booking) runs in `session.withTransaction()` — templates:
  `payment.service.ts`, `session.service.ts`, `driftOffPayment.service.ts`.
  Single-document atomic claims don't need one — prefer the §8.4
  unique-index pattern. External I/O NEVER runs inside the transaction
  (§3.7). Amounts are integer paise / fixed-point — never floats you
  arithmetic on. `[REVIEW]`
- **§8.8 Reads are lean and bounded.** Read-only queries chain `.lean()`
  (skip hydration), `.select()` what the caller needs, and NEVER return an
  unbounded collection: list endpoints paginate with a clamped `limit`
  (≤100, §3.4) and return `{ data, meta }`. Fields like OTP hashes and
  tokens are excluded from every response. `[REVIEW]`
- **§8.9 No string-built queries.** Filters are constructed from validated,
  typed values; user input never lands in `$where`, a raw aggregation
  expression, or an unescaped `new RegExp()` (§3.5). Reject unknown filter
  keys instead of spreading `req` bodies into `find()` — operator injection
  (`{ $gt: '' }`) rides in through unvalidated objects. `[SCAN + REVIEW]`
- **§8.10 Counters, not maxes.** Monotonic identifiers (invoice numbers) come
  from the atomic `counter` collection (`findOneAndUpdate` + `$inc`,
  `counter.model.ts`) — never `max(existing) + 1`, which duplicates under
  concurrency. Allocated once (invoice number on payment), never reissued.
  `[REVIEW]`

---

## §9 Payments — Razorpay

- **§9.1** Two independent flows stay independent: supplement orders
  (`src/app/api/payments/`) and Deep Rest (`src/app/api/payments/deep-rest/`).
  Client checkout goes through `src/hooks/useRazorpayCheckout.ts` — never a
  hand-rolled Razorpay integration. `[REVIEW]`
- **§9.2** Payment verification happens **server-side only**: verify the
  Razorpay signature before flipping any `paymentStatus`. The client's
  success callback is untrusted UI. Status transitions are validated against
  the `PAYMENT_STATUS`/`ORDER_STATUS` enums — no free-form strings. `[REVIEW]`
- **§9.3** Order lookups on the success page use `GET /api/orders/[id]`
  (user-scoped, all item types) — `getUserOrders` strips `THERAPY` items for
  the list view and MUST NOT be used to look up a single order. `[REVIEW]`

---

## §10 Naming & external integrations

- **§10.1 Deep Rest ≠ DriftOff split is intentional.** User-facing copy,
  routes, and new UI say **Deep Rest**; models/services/types keep the
  `DriftOff` code names. Do not half-rename either side — redirects from
  `/drift-off*` live in `next.config.ts`. `[REVIEW]`
- **§10.2 Zoho:** one producer per lead source, ever — pushing the same event
  from both client and server overwrites `Lead_Source`. Purchases omit
  `Lead_Source` deliberately. No touchpoint may require an email (signup is
  phone-first); a lead with neither phone nor email is rejected. Base URLs
  carry **no trailing slash** (`assertBaseUrl` trims, keep env clean anyway).
  `[REVIEW]`
- **§10.3 WhatsApp templates are code constants**, not env vars:
  `src/lib/constants/whatsapp-templates.ts`. A new business-initiated message
  needs a pre-approved Meta template; body can't start/end with a variable
  or place two adjacent. `[REVIEW]`
- **§10.4 Secrets never reach the client bundle.** Only `NEXT_PUBLIC_*` vars
  are readable client-side, and nothing secret goes in one. Server env vars
  are read in `lib/` code only; missing-optional-creds paths degrade
  gracefully (§3.6) instead of crashing. `[REVIEW]`

---

## §11 Testing — Playwright e2e

- **§11.1** There is no unit-test runner; Playwright is the only suite:
  `npm run test:e2e` (`playwright.config.ts`; scoped configs
  `playwright.hours/meet/plan.config.ts`). Specs live in `e2e/specs/` with
  helpers in `e2e/helpers/` and `e2e/global-setup.ts`. New user-facing flows
  SHOULD add a spec; money- or booking-affecting flows MUST. `[REVIEW]`
- **§11.2** Seed test data with `npx tsx scripts/verify-auth.ts` and script
  fixtures — never by pointing tests at production data. `[REVIEW]`
- **§11.3** NEVER modify existing specs while changing app code, unless the
  task is explicitly to fix/update tests or your change intentionally alters
  asserted behavior — in which case the spec update ships in the same PR and
  is called out in the description. `[REVIEW]`

---

## §12 Copy & constants

- **§12.1** No magic numbers in logic: page-size defaults, clamps, TTLs, and
  retry counts get named constants (`DEFAULT_LIMIT`, `AUTH_TOKEN_MAX_AGE` are
  the shape). `[REVIEW]`
- **§12.2** Routes, endpoint paths, storage keys, event names
  (`auth-state-changed`) are constants, never scattered string literals.
  `[REVIEW]`
- **§12.3** Comments state the WHY or a non-obvious constraint — never
  narrate the code. Load-bearing modules keep their defect-citing docblocks
  (`src/lib/db/mongodb.ts`'s autoIndex comment is the template); when your
  change closes a real bug, record it in the docblock. Cross-file contracts
  (cookie max-age ↔ JWT expiry) get a comment on BOTH sides. `[REVIEW]`

---

## §13 Lint, format, hooks & git workflow

**Automated today (pre-commit + CI blocking):** husky runs `npm run lint`
(whole repo) then `lint-staged` (Prettier + `eslint --fix` on staged
`ts/tsx/js/jsx/mjs`; `stylelint --fix` + Prettier on staged `css`; Prettier
on `json/md/yml`). CI (`.github/workflows/lint.yml`) re-runs `format:check`,
`lint`, `typecheck` (`tsc --noEmit`), and `lint:styles` on every PR/push to
`main`. Key ESLint rules (`eslint.config.mjs`): `no-explicit-any` error,
`no-console` error (allow warn/error), `no-restricted-imports` banning
`@/lib/axios`/`axios` outside the tier-1 layer (§2.1), `max-lines` 300 on
`.tsx` (§1.3 — the ~200 SHOULD still applies), `eqeqeq`, `curly: all`,
`no-var`, `prefer-const`, `no-duplicate-imports`, `react/jsx-key` error,
`no-img-element` error, 120-char `max-len`, 2-space indent, single quotes,
semicolons — with the `eslint-suppressions.json` ratchet (§0) baselining the
pre-existing violations. Stylelint (`.stylelintrc.json`):
`stylelint-config-standard` tuned to house style (legacy `rgba()`/
`max-width` notation locked in, CSS-Modules `:global` allowed) +
`color-no-hex` (§5.2). Prettier: 120 print width, single quotes, trailing
commas, LF.

- **§13.1** Warnings are not noise. `no-array-index-key` and
  `no-non-null-assertion` are warn-level for legacy reasons; in NEW code
  treat them as errors. Do not grow the warning count. `[REVIEW]`
- **§13.2 npm only.** `package-lock.json` is the single lockfile — never
  introduce pnpm/yarn/bun lockfiles or run installs that rewrite resolutions
  outside a dependency PR. `[REVIEW]`
- **§13.3 Conventional Commits**: `<type>(<scope>): <description>` —
  imperative, ≤72 chars (`fix(checkout): send to the verified number`).
  Branch prefixes: `feature/`, `fix/`, `hotfix/`, `refactor/`, `docs/`,
  `chore/`. `[REVIEW]`
- **§13.4 PR flow**: never commit directly to `main`; branch, then PR to
  `main` on `Nervayaofficial/NervayaCode`. Working from a personal fork,
  target the upstream repo explicitly (`gh pr create --repo
Nervayaofficial/NervayaCode --head <fork-owner>:<branch> --base main`).
  `[REVIEW]`
- **§13.5** `npm run build` MUST pass locally before a PR is opened — CI
  runs `typecheck`/lint but not the full build (yet, §16), and only the
  build catches Next-specific breakage (route conflicts, RSC violations).
  `[REVIEW]`

---

## §14 Security scanners — Semgrep & SonarQube

- **§14.1** Run `semgrep --config auto --quiet .` on security-touching
  changes (auth, payments, uploads, webhooks, anything handling user input).
  New findings in changed files block the PR. `[SCAN]`
- **§14.2** SonarQube (Docker + `sonar-scanner`, setup in CLAUDE.md) is the
  quality ratchet: the §0 baseline numbers may only go down. A PR that adds
  a new bug-level finding or pushes a touched function's cognitive
  complexity higher is a review-reject. `[SCAN + REVIEW]`
- **§14.3 Known open findings (fix on touch, never copy):** path traversal in
  `admin/deep-rest/upload-video` (`path.join` on user input); ReDoS in
  `blog.service.ts` search regex; click handlers missing keyboard listeners.
  `[SCAN]`

---

## §15 Anti-patterns — reject on sight

- ❌ Component importing `@/lib/axios` or calling `fetch('/api/...')` directly (§2.1).
- ❌ Data hook without the `active`-flag cleanup / hand-rolled duplicate fetch logic (§2.2).
- ❌ Business logic in a `route.ts` or a `page.tsx`; route handler importing a model (§3.1, §3.3, §6.2).
- ❌ Hand-built response JSON instead of `successResponse`/`errorResponse` (§3.2).
- ❌ Unclamped `limit`/`page` params; user input in `new RegExp()` or `path.join()` (§3.4–§3.5).
- ❌ `.catch(() => undefined)` on a fire-and-forget integration (§3.6).
- ❌ Email/WhatsApp/PDF work inside a DB transaction (§3.7, §8.7).
- ❌ `: any`, `as any`, `@ts-ignore`; free-typed role/status strings (§4).
- ❌ Hex/rgb literals in a module; Tailwind classes; inline `style={}` for static styling (§5).
- ❌ A protected route handler without `requireAuth`; auth logic that trusts only `src/middleware.ts` (§7.2).
- ❌ A session/token duration hardcoded outside `cookieConstants.ts` (§7.3).
- ❌ `mongoose.connect` outside `db/mongodb.ts`; unguarded `mongoose.model()` (§8.1–§8.2).
- ❌ An index changed without a `scripts/` migration; a filtered query with no covering index (§8.3–§8.4).
- ❌ `findOneAndUpdate` without `runValidators: true`; read-then-write uniqueness checks (§8.5, §8.4).
- ❌ Unbounded `find()` returned to the client; missing `.lean()` on hot read paths (§8.8).
- ❌ Payment status flipped without server-side signature verification (§9.2).
- ❌ `getUserOrders` used to look up a single order (§9.3).
- ❌ Renaming `DriftOff` code identifiers, or shipping "Drift Off" copy (§10.1).
- ❌ The same Zoho event pushed from client AND server (§10.2).
- ❌ Secrets in `NEXT_PUBLIC_*` or the client bundle (§10.4).
- ❌ `git commit --no-verify` to dodge the hooks; a second lockfile (§13).

---

## §16 PR checklist & governance

**Reviewer confirms (blocking):**

- [ ] Three-layer split respected on both sides: `lib/api` → `queries` →
      component, and route → service → model (§2, §3)
- [ ] Input validated & clamped at the route edge; envelope used (§3.2, §3.4)
- [ ] No `any`; enums/roles from constants; exported named types (§4)
- [ ] CSS Modules + tokens only — no hex, no Tailwind, no inline styles (§5)
- [ ] Four data states handled; effects cleaned up; stable keys (§6)
- [ ] `requireAuth` on every new protected route; no hardcoded durations (§7)
- [ ] DB: `connectDB` first, indexes cover new queries (+ migration script),
      `runValidators` on updates, `.lean()` + pagination on reads,
      transactions for multi-doc money writes (§8)
- [ ] Side-effects after commit; fire-and-forget failures logged (§3.6–§3.7)
- [ ] Payment status only flips after server-side signature check (§9)
- [ ] e2e spec added/updated for money- or booking-affecting flows (§11)
- [ ] `npm run build` passes locally; the CI checks (`format:check`, `lint`,
      `typecheck`, `lint:styles`) are green; Conventional Commit; PR targets
      `Nervayaofficial/NervayaCode` `main` (§13)
- [ ] Semgrep clean on changed files; SonarQube baseline not grown (§14)

**Governance:** the tech lead owns this document; changes are PRs against it
with rationale. Exemptions follow §0. Review quarterly; delete rules that
never fire.

**Automation roadmap (currently `[REVIEW]`, promote in this order):**

_Done: CI lint workflow, `typecheck` + `format:check` scripts, Stylelint
with `color-no-hex`, the `@/lib/axios` import boundary, `max-lines` 300,
`no-console` to error — all with ratchet baselines (§0)._

1. `npm run build` as a CI step (needs placeholder env vars — `mongodb.ts`
   and friends throw at import when required vars are absent).
2. `no-restricted-imports` banning `@/lib/models/*` outside
   `src/lib/services/**` (§3.3) — needs a suppressions baseline for the
   existing route handlers that import models directly.
3. Promote `react/no-array-index-key` and `no-non-null-assertion` from warn
   to error once the existing warning count reaches zero (§13.1).
4. Semgrep as a CI step gated on changed files (§14.1).
5. Playwright smoke suite in CI once it can run without live creds (§11).

---

_If this document and the codebase's exemplars disagree, fix one of them in
the same PR._
