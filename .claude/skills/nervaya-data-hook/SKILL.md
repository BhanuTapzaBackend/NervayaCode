---
name: nervaya-data-hook
description: Build a Nervaya client data hook the house way — lib/api module → src/queries hook → component, with the mandatory active-flag/fetchKey lifecycle (there is no React Query). Use when a component needs server data or when adding a client API call.
---

# Nervaya Data Hook

Full rules: `FRONTEND_STANDARDS.md` §2. Reference pair: `src/lib/api/orders.ts` ↔ `src/queries/orders/useOrders.ts`.

## The three tiers

1. `src/lib/api/<domain>.ts` — axios calls + `ApiResponse<T>` envelope. No React.
2. `src/queries/<domain>/use<Thing>.ts` — `useState` + `useEffect` hook wrapping tier 1.
3. Components consume hooks only. Components NEVER import `@/lib/axios`, the `axios` package, or `fetch('/api/...')` — ESLint blocks this (`no-restricted-imports`).

## Hook template — every element is mandatory

There is no React Query, so the hook hand-rolls what React Query would do:

```ts
import { useState, useEffect, useCallback } from 'react';
import { thingApi, type Thing, type ThingFilters } from '@/lib/api/thing';

export function useThings(page: number, filters?: ThingFilters) {
  const [data, setData] = useState<Thing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  // Objects must be serialized to a stable key — an inline object in the
  // dependency array retriggers the effect every render.
  const filtersKey = JSON.stringify(filters ?? {});

  useEffect(() => {
    let active = true; // the only thing preventing state-after-unmount + races

    async function fetchThings() {
      setIsLoading(true);
      setError(null);
      try {
        const parsed: ThingFilters = JSON.parse(filtersKey);
        const response = await thingApi.getAll(page, parsed);
        if (!active) return;
        setData(response.success && response.data ? response.data : []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load');
        setData([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchThings();
    return () => {
      active = false;
    };
  }, [page, filtersKey, fetchKey]);

  // Refetch by bumping the key — never duplicate the fetch logic
  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  return { data, isLoading, error, refetch };
}
```

## Checklist

- [ ] `active` flag checked before EVERY `setState`, reset in cleanup.
- [ ] `isLoading` + `error` returned; the consuming screen renders all four states (loading / error / empty / data).
- [ ] `refetch` via `fetchKey` counter.
- [ ] Object params go through `JSON.stringify` before the dependency array.
- [ ] Tier-1 module exports named types alongside the API object.
- [ ] Auth state changes fire the `auth-state-changed` DOM event (see `AuthContext`) — never a parallel auth store.
