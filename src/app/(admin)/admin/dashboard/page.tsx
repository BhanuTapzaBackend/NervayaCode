'use client';

import { Icon } from '@iconify/react';
import { ICON_BOX, ICON_CALENDAR, ICON_USERS_GROUP, ICON_RUPEE } from '@/constants/icons';
import PageHeader from '@/components/PageHeader/PageHeader';
import { StatusState } from '@/components/common';
import StatsCard from '@/components/Admin/StatsCard';
import RecentOrders from '@/components/Admin/RecentOrders';
import UpcomingSessions from '@/components/Admin/UpcomingSessions';
import { useAdmin } from '@/context/AdminContext';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import { formatPrice } from '@/utils/cart.util';
import styles from './styles.module.css';

export default function AdminDashboardPage() {
  const { stats, loading: isLoading, error, refreshStats: refetch } = useAdmin();
  if (isLoading) {
    return (
      <div className={styles.dashboardStack}>
        <PageHeader title="Admin Dashboard" subtitle="Orders, revenue, sessions, and customers at a glance." />
        <GlobalLoader label="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Admin Dashboard" subtitle="Orders, revenue, sessions, and customers at a glance." />
        <StatusState
          type="error"
          message={error}
          action={
            <button type="button" onClick={() => refetch()} className={styles.retryButton}>
              Retry
            </button>
          }
        />
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <PageHeader title="Admin Dashboard" subtitle="Orders, revenue, sessions, and customers at a glance." />
        <StatusState type="empty" message="Unable to load dashboard stats." />
      </div>
    );
  }

  const { orders, sessions, users, revenue } = stats;
  const pendingOrders = orders.byStatus?.pending ?? 0;

  return (
    <div className={styles.dashboardStack}>
      <PageHeader title="Admin Dashboard" subtitle="Orders, revenue, sessions, and customers at a glance." />

      <section className={styles.statsGrid} aria-label="Key metrics">
        <StatsCard
          title="Orders"
          value={orders.total}
          subtitle={`Pending review: ${pendingOrders}`}
          icon={<Icon icon={ICON_BOX} />}
        />
        <StatsCard
          title="Revenue"
          value={formatPrice(revenue.total)}
          subtitle={`This month: ${formatPrice(revenue.thisMonth)}`}
          icon={<Icon icon={ICON_RUPEE} />}
          trend={revenue.growthPercent >= 0 ? 'up' : 'down'}
          trendLabel={
            revenue.growthPercent >= 0
              ? `+${revenue.growthPercent}% vs last month`
              : `${revenue.growthPercent}% vs last month`
          }
        />
        <StatsCard
          title="Upcoming Sessions"
          value={sessions.upcomingCount}
          subtitle={`${sessions.total} total scheduled`}
          icon={<Icon icon={ICON_CALENDAR} />}
        />
        <StatsCard
          title="Customers"
          value={users.customers}
          subtitle={`${users.total} total accounts`}
          icon={<Icon icon={ICON_USERS_GROUP} />}
        />
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.panel} aria-labelledby="recent-orders-heading">
          <div className={styles.panelHeader}>
            <p className={styles.panelEyebrow}>Orders</p>
            <h2 id="recent-orders-heading" className={styles.sectionTitle}>
              Recent Orders
            </h2>
            <p className={styles.panelSubtitle}>The latest orders and their current status.</p>
          </div>
          <div className={styles.panelBody}>
            <RecentOrders orders={orders.recentOrders ?? []} />
          </div>
        </section>
        <section className={styles.panel} aria-labelledby="upcoming-sessions-heading">
          <div className={styles.panelHeader}>
            <p className={styles.panelEyebrow}>Sessions</p>
            <h2 id="upcoming-sessions-heading" className={styles.sectionTitle}>
              Upcoming Sessions
            </h2>
            <p className={styles.panelSubtitle}>Confirmed and pending sessions scheduled in the next 7 days.</p>
          </div>
          <div className={styles.panelBody}>
            <UpcomingSessions sessions={sessions.upcomingSessions ?? []} />
          </div>
        </section>
      </div>
    </div>
  );
}
