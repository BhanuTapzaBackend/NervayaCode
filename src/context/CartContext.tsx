'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';
import type { Cart } from '@/types/supplement.types';
import type { ItemType } from '@/lib/constants/enums';
import { getCartItemCount } from '@/utils/cart.util';
import { cartApi } from '@/lib/api/cart';
import {
  getGuestCartItems,
  addToGuestCart,
  updateGuestCartItemQuantity,
  removeFromGuestCart,
  guestCartToDisplayCart,
  GUEST_CART_CHANGED_EVENT,
} from '@/utils/guestCart';

export interface AddCartItemParams {
  itemId: string;
  itemType: ItemType;
  quantity: number;
  name: string;
  price: number;
  image?: string;
  /**
   * Only consumed by the guest cart, which has no populated Supplement to read
   * live stock from. Server carts ignore it and use the real stock instead.
   */
  stock?: number;
  metadata?: Record<string, unknown>;
}

interface CartContextType {
  cartCount: number;
  cart: Cart | null;
  cartLoading: boolean;
  refreshCart: () => Promise<void>;
  addItem: (params: AddCartItemParams) => Promise<{ success: boolean; message?: string }>;
  updateItemQuantity: (itemId: string, itemType: ItemType, quantity: number) => Promise<void>;
  removeItem: (itemId: string, itemType: ItemType) => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  cart: null,
  cartLoading: false,
  refreshCart: async () => {},
  addItem: async () => ({ success: false }),
  updateItemQuantity: async () => {},
  removeItem: async () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);

  const loadGuestCart = useCallback(() => {
    const guestItems = getGuestCartItems();
    const guestCart = guestCartToDisplayCart(guestItems);
    setCart(guestCart);
    setCartCount(getCartItemCount(guestCart.items));
    setCartLoading(false);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      loadGuestCart();
      return;
    }

    setCartLoading(true);

    try {
      const response = (await api.get('/cart')) as {
        success: boolean;
        data: unknown;
      };
      if (
        response.success &&
        response.data &&
        typeof response.data === 'object' &&
        'items' in response.data &&
        Array.isArray((response.data as { items: unknown[] }).items)
      ) {
        const nextCart = response.data as Cart;
        setCart(nextCart);
        setCartCount(getCartItemCount(nextCart.items));
      } else {
        setCart(null);
        setCartCount(0);
      }
    } catch {
      setCart(null);
      setCartCount(0);
    } finally {
      setCartLoading(false);
    }
  }, [isAuthenticated, loadGuestCart]);

  useEffect(() => {
    if (!isAuthenticated) {
      loadGuestCart();
      return;
    }
    let cancelled = false;
    const deferCartFetch = () => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(
          () => {
            if (!cancelled) void refreshCart();
          },
          { timeout: 2000 },
        );
      } else {
        setTimeout(() => {
          if (!cancelled) void refreshCart();
        }, 100);
      }
    };
    deferCartFetch();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refreshCart, loadGuestCart]);

  useEffect(() => {
    const handleAuthChange = () => {
      void refreshCart();
    };
    window.addEventListener('auth-state-changed', handleAuthChange);
    return () => window.removeEventListener('auth-state-changed', handleAuthChange);
  }, [refreshCart]);

  useEffect(() => {
    if (isAuthenticated) return;
    const handleGuestCartChange = () => loadGuestCart();
    window.addEventListener(GUEST_CART_CHANGED_EVENT, handleGuestCartChange);
    return () => window.removeEventListener(GUEST_CART_CHANGED_EVENT, handleGuestCartChange);
  }, [isAuthenticated, loadGuestCart]);

  const addItem = useCallback(
    async (params: AddCartItemParams): Promise<{ success: boolean; message?: string }> => {
      if (!isAuthenticated) {
        addToGuestCart(params);
        return { success: true };
      }
      const response = await cartApi.add(
        params.itemId,
        params.quantity,
        params.itemType,
        params.name,
        params.price,
        params.image,
        params.metadata,
      );
      if (response.success) {
        await refreshCart();
        return { success: true };
      }
      return { success: false, message: response.message };
    },
    [isAuthenticated, refreshCart],
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, itemType: ItemType, quantity: number) => {
      if (!isAuthenticated) {
        updateGuestCartItemQuantity(itemId, itemType, quantity);
        return;
      }
      const response = await cartApi.update(itemId, quantity, itemType);
      if (response.success) {
        await refreshCart();
      }
    },
    [isAuthenticated, refreshCart],
  );

  const removeItem = useCallback(
    async (itemId: string, itemType: ItemType) => {
      if (!isAuthenticated) {
        removeFromGuestCart(itemId, itemType);
        return;
      }
      const response = await cartApi.remove(itemId, itemType);
      if (response.success) {
        await refreshCart();
      }
    },
    [isAuthenticated, refreshCart],
  );

  return (
    <CartContext.Provider
      value={{ cartCount, cart, cartLoading, refreshCart, addItem, updateItemQuantity, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
