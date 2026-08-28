'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Markers Radix puts on the content it renders through a portal.
 *
 * Radix Select, Dropdown and Popover mount their panel on `document.body`, not
 * inside the component that opened it. To a `contains()` check against the
 * modal element that panel is "outside" — so clicking an option in a Select
 * inside a Modal dismissed the WHOLE modal instead of choosing the option.
 * That made the time dropdowns in the working-hours editor impossible to use:
 * every click on an entry closed the dialog.
 */
const PORTAL_SELECTORS = [
  '[data-radix-popper-content-wrapper]',
  '[data-radix-select-content]',
  '[data-radix-select-viewport]',
  '[data-radix-menu-content]',
  // Toasts are portalled to the body too, and they carry a close button. Without
  // this, dismissing a toast that happened to appear over a dialog closed the
  // dialog as well.
  '[data-sonner-toaster]',
].join(',');

function isInsidePortalledOverlay(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(PORTAL_SELECTORS) !== null;
}

/**
 * True for a click that a floating layer swallowed rather than a real click on
 * the page behind the dialog.
 *
 * An open Radix Select/Popover sets `document.body { pointer-events: none }`,
 * re-enabling them only on its own content. Hit-testing then skips everything
 * inside the modal, so ANY click elsewhere retargets to `<html>` — neither
 * portalled content nor inside the modal, so the outside-click check read it as
 * "clicked outside" and dismissed the dialog. Allowing the portal selectors
 * fixes clicking an OPTION, but not the ordinary way people abandon a dropdown:
 * clicking somewhere else. The layer dismisses itself; the dialog underneath
 * must not react at all.
 *
 * Detected by the target, NOT by reading `body.style.pointerEvents` — measured
 * in a browser, Radix restores that style on pointerdown, so by the time this
 * mousedown handler runs it already reads "auto" and the check never fires.
 * `<html>` is not a plausible target for a genuine outside click: the modal's
 * own backdrop covers the viewport, so clicking beside the dialog targets the
 * overlay element instead.
 */
function isRetargetedLayerClick(target: EventTarget | null): boolean {
  return target === document.documentElement || document.body.style.pointerEvents === 'none';
}

/**
 * Wires Escape-key and click-outside dismissal for a modal/dialog.
 * Only attaches listeners while `isOpen` is true.
 */
export function useModalDismiss(isOpen: boolean, modalRef: RefObject<HTMLElement | null>, onClose: () => void): void {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      // A nested overlay that handled Escape itself calls preventDefault. Escape
      // should close the innermost thing — the open dropdown — not the dialog
      // underneath it.
      if (event.defaultPrevented) return;

      onClose();
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (isRetargetedLayerClick(event.target)) return;
      if (isInsidePortalledOverlay(event.target)) return;
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, onClose, modalRef]);
}
