#!/usr/bin/env bash
# Boots the Next.js dev server for the e2e suite on port 3100.
#
# Why env vars are exported here instead of an .env.local file:
#   Next.js does NOT override variables already present in process.env, so
#   exporting them before `next dev` reliably wins over the committed .env:
#     - WHATSAPP_*   -> blanked so the server falls back to ConsoleOtpDelivery,
#                       which logs the OTP to stdout for the harness to read.
#
# MONGODB_URI is intentionally NOT overridden: it inherits the committed .env
# (a dev/staging DB, confirmed safe to seed/write) so the suite runs against
# real content — products, assessment questions, therapists, blog posts.
#
# Output is tee'd to e2e/.artifacts/dev-server.log so the OTP reader can grep it
# while Playwright still sees the server come up on the URL.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

export WHATSAPP_PHONE_NUMBER_ID=""
export WHATSAPP_ACCESS_TOKEN=""
export WHATSAPP_OTP_TEMPLATE_NAME=""
export NODE_ENV="development"

mkdir -p e2e/.artifacts
: > e2e/.artifacts/dev-server.log   # truncate previous run's log

echo "[start-test-server] booting next dev on :3100 (DB=nervaya_e2e, WhatsApp disabled)"
npx next dev -p 3100 --turbopack 2>&1 | tee e2e/.artifacts/dev-server.log
