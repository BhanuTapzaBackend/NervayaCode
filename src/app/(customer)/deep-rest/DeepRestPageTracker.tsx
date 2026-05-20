'use client';

import { useEffect } from 'react';
import { trackViewAudioPage } from '@/utils/analytics';

export function DeepRestPageTracker(): null {
  useEffect(() => {
    trackViewAudioPage();
  }, []);
  return null;
}
