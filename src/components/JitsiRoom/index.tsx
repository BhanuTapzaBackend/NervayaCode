'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JaaSMeeting } from '@jitsi/react-sdk';
import type { ApiResponse } from '@/lib/api/types';
import type { JitsiTokenResponse } from '@/lib/api/sessions';
import styles from './styles.module.css';

interface JitsiRoomProps {
  /** Loads the JaaS token for this room. Provided by a caller-specific API module. */
  loadToken: () => Promise<ApiResponse<JitsiTokenResponse>>;
  /** Where to send the user after they leave the call (avoids the blank "left meeting" screen). */
  exitRedirectPath?: string;
  /** Show the device-check prejoin screen before entering (default true). */
  prejoin?: boolean;
}

export const JitsiRoom = ({ loadToken, exitRedirectPath = '/', prejoin = true }: JitsiRoomProps) => {
  const router = useRouter();
  const [meeting, setMeeting] = useState<JitsiTokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    loadToken()
      .then((res) => {
        if (active) setMeeting(res.data ?? null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'Unable to join this session.';
        setError(message);
      });

    return () => {
      active = false;
    };
  }, [loadToken]);

  if (error) {
    return (
      <div className={styles.state}>
        <p className={styles.stateText}>{error}</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className={styles.state}>
        <p className={styles.stateText}>Preparing your session…</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <JaaSMeeting
        appId={meeting.appId}
        roomName={meeting.roomName}
        jwt={meeting.token}
        configOverwrite={{ prejoinPageEnabled: prejoin }}
        onReadyToClose={() => router.replace(exitRedirectPath)}
        getIFrameRef={(node: HTMLDivElement) => {
          node.style.height = '100%';
          node.style.width = '100%';
        }}
      />
    </div>
  );
};
