# Nervaya E2E Verification (Playwright)

Automated verification of the rows in `Nervaya_Test_Cases_final_version.xlsx`,
driven against a **local dev server** with **console-OTP** login. Results are
written back into the workbook (columns **G** Actual Result, **H** Status).

## Prerequisites

- A local MongoDB the dev server can use, **or** the dev/staging `MONGODB_URI`
  in `.env` (this suite runs against the `.env` DB so real content — products,
  assessment questions, therapists — is available). Writes are confined to the
  seeded test accounts; no live orders/payments are created.
- Playwright browsers (already cached): `npx playwright install chromium firefox webkit`.

## How it works

- `e2e/scripts/start-test-server.sh` boots `next dev` on **:3100**, blanking the
  `WHATSAPP_*` env vars so the server falls back to `ConsoleOtpDelivery`, which
  logs the OTP to stdout (tee'd to `e2e/.artifacts/dev-server.log`).
- `e2e/helpers/otp.ts` reads that log to recover the OTP (it is **not** in the
  browser console — it is server-side).
- `e2e/global-setup.ts` seeds admin + customer (`scripts/verify-auth.ts`), logs
  each in via the real OTP UI, and saves `storageState` so specs reuse the
  session (conserves the 5-OTP-sends/hour/phone budget). Auth state younger than
  30 min is reused across runs.
- Specs live in `e2e/specs/NN-*.spec.ts`, one `test()` per TC (titled `TC-0NN …`).
  `chromium` runs everything; `firefox`/`webkit` run only the cross-browser spec.

## Run

```bash
npm run test:e2e            # run the suite (auto-starts :3100 if needed)
npm run test:e2e:report     # open the HTML report
npm run test:e2e:results    # write outcomes back into the .xlsx (backs up first)
```

Seeded test users (phone is the passwordless identifier):
`+919000000001` admin · `+919000000002` customer · `+919000000003` therapist.

If fresh-login tests hit the OTP rate limit, clear it for the test phones:

```bash
npx tsx --env-file=.env scripts/clear-test-rate-limits.ts
```

## Scope

Covers the credential-free + console-OTP-login-reachable cases. Not automated
(recorded as **BLOCKED** with reasons in the sheet): live Razorpay card entry
(cross-origin iframe), real WhatsApp/CRM notifications, the not-yet-integrated
therapy booking, and paid audio purchase/questionnaire. Core Web Vitals
(TC-007) are measured against **production** via Lighthouse, since dev timings
are not representative.
