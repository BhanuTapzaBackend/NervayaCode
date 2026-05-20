'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar/LazySidebar';
import PageHeader from '@/components/PageHeader/PageHeader';
import { StatusState } from '@/components/common';
import SupplementCatalog from '@/components/Supplements/SupplementCatalog';
import { Supplement } from '@/types/supplement.types';
import { cartApi } from '@/lib/api/cart';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';
import { ROUTES } from '@/utils/routesConstants';
import styles from './styles.module.css';

interface SupplementsClientProps {
  supplements: Supplement[];
  serverError?: string | null;
}

export default function SupplementsClient({ supplements, serverError = null }: SupplementsClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();

  const handleAddToCart = useCallback(
    async (supplementId: string, quantity: number) => {
      if (!isAuthenticated) {
        router.push(`${ROUTES.LOGIN}?returnUrl=${encodeURIComponent('/supplements')}`);
        return;
      }
      const response = await cartApi.add(supplementId, quantity);
      if (response.success) {
        await refreshCart();
      } else {
        throw new Error('Failed to add to cart');
      }
    },
    [isAuthenticated, router, refreshCart],
  );
  const showFailure = serverError != null;
  const showEmpty = !showFailure && supplements.length === 0;

  return (
    <Sidebar>
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <PageHeader title="Supplements" subtitle="Discover our range of health supplements" />
          {showFailure && (
            <StatusState
              type="error"
              variant="minimal"
              title="Failed to load supplements"
              message={serverError ?? 'Something went wrong'}
              action={
                <Link href="/sleep-supplements" className={styles.retryButton}>
                  Try again
                </Link>
              }
            />
          )}
          {showEmpty && (
            <StatusState
              type="empty"
              variant="minimal"
              title="No supplements available"
              message="There are no supplements to display at the moment."
              action={
                <Link href="/dashboard" className={styles.browseLink}>
                  Back to dashboard
                </Link>
              }
            />
          )}
          {!showFailure && !showEmpty && (
            <SupplementCatalog supplements={supplements} loading={false} onAddToCart={handleAddToCart} />
          )}
        </div>
      </div>
    </Sidebar>
  );
}
