'use client';

import { useState, useEffect, useSyncExternalStore, useCallback, type ReactElement } from 'react';
import { Icon } from '@iconify/react';
import { ICON_INFINITY } from '@/constants/icons';
import { GlobalLoader } from '@/components/common';
import Button from '@/components/common/Button';
import { deepRestApi } from '@/lib/api/deepRest';
import type { IDriftOffResponse } from '@/types/driftOff.types';
import { SessionCard } from '@/components/DeepRest/MySessionsSection/SessionCard';
import { EmptySessions } from '@/components/DeepRest/MySessionsSection/EmptySessions';
import styles from './styles.module.css';

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const PLAYLIST_LIMIT = 3;

export const PlaylistSection = (): ReactElement => {
  const hasMounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const [responses, setResponses] = useState<IDriftOffResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const loadResponses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await deepRestApi.getResponses(1, PLAYLIST_LIMIT);
      if (res.success && res.data) {
        const sorted = [...res.data.data].sort((a, b) => {
          if (!a.completedAt && b.completedAt) return -1;
          if (a.completedAt && !b.completedAt) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setResponses(sorted);
        setTotal(res.data.meta.total);
      } else {
        setResponses([]);
        setTotal(0);
      }
    } catch {
      setError('Failed to load your sessions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResponses();
  }, [loadResponses]);

  useEffect(() => {
    const handleEvents = () => {
      if ((document.visibilityState === 'visible' || window.name === 'focus') && !isLoading) {
        loadResponses();
      }
    };

    document.addEventListener('visibilitychange', handleEvents);
    window.addEventListener('focus', handleEvents);

    return () => {
      document.removeEventListener('visibilitychange', handleEvents);
      window.removeEventListener('focus', handleEvents);
    };
  }, [loadResponses, isLoading]);

  return (
    <div className={styles.card}>
      <div className={styles.playlistHeader}>
        <div className={styles.accessBadge}>
          <Icon icon={ICON_INFINITY} width={16} height={16} /> Unlimited Lifetime Access
        </div>
      </div>

      {isLoading ? (
        <GlobalLoader label="Loading your sessions..." />
      ) : error ? (
        <div className={styles.errorWrapper}>
          <p className={styles.errorText}>{error}</p>
          <Button type="button" variant="primary" size="md" fullWidth={false} onClick={loadResponses}>
            Try Again
          </Button>
        </div>
      ) : total === 0 || responses.length === 0 ? (
        <EmptySessions />
      ) : (
        <ul className={styles.playlistGrid} aria-label="Your Deep Rest sessions">
          {responses.map((session) => (
            <li key={session._id}>
              <SessionCard session={session} hasMounted={hasMounted} isRequesting={false} requestError={undefined} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
