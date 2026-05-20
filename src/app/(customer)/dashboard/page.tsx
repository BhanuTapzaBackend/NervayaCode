'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import {
  ICON_CLIPBOARD,
  ICON_CALENDAR,
  ICON_CHEVRON_RIGHT,
  ICON_SHOPPING_BAG,
  ICON_MOON_SLEEP,
} from '@/constants/icons';
import Sidebar from '@/components/Sidebar/LazySidebar';
import PageHeader from '@/components/PageHeader/PageHeader';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import { StatTile } from '@/components/Dashboard/StatTile';
import { AssessmentTile } from '@/components/Dashboard/AssessmentTile';
import { RecentActivity, type ActivityItem } from '@/components/Dashboard/RecentActivity';
import styles from './styles.module.css';
import { useAuth } from '@/hooks/useAuth';
import { useCustomer } from '@/context/CustomerContext';
import { supplementsApi } from '@/lib/api/supplements';
import { ROUTES } from '@/utils/routesConstants';
import { ITEM_TYPE, PAYMENT_STATUS } from '@/lib/constants/enums';
import type { Supplement } from '@/types/supplement.types';
import {
  buildRecentActivity,
  getAssessmentTileModel,
  getNextSessionInfo,
} from '@/components/Dashboard/dashboardViewModel.util';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const {
    loading,
    error,
    sessions,
    orders,
    latestAssessment,
    inProgressAssessment,
    driftOffResponses,
    refreshData: retry,
  } = useCustomer();
  const [supplements, setSupplements] = useState<Supplement[]>([]);

  // We no longer use showLoader() here to keep it 'inside the page' and avoid double loaders

  useEffect(() => {
    const fetchSupps = async () => {
      try {
        const res = await supplementsApi.getAll();
        if (res.success) setSupplements(res.data || []);
      } catch {}
    };
    fetchSupps();
  }, []);

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const nextSession = useMemo(() => getNextSessionInfo(sessions, nowMs), [sessions, nowMs]);

  const hasPurchasedSupplement = useMemo(
    () =>
      orders.some(
        (o) => o.paymentStatus === PAYMENT_STATUS.PAID && o.items?.some((it) => it.itemType === ITEM_TYPE.SUPPLEMENT),
      ),
    [orders],
  );

  const deepRestState = useMemo(() => {
    const total = driftOffResponses.length;
    if (total === 0) return { status: 'empty' as const, readyCount: 0, total };
    const readyCount = driftOffResponses.filter((r) => Boolean(r.assignedVideoUrl)).length;
    if (readyCount > 0) return { status: 'ready' as const, readyCount, total };
    return { status: 'preparing' as const, readyCount: 0, total };
  }, [driftOffResponses]);

  const deepRestTile = useMemo(() => {
    if (deepRestState.status === 'ready') {
      return {
        value: `${deepRestState.readyCount}  tailored audio session${deepRestState.readyCount === 1 ? '' : 's'} ready`,
        subtitle: 'Your tailored audio is ready to play.',
        primaryLabel: 'Open Playlist',
        primaryHref: '/deep-rest/sessions',
        secondaryLabel: 'Buy Another',
        iconColor: 'var(--color-tile-emerald)',
      };
    }
    if (deepRestState.status === 'preparing') {
      return {
        value: 'In progress',
        subtitle: 'Our specialists are crafting your personalized audio.',
        primaryLabel: 'View Status',
        primaryHref: '/deep-rest/sessions',
        secondaryLabel: 'Buy Another',
        iconColor: 'var(--color-tile-amber)',
      };
    }
    return {
      value: 'Tailored Audio',
      subtitle: 'Curated Deep Rest audio crafted for your sleep pattern.',
      primaryLabel: 'Buy Audio',
      primaryHref: '/deep-rest',
      secondaryLabel: 'Add to Cart',
      iconColor: 'var(--color-tile-violet)',
    };
  }, [deepRestState]);

  const assessmentTile = useMemo(
    () => getAssessmentTileModel(latestAssessment, inProgressAssessment),
    [latestAssessment, inProgressAssessment],
  );
  const recentActivity = useMemo(
    () => buildRecentActivity(sessions, orders, latestAssessment, 5),
    [sessions, orders, latestAssessment],
  );

  const activityItems: ActivityItem[] = useMemo(() => {
    return recentActivity.map((it) => ({
      id: it.id,
      label: it.label,
      timeLabel: it.timeLabel,
      time: it.time,
      icon:
        it.iconKey === 'session' ? (
          <Icon icon={ICON_CALENDAR} aria-hidden />
        ) : it.iconKey === 'order' ? (
          <Icon icon={ICON_SHOPPING_BAG} aria-hidden />
        ) : (
          <Icon icon={ICON_CLIPBOARD} aria-hidden />
        ),
    }));
  }, [recentActivity]);

  const handleAddToCart = useCallback(
    (type: 'DriftOff' | 'Supplement') => {
      if (!isAuthenticated) {
        router.push(`${ROUTES.LOGIN}?returnUrl=${encodeURIComponent('/dashboard')}`);
        return;
      }

      if (type === 'DriftOff') {
        router.push(`/cart?addItemId=drift-off-session&itemType=${ITEM_TYPE.DRIFT_OFF}`);
      } else {
        const sleepElixir =
          supplements.find((s) => s.name.toLowerCase().includes('sleep essentials')) || supplements[0];

        if (!sleepElixir) {
          toast.error('Sleep Essentials not found');
          router.push('/sleep-supplements');
          return;
        }
        router.push(`/cart?addItemId=${sleepElixir._id}&itemType=${ITEM_TYPE.SUPPLEMENT}`);
      }
    },
    [isAuthenticated, router, supplements],
  );

  const welcomeName = user?.name?.trim() ? user.name : 'there';
  return (
    <Sidebar>
      <div className={styles.container}>
        <PageHeader title={`Welcome, ${welcomeName}!`} subtitle="Here's your personalized overview." />

        {error && (
          <div className={styles.errorRow} role="alert">
            <span>{error}</span>
            <button type="button" className={styles.retryBtn} onClick={retry}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <GlobalLoader label="Loading your dashboard..." />
        ) : (
          <>
            <div className={styles.assessmentRow}>
              <AssessmentTile data={assessmentTile} />
            </div>

            <div className={styles.tilesGrid} aria-label="Module status tiles">
              <StatTile
                title="Therapy"
                value={
                  nextSession
                    ? `${nextSession.session.date} • ${nextSession.session.startTime}`
                    : 'No upcoming sessions'
                }
                subtitle={
                  nextSession
                    ? (() => {
                        const th = nextSession.session.therapistId;
                        const name =
                          typeof th === 'object' && th && 'name' in th ? (th as { name?: string }).name : null;
                        return `With ${name || 'Therapist'}`;
                      })()
                    : 'Book your next appointment anytime.'
                }
                icon={<Icon icon={ICON_CALENDAR} aria-hidden />}
                cta={
                  nextSession?.session.meetLink
                    ? [
                        { label: 'Join Meeting', href: nextSession.session.meetLink, variant: 'primary' },
                        { label: 'Schedule Another', href: '/therapy-corner', variant: 'secondary' },
                      ]
                    : [
                        { label: 'Schedule Appointment', href: '/therapy-corner', variant: 'primary' },
                        { label: 'Add to Cart', href: '/therapy-corner', variant: 'secondary' },
                      ]
                }
                iconColor="var(--color-tile-indigo)"
              />

              <StatTile
                title="Deep Rest"
                value={deepRestTile.value}
                subtitle={deepRestTile.subtitle}
                icon={<Icon icon={ICON_MOON_SLEEP} aria-hidden />}
                cta={[
                  {
                    label: deepRestTile.primaryLabel,
                    href: deepRestTile.primaryHref,
                    variant: 'primary',
                  },
                  {
                    label: deepRestTile.secondaryLabel,
                    href: deepRestState.status === 'empty' ? '' : '/deep-rest',
                    variant: 'secondary',
                    ...(deepRestState.status === 'empty' ? { onClick: () => handleAddToCart('DriftOff') } : {}),
                  },
                ]}
                iconColor={deepRestTile.iconColor}
              />

              <StatTile
                title="Sleep Supplements"
                value="Sleep Supplements"
                subtitle="Completely natural, herbal formula for deep, restorative sleep."
                icon={<Icon icon={ICON_SHOPPING_BAG} aria-hidden />}
                cta={[
                  {
                    label: hasPurchasedSupplement ? 'Buy Again' : 'Buy Now',
                    href: '/sleep-supplements',
                    variant: 'primary',
                  },
                  {
                    label: 'Add to Cart',
                    href: '',
                    variant: 'secondary',
                    onClick: () => handleAddToCart('Supplement'),
                  },
                ]}
                iconColor="var(--color-tile-rose)"
              />
            </div>

            <div className={styles.recentActivitySection}>
              <RecentActivity items={activityItems} />
            </div>

            {!error && sessions.length === 0 && orders.length === 0 && (
              <div className={styles.emptyNote}>
                <p>
                  Explore what Nervaya offers. <span className={styles.muted}>Your activity will show up here.</span>
                </p>
                <Link href="/therapy-corner" className={styles.inlineHint}>
                  Go to <span className={styles.accent}>Therapy Corner</span>{' '}
                  <Icon icon={ICON_CHEVRON_RIGHT} aria-hidden />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </Sidebar>
  );
}
