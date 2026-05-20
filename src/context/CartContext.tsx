'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';
import type { Cart } from '@/types/supplement.types';
import { getCartItemCount } from '@/utils/cart.util';

interface CartContextType {
  cartCount: number;
  cart: Cart | null;
  cartLoading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  cart: null,
  cartLoading: false,
  refreshCart: async () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setCartCount(0);
      setCartLoading(false);
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
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated, refreshCart]);

  useEffect(() => {
    const handleAuthChange = () => {
      void refreshCart();
    };
    window.addEventListener('auth-state-changed', handleAuthChange);
    return () => window.removeEventListener('auth-state-changed', handleAuthChange);
  }, [refreshCart]);

  const displayCount = isAuthenticated ? cartCount : 0;
  return (
    <CartContext.Provider value={{ cartCount: displayCount, cart, cartLoading, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
