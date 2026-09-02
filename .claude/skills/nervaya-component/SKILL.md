---
name: nervaya-component
description: Build a Nervaya React component the house way — ComponentName/index.tsx + styles.module.css, design tokens only (no hex/Tailwind/inline styles), four data states, effect cleanup, a11y. Use when creating or restyling components or pages.
---

# Nervaya Component

Full rules: `FRONTEND_STANDARDS.md` §5–§6. Shared kit: `src/components/common/` — reuse before you create; a variant is a prop, not a parallel component.

## File shape

`src/components/<Domain>/ComponentName/index.tsx` + `styles.module.css`. Named exports preferred. Used by 2+ domains ⇒ `src/components/common/`.

## Internal ordering (keep every component scannable)

1. Imports (React → external → internal components → hooks/utils → styles last)
2. Types/interfaces (props interface named `<Component>Props`)
3. Component: state hooks → data hooks → effects → memos/callbacks → early returns (loading/error/empty) → main render

## Styling — CSS Modules + tokens ONLY

- No Tailwind, no styled-components, no inline `style={}` for anything a class can express.
- **No raw colors.** Every color is a `var(--…)` token from `src/styles/colors.css`; spacing from `spacing.css`. Stylelint `color-no-hex` blocks hex in CSS. Need a new token? Define it centrally first with a one-line comment.
- No `var(--token, #hex)` fallbacks against undefined tokens — the fallback always wins.
- Media queries nest **directly under the selector they modify**, not collected at the bottom:

```css
.title {
  font-size: var(--font-size-xl);
}

@media (max-width: 768px) {
  .title {
    font-size: var(--font-size-lg);
  }
}
```

## Behavior checklist

- [ ] All four data states rendered: loading, error, empty, data (from the hook's `isLoading`/`error` — never assume data arrived).
- [ ] Every effect returns its cleanup: listeners, timers, observers, the data-hook `active` flag.
- [ ] Stable unique `key`s on lists — never the array index when items can reorder.
- [ ] `next/image` for images, `next/link` for internal navigation (ESLint errors otherwise).
- [ ] A11y: semantic HTML, `label htmlFor` ↔ `input id`, keyboard handler alongside every click handler (standing SonarQube finding — don't add to it), `aria-*` where semantics fall short.
- [ ] Memoize only where it measurably helps (large lists, charts) — no speculative `useMemo` blankets; heavy components load via `next/dynamic`.
- [ ] Size: ~200 lines SHOULD, 300 hard MUST (`max-lines` lint) — extract sub-components/hooks by responsibility, never arbitrarily.
- [ ] Pages (`page.tsx`) stay thin: read params, wire hooks, compose. Business logic in a page is misplaced by definition.
