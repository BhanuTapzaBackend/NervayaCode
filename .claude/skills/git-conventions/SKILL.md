---
name: git-conventions
description: Nervaya git workflow — Conventional Commits, branch prefixes, and the fork → Nervayaofficial PR flow. Use when committing, branching, or opening a PR.
---

# Git Conventions (Nervaya)

## Conventional Commits — every commit

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `hotfix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Breaking change: `!` after type/scope + `BREAKING CHANGE:` footer.

Rules: imperative mood ("add", not "added"), ≤72 chars, no trailing period, body explains what/why (not how), blank line between subject and body. Scope is the domain: `checkout`, `orders`, `auth`, `deep-rest`, `sessions`, `zoho`, `whatsapp`.

```bash
# ✅ house examples (real history)
fix(checkout): send to the verified number and show which address is picked
fix(orders): deliver the invoice PDF and confirmation that never arrived

# ❌ rejects
updated code            # no type
fix: bug fix            # vague
feat: added new feature # past tense
```

## Branches

`<prefix>/<kebab-description>` — prefixes: `feature/`, `fix/`, `hotfix/`, `refactor/`, `docs/`, `chore/`. Never commit directly to `main`.

## PR flow — this is a fork setup

`origin` is a personal fork; PRs target the upstream repo explicitly:

```bash
git checkout -b fix/thing && git push -u origin fix/thing
gh pr create --repo Nervayaofficial/NervayaCode \
  --head <fork-owner>:fix/thing --base main \
  --title "fix(thing): …" --body-file body.md
```

PR title follows Conventional Commits. Without `--repo`, the PR lands on the fork and nobody sees it.

## Before push

- [ ] `npm run build` passes locally (CI runs lint/typecheck/format/styles but not the build).
- [ ] Pre-commit hook ran (never `--no-verify` — CI re-runs the same checks anyway).
- [ ] Each commit is one logical change; no debug code.
- [ ] Never force-push shared branches (`--force-with-lease` if you must on your own).
