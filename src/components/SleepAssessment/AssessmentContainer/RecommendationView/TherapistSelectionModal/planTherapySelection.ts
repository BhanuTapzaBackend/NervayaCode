import type { TherapistSelection } from './types';

/**
 * Persists the therapist + slot chosen for the sleep-plan bundle.
 *
 * The pick is made in a popup but paid for in a flow that can be interrupted —
 * a reload, the back button, the phone-collection gate on checkout, or simply
 * closing the tab and coming back. Losing it means re-choosing a therapist and
 * re-hunting a slot, which is the most tedious part of the whole plan.
 *
 * ⚠️ A restored selection is a HINT, never a fact. Slots are only held once an
 * order is created, so anything stored here may have been taken by someone else
 * in the meantime — and with a multi-day TTL that is the common case, not an
 * edge case. Callers MUST re-validate against live availability before using
 * it; see `isSelectionStale` and the restore path in the modal.
 */

const STORAGE_KEY = 'nervaya.planTherapySelection';

/** Long enough to survive a considered decision, short enough that most slots still exist. */
const TTL_DAYS = 7;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

export interface StoredTherapySelection extends TherapistSelection {
  /** Epoch ms, for TTL expiry. */
  savedAt: number;
}

function isStoredSelection(value: unknown): value is StoredTherapySelection {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.therapistId === 'string' &&
    candidate.therapistId.length > 0 &&
    typeof candidate.therapistName === 'string' &&
    typeof candidate.date === 'string' &&
    candidate.date.length > 0 &&
    typeof candidate.slot === 'string' &&
    candidate.slot.length > 0 &&
    typeof candidate.sessionFee === 'number' &&
    typeof candidate.savedAt === 'number'
  );
}

/** Reads the saved pick, or null when absent, malformed or expired. */
export function loadPlanTherapySelection(): StoredTherapySelection | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    // Anything can be written to localStorage — another tab, an older build, a
    // user with devtools open. Validate the shape rather than trusting a cast,
    // or a malformed entry reaches checkout as a therapistId of `undefined`.
    if (!isStoredSelection(parsed)) {
      clearPlanTherapySelection();
      return null;
    }

    if (Date.now() - parsed.savedAt > TTL_MS) {
      clearPlanTherapySelection();
      return null;
    }

    return parsed;
  } catch {
    // Private-mode quota errors, disabled storage, corrupt JSON. Never fatal:
    // the popup simply starts empty.
    return null;
  }
}

export function savePlanTherapySelection(selection: TherapistSelection): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: StoredTherapySelection = { ...selection, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage being unavailable must not block the purchase.
  }
}

export function clearPlanTherapySelection(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignored for the same reason as above.
  }
}
