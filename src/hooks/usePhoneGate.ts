'use client';

import { useCallback, useRef, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

/** The server's "collect a phone number and retry" signal. See phone-gate.ts. */
export const PHONE_REQUIRED_STATUS = 428;

/** True when an axios rejection is the phone gate rather than a real error. */
export function isPhoneRequiredError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { statusCode?: number; status?: number; response?: { status?: number } };
  return (
    candidate.statusCode === PHONE_REQUIRED_STATUS ||
    candidate.status === PHONE_REQUIRED_STATUS ||
    candidate.response?.status === PHONE_REQUIRED_STATUS
  );
}

interface UsePhoneGateReturn {
  /**
   * Resolves true when the account already has a number, otherwise opens the
   * modal and resolves once the user finishes (true) or dismisses it (false).
   */
  ensurePhone: () => Promise<boolean>;
  isOpen: boolean;
  close: () => void;
  onVerified: () => void;
}

/**
 * Client-side half of the deferred phone-collection flow.
 *
 * Checks up front to avoid a wasted round trip, but callers should ALSO treat a
 * 428 from the action itself as the gate (see `isPhoneRequiredError`) — the
 * cached user in context can be stale, and the server is the authority.
 */
export function usePhoneGate(): UsePhoneGateReturn {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Held across the modal's lifetime so ensurePhone() can resolve when the user
  // finishes, letting callers `await` the gate and then retry their action.
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);

  const settle = useCallback((ok: boolean) => {
    setIsOpen(false);
    resolverRef.current?.(ok);
    resolverRef.current = null;
  }, []);

  const ensurePhone = useCallback((): Promise<boolean> => {
    if (user?.phone) return Promise.resolve(true);

    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      // A second call while the modal is already open supersedes the first;
      // release the earlier caller rather than leaving its promise pending.
      resolverRef.current?.(false);
      resolverRef.current = resolve;
    });
  }, [user?.phone]);

  return {
    ensurePhone,
    isOpen,
    close: () => settle(false),
    onVerified: () => settle(true),
  };
}
