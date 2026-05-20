'use client';

import { useScrollDepth } from '@/hooks/useScrollDepth';
import { useExitPage } from '@/hooks/useExitPage';
import { useClickAnyButton } from '@/hooks/useClickAnyButton';

export function EngagementTracker(): null {
  useScrollDepth();
  useExitPage();
  useClickAnyButton();
  return null;
}
