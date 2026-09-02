---
name: nervaya-code-quality
description: Nervaya's quality tooling — the lint/format/typecheck/stylelint commands, the husky + lint-staged pre-commit gate, the CI job, and the ratchet baselines (eslint-suppressions.json, stylelint overrides). Use when running quality checks, fixing lint/CI failures, or changing tooling config.
---

# Nervaya Code Quality Tooling

Full rules: `FRONTEND_STANDARDS.md` §0 (ratchet), §13 (workflow), §14 (scanners).

## Commands

```bash
npm run lint          # ESLint, whole repo (eslint.config.mjs)
npm run lint:fix      # ESLint with --fix
npm run lint:styles   # Stylelint on src/**/*.css (.stylelintrc.json)
npm run typecheck     # tsc --noEmit
npm run format        # Prettier write
npm run format:check  # Prettier check (what CI runs)
npm run build         # Next build — run before every PR; CI doesn't build yet
```

## Gates

- **Pre-commit (husky):** `npm run lint`, then lint-staged — Prettier + `eslint --fix` on staged code, `stylelint --fix` + Prettier on staged CSS. Never bypass with `--no-verify`; CI re-runs everything.
- **CI:** `.github/workflows/lint.yml` ("Lint & Format Check") runs `format:check` → `lint` → `typecheck` → `lint:styles` on PRs/pushes to `main`.

## The ratchet baselines — may only shrink

- **`eslint-suppressions.json`** — pre-existing violations of `no-console` (error, warn/error allowed), the `@/lib/axios`/`axios` import boundary, and `max-lines` 300. ESLint applies it automatically; NEW violations fail. After cleaning a file: `npx eslint . --prune-suppressions`. NEVER run `--suppress-all`/`--suppress-rule` to admit new violations.
- **`.stylelintrc.json` overrides** — the legacy files exempt from `color-no-hex` (token files `src/styles/**` + `globals.css` are legitimately exempt). Tokenize a legacy file ⇒ delete its entry. Never add entries.

## Key rules that bite

- `no-explicit-any` error; `no-console` error (only `warn`/`error` allowed — and required for fire-and-forget failures).
- `no-restricted-imports`: `@/lib/axios` and the `axios` package are importable only from `src/lib/api/**` and `src/lib/axios.ts`.
- `max-lines` 300 on `.tsx`; `color-no-hex` in CSS (use `var(--…)` tokens).
- Warn-level for legacy reasons but error-in-spirit for new code: `no-array-index-key`, `no-non-null-assertion`. Don't grow the warning count.
- Stylelint locks the house notation: legacy `rgba()`, prefix media queries (`max-width:`), CSS-Modules `:global` allowed.

## Scanners (security-touching changes)

```bash
semgrep --config auto --quiet .   # new findings in changed files block the PR
```

SonarQube setup lives in `CLAUDE.md`; the §0 baseline numbers only go down. Known open findings (fix on touch, never copy): path traversal in `admin/deep-rest/upload-video`, ReDoS in `blog.service.ts` search.
