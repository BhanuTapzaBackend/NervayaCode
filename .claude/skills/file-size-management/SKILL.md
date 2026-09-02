---
name: file-size-management
description: Keep Nervaya files under ~200 lines (300 is the lint-enforced hard cap on .tsx) by extracting sub-components, hooks, service helpers, and types — split by responsibility, never arbitrarily. Use when a file grows past 200 lines or a change would push it there.
---

# File Size Management (Nervaya)

House rule (`FRONTEND_STANDARDS.md` §1.3): **~200 lines SHOULD, 300 hard MUST on `.tsx`** (ESLint `max-lines`, blank lines/comments excluded; legacy offenders are baselined in `eslint-suppressions.json` — the baseline only shrinks, so splitting an oversized file you touch is the expected move).

## Extraction strategies, in order of preference

1. **Sub-components** — a JSX region with its own concern becomes `ComponentName/SubPart/index.tsx` + its own `styles.module.css`. Pages especially: `page.tsx` composes, never implements.
2. **Hooks** — stateful logic moves to a co-located `useThing.ts` (the house pattern: `src/app/(customer)/checkout/useCheckout/`), or `src/hooks/` if reused.
3. **Service helpers** — a growing `*.service.ts` splits by concern into sibling services or a `<domain>.helpers.ts` (house example: `consultation-schedule.helpers.ts` beside `consultation-schedule.service.ts`).
4. **Types** — repeated shapes move to the domain's `src/lib/api/<domain>.ts` exports or `src/types/`.
5. **Constants** — magic values move to `src/lib/constants/` (server) or `src/constants/` (client).

## Split by responsibility, not by line count

- ❌ Don't split arbitrarily to duck the number — a file cut mid-concern is worse than a long one.
- ❌ Don't create micro-files (5–10 lines); group related utilities (30–100 lines).
- ❌ Don't separate tightly coupled code that always changes together.
- ✅ Each extracted file has one describable job.

## Finding offenders

```bash
find src -name '*.tsx' -exec awk 'END{if(NR>300) print FILENAME": "NR}' {} \;
```

Known baselined monsters (fix on touch): `Admin/SupplementForm` (519), `Booking/BookingModal` (460), `therapy-corner/page` (417), `AuthContext` (394).
