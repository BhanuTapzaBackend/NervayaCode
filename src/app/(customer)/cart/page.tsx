'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar/LazySidebar';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import PageHeader from '@/components/PageHeader/PageHeader';
import { CartItem as CartItemType, Supplement } from '@/types/supplement.types';
import CartItem from '@/components/Cart/CartItem';
import CartSummary from '@/components/Cart/CartSummary';
import Pagination from '@/components/common/Pagination';
import { ITEM_TYPE, type ItemType } from '@/lib/constants/enums';
import { PAGE_SIZE_3 } from '@/lib/constants/pagination.constants';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/routesConstants';
import StatusState from '@/components/common/StatusState';
import styles from './styles.module.css';
import { DRIFT_OFF_SESSION_IMAGE } from '@/lib/constants/driftOff.constants';
import { trackRemoveFromCart } from '@/utils/analytics';
import { cartItemsToGaItems } from '@/utils/ga-items.util';

export default function CartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { cart, addItem, updateItemQuantity, removeItem, refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  const hasInitialized = useRef(false);

  // We no longer use showLoader() for the initial page load to keep it 'inside the page'

  const initializeCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams(window.location.search);
      const addItemId = params.get('addItemId');
      const itemType = params.get('itemType') as ItemType | null;
      const isValidAutoAddType = itemType === ITEM_TYPE.DRIFT_OFF || itemType === ITEM_TYPE.SUPPLEMENT;

      if (addItemId && isValidAutoAddType) {
        const result =
          itemType === ITEM_TYPE.DRIFT_OFF
            ? await addItem({
                itemId: addItemId,
                itemType: ITEM_TYPE.DRIFT_OFF,
                quantity: 1,
                name: 'Deep Rest Session',
                price: 999,
                image: DRIFT_OFF_SESSION_IMAGE,
              })
            : await addItem({ itemId: addItemId, itemType: ITEM_TYPE.SUPPLEMENT, quantity: 1, name: '', price: 0 });

        if (!result.success) {
          throw new Error(result.message || 'Failed to add item to cart');
        }

        params.delete('addItemId');
        params.delete('itemType');
        const search = params.toString();
        const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}`;
        window.history.replaceState(window.history.state, '', nextUrl);
      } else {
        await refreshCart();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [addItem, refreshCart]);

  const handleQuantityChange = async (itemId: string, quantity: number, itemType: ItemType) => {
    setUpdating(true);
    try {
      setError(null);
      await updateItemQuantity(itemId, itemType, quantity);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update cart';
      setError(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async (itemId: string, itemType: ItemType) => {
    setUpdating(true);
    try {
      setError(null);
      // Captured before the removal, while the item is still in the cart.
      const removed = cart?.items.find(
        (item) => String(typeof item.itemId === 'object' ? item.itemId?._id : item.itemId) === itemId,
      );
      await removeItem(itemId, itemType);
      if (cart && removed) {
        trackRemoveFromCart({
          currency: 'INR',
          value: removed.price * removed.quantity,
          items: cartItemsToGaItems({ ...cart, items: [removed] }, '/cart'),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove item';
      setError(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?returnUrl=${encodeURIComponent('/checkout')}`);
      return;
    }
    router.push('/checkout');
  };

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;
    void initializeCart();
  }, [initializeCart]);
  const total = cart?.items.length || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE_3));
  const start = (page - 1) * PAGE_SIZE_3;
  const paginatedItems = cart?.items.slice(start, start + PAGE_SIZE_3) || [];

  return (
    <Sidebar>
      <div className={styles.container}>
        <PageHeader title="Shopping Cart" />

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <GlobalLoader label="Loading your cart..." />
        ) : !cart || total === 0 ? (
          <StatusState
            type="empty"
            title="Your cart is empty"
            message="Add some supplements to get started on your wellness journey!"
            action={
              <>
                <button onClick={() => router.push('/supplements')} className={styles.shopButton}>
                  Shop Supplements
                </button>
                <button onClick={() => router.push('/deep-rest')} className={styles.shopButton}>
                  Try Deep Rest
                </button>
              </>
            }
          />
        ) : (
          <div className={styles.content}>
            <ul className={styles.itemsSection} aria-label="Cart items">
              {paginatedItems.map((item: CartItemType) => {
                const isSupp = item.itemType === ITEM_TYPE.SUPPLEMENT;
                const supp = isSupp && typeof item.itemId === 'object' ? (item.itemId as Supplement) : null;
                const key = `${item.itemType}-${supp ? supp._id : String(item.itemId)}`;

                return (
                  <li key={key}>
                    <CartItem
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemove}
                      disabled={updating}
                    />
                  </li>
                );
              })}
            </ul>
            <div className={styles.summarySection}>
              <CartSummary cart={cart} onCheckout={handleCheckout} loading={updating} />
            </div>
          </div>
        )}

        {total > 0 && !loading && (
          <div className={styles.paginationWrap}>
            <Pagination total={total} page={page} limit={PAGE_SIZE_3} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </Sidebar>
  );
}
