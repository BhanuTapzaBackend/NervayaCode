'use client';

import { useEffect, type RefObject } from 'react';

/** Elements that can hold focus. Excludes tabindex="-1", which is programmatic-only. */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Focusable descendants that are actually rendered, in DOM order. */
function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (element) => element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement,
  );
}

/**
 * Keeps keyboard focus inside a dialog while it is open, and hands it back when
 * it closes.
 *
 * `aria-modal="true"` is a promise to assistive technology that the rest of the
 * page is inert. Without a trap that promise was false: Tab walked straight out
 * of the dialog and through the page behind it, while a screen reader still
 * announced everything as unavailable. Focus also stayed on the trigger when
 * the dialog opened, and was left on a removed element when it closed — so a
 * keyboard user landed back at the top of the document.
 *
 * ⚠️ The trap is implemented on the Tab KEY, deliberately — never by watching
 * `focusin` and forcing focus back. Radix Select/Popover render their content
 * through a portal OUTSIDE this container and move focus into it; a trap that
 * enforces containment would fight them and break every dropdown in a dialog.
 * For the same reason it stands down whenever focus is not currently inside the
 * container: whatever owns focus is a layer above this one, and it manages its
 * own keys.
 */
export function useFocusTrap(isActive: boolean, containerRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!isActive) return;
    const container = containerRef.current;
    if (!container) return;

    // Captured before we move focus, so it can be restored on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    container.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.defaultPrevented) return;

      const active = document.activeElement;
      // Focus is inside a portalled layer (an open Select, say). Not ours.
      if (!container.contains(active)) return;

      const focusables = focusableWithin(container);
      if (focusables.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      // Shift+Tab off the front wraps to the back, and vice versa. The container
      // itself counts as "the front" because it holds focus initially.
      if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Only if it is still in the document — the trigger may have been removed
      // by whatever the dialog just did.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [isActive, containerRef]);
}
