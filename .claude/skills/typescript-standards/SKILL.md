---
name: typescript-standards
description: TypeScript standards for Nervaya (strict mode, no any, unknown at boundaries, house naming). Use when writing TypeScript, defining types, or handling errors.
---

# TypeScript Standards (Nervaya)

Full rules: `FRONTEND_STANDARDS.md` §4. Strict mode is on; `@typescript-eslint/no-explicit-any` is an error.

## Types

- Interfaces for object shapes; type aliases for unions, primitives, tuples, intersections.
- **`I` prefix is reserved for Mongoose document interfaces** (`IOrder`, `IUser`, `IOrderItem` — the house model pattern). Everywhere else, no Hungarian prefixes: `Order`, `OrderFiltersParams`, `<Component>Props`.
- A shape used more than once gets a named, exported type — never the same inline literal repeated. Client API contracts live beside their `src/lib/api/<domain>.ts` module; model interfaces live in the model file.
- Roles/statuses come from `src/lib/constants/enums.ts` (`ROLES.ADMIN`, `PAYMENT_STATUS`, `*_VALUES`) — never free-typed strings.

## `any`, `unknown`, and boundaries

```ts
// ❌ never
function process(data: any) {
  return data.value;
}

// ✅ unknown at the trust boundary, narrowed immediately
function process(data: unknown): number {
  if (isValid(data)) return data.value;
  throw new Error('Invalid data');
}
function isValid(d: unknown): d is { value: number } {
  return typeof d === 'object' && d !== null && 'value' in d && typeof (d as { value: unknown }).value === 'number';
}
```

- `unknown` only at trust boundaries (request bodies, JSON.parse, catch clauses, `metadata` blobs) — never in an exported signature or prop.
- Truly unavoidable escape hatch: `@ts-expect-error` with a reason + a `// STANDARDS-EXEMPTION:` comment. Never `@ts-ignore` or `as any`.

## Inference & annotations

- Let TS infer the obvious (`const count = 0`); annotate empty collections (`const items: Order[] = []`).
- Explicit return types on exported functions; **mandatory on service functions** (they are the contract between layers).

## Null safety & control flow

- `?.` and `??` over manual chains; optional (`field?:`) for may-be-absent, `| null` when null is a meaningful value.
- `===`/`!==` always; the one sanctioned exception is `value == null` to match both null and undefined (ESLint `eqeqeq` allows it).
- `for...of` over arrays (never `for...in`); prefer `map`/`filter`/`reduce` where clearer.

## Errors

- Throw only `Error` objects. Catch as `unknown`, narrow with `instanceof`:

```ts
catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to load');
}
```

## Modules

- Named exports preferred; default exports only where Next.js requires them (`page.tsx`, `layout.tsx`, `route.ts` handlers are named).
- Import order: external packages → `@/` internal absolute → relative → styles last. No duplicate imports (lint error).
- Unused vars/args are lint errors; prefix intentional ones with `_`.
