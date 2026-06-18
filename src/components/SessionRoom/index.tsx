'use client';

import { useCallback } from 'react';
import { JitsiRoom } from '@/components/JitsiRoom';
import { sessionsApi } from '@/lib/api/sessions';

interface SessionRoomProps {
  sessionId: string;
}

export const SessionRoom = ({ sessionId }: SessionRoomProps) => {
  const loadToken = useCallback(() => sessionsApi.getJitsiToken(sessionId), [sessionId]);
  return <JitsiRoom loadToken={loadToken} />;
};
