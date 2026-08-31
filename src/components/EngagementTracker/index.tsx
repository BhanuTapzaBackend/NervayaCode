'use client';

import { useScrollDepth } from '@/hooks/useScrollDepth';
import { useExitPage } from '@/hooks/useExitPage';
import { useClickAnyButton } from '@/hooks/useClickAnyButton';
import { usePageView } from '@/hooks/usePageView';

export function EngagementTracker(): null {
  usePageView();
  useScrollDepth();
  useExitPage();
  useClickAnyButton();
  return null;
}
