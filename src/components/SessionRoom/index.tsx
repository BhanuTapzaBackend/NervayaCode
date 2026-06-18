'use client';

import { useCallback } from 'react';
import { JitsiRoom } from '@/components/JitsiRoom';
import { sessionsApi } from '@/lib/api/sessions';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/constants/roles';
import { ROUTES } from '@/utils/routesConstants';

interface SessionRoomProps {
  sessionId: string;
}

export const SessionRoom = ({ sessionId }: SessionRoomProps) => {
  const { user } = useAuth();
  const loadToken = useCallback(() => sessionsApi.getJitsiToken(sessionId), [sessionId]);

  const exitRedirectPath =
    user?.role === ROLES.THERAPIST
      ? ROUTES.THERAPIST_DASHBOARD
      : user?.role === ROLES.ADMIN
        ? ROUTES.ADMIN_DASHBOARD
        : ROUTES.DASHBOARD;

  return <JitsiRoom loadToken={loadToken} exitRedirectPath={exitRedirectPath} />;
};
