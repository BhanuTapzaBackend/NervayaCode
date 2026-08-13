import { useRef, type TouchEvent } from 'react';

/** Minimum horizontal travel, in pixels, before a drag counts as a swipe. */
const SWIPE_THRESHOLD = 50;

interface SwipeHandlers {
  onTouchStart: (event: TouchEvent<HTMLElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLElement>) => void;
}

/**
 * Touch-only horizontal swipe detection.
 * Vertical-dominant drags are ignored so the page keeps scrolling normally.
 */
export const useSwipe = (onSwipeLeft: () => void, onSwipeRight: () => void): SwipeHandlers => {
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (event: TouchEvent<HTMLElement>): void => {
    const touch = event.touches[0];
    startPoint.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLElement>): void => {
    const start = startPoint.current;
    startPoint.current = null;

    const touch = event.changedTouches[0];
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaY) > Math.abs(deltaX)) return;

    if (deltaX < 0) onSwipeLeft();
    else onSwipeRight();
  };

  return { onTouchStart, onTouchEnd };
};
