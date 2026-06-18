'use client';

import { useCallback } from 'react';
import { JitsiRoom } from '@/components/JitsiRoom';
import { consultationsApi } from '@/lib/api/consultations';

interface ConsultationRoomProps {
  leadId: string;
}

export const ConsultationRoom = ({ leadId }: ConsultationRoomProps) => {
  const loadToken = useCallback(() => consultationsApi.getJitsiToken(leadId), [leadId]);
  return <JitsiRoom loadToken={loadToken} />;
};
