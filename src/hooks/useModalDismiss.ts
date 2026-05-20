'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Wires Escape-key and click-outside dismissal for a modal/dialog.
 * Only attaches listeners while `isOpen` is true.
 */
export function useModalDismiss(isOpen: boolean, modalRef: RefObject<HTMLElement | null>, onClose: () => void): void {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
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
