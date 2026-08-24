'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar/LazySidebar';
import PageHeader from '@/components/PageHeader/PageHeader';
import { StatusState } from '@/components/common';
import SupplementCatalog from '@/components/Supplements/SupplementCatalog';
import { Supplement } from '@/types/supplement.types';
import { useCart } from '@/context/CartContext';
import { ITEM_TYPE } from '@/lib/constants/enums';
import styles from './styles.module.css';

interface SupplementsClientProps {
  supplements: Supplement[];
  serverError?: string | null;
}

export default function SupplementsClient({ supplements, serverError = null }: SupplementsClientProps) {
  const { addItem } = useCart();

  const handleAddToCart = useCallback(
    async (supplementId: string, quantity: number) => {
      const supplement = supplements.find((s) => s._id === supplementId);
      if (!supplement) {
        throw new Error('Failed to add to cart');
      }
      const result = await addItem({
        itemId: supplementId,
        itemType: ITEM_TYPE.SUPPLEMENT,
        quantity,
        name: supplement.name,
        price: supplement.price,
        image: supplement.images?.length ? supplement.images[0] : supplement.image,
        stock: supplement.stock,
      });
      if (!result.success) {
        throw new Error(result.message || 'Failed to add to cart');
      }
    },
    [supplements, addItem],
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
