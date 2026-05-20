import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { ITEM_TYPE } from '@/lib/constants/enums';
import { promoApi } from '@/lib/api/promo';
import type { Cart, Order, ShippingAddress, SavedAddress, Supplement } from '@/types/supplement.types';
import {
  trackBeginCheckout,
  trackAddPaymentInfo,
  trackCouponApplied,
  trackAddShippingInfo,
  trackPurchaseFailed,
  type ItemParams,
} from '@/utils/analytics';

function cartItemsToGaItems(cart: Cart): ItemParams[] {
  return cart.items.map((item) => {
    const isSupplement = item.itemType === ITEM_TYPE.SUPPLEMENT;
    const supplement =
      isSupplement && typeof item.itemId === 'object' && item.itemId !== null && 'name' in item.itemId
        ? (item.itemId as Supplement)
        : null;
    const id = typeof item.itemId === 'object' ? supplement?._id : item.itemId;
    const name = item.name || supplement?.name || String(id);
    return {
      item_id: String(id),
      item_name: name,
      item_category: isSupplement ? 'Supplements' : 'Digital',
      price: item.price,
      quantity: item.quantity,
      currency: 'INR',
      page_type: '/checkout',
    };
  });
}

interface PaymentCreateResponse {
  success: boolean;
  data?: { id: string; key_id: string };
}

interface OrderResponse {
  success: boolean;
  data?: Order;
}

export function useCheckout() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<ShippingAddress | undefined>(undefined);
  const [editingAddress, setEditingAddress] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const isDigitalOnly =
    cart?.items.every((item) => item.itemType === ITEM_TYPE.DRIFT_OFF || item.itemType === ITEM_TYPE.THERAPY) ?? false;

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = (await api.get('/cart')) as { success: boolean; data: Cart };
      if (response.success && response.data) {
        setCart(response.data);
        if (response.data.items.length === 0) {
          router.push('/cart');
        } else {
          trackBeginCheckout({
            currency: 'INR',
            value: response.data.totalAmount,
            item_count: response.data.items.length,
            modules_in_cart: ['supplements'],
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchSavedAddresses = useCallback(async () => {
    try {
      const response = (await api.get('/users/address')) as { success: boolean; data: SavedAddress[] };
      if (response.success && response.data) {
        setSavedAddresses(response.data);
      }
    } catch {
      // Saved addresses fetch failed silently
    }
  }, []);

  useEffect(() => {
    fetchCart();
    fetchSavedAddresses();
  }, [fetchCart, fetchSavedAddresses]);

  const handleAddressSubmit = useCallback(async (address: ShippingAddress, saveAddress: boolean, label: string) => {
    if (saveAddress) {
      try {
        await api.post('/users/address', { ...address, label, isDefault: false });
      } catch {}
    }
    setSelectedAddress(address);
    setIsAddressModalOpen(false);
    setEditingAddress(false);
  }, []);

  const handleAddNewAddress = useCallback(() => {
    setSelectedAddress(undefined);
    setEditingAddress(true);
    setIsAddressModalOpen(true);
  }, []);

  const handleUseAddress = useCallback((addr: SavedAddress) => {
    const { _id, label: _label, isDefault: _isDefault, ...shippingAddr } = addr;
    setSelectedAddress(shippingAddr as ShippingAddress);
    setEditingAddress(false);
    setIsAddressModalOpen(false);
  }, []);

  const handleEditAddress = useCallback(() => {
    setEditingAddress(true);
    setIsAddressModalOpen(true);
  }, []);

  const handleCloseAddressModal = useCallback(() => {
    setIsAddressModalOpen(false);
  }, []);

  const mapPromoErrorMessage = useCallback((message: string): string => {
    if (message.toLowerCase().includes('expired')) return 'This promo code has expired';
    if (message.toLowerCase().includes('usage limit') || message.toLowerCase().includes('exhausted')) {
      return 'This promo code has reached its usage limit';
    }
    if (message.toLowerCase().includes('minimum purchase') || message.toLowerCase().includes('minimum order')) {
      return 'Minimum order amount not met for this code';
    }
    if (message.toLowerCase().includes('invalid')) return 'Invalid promo code';
    return message;
  }, []);

  const handlePromoCodeApply = useCallback(
    async (code: string) => {
      if (!cart?._id) return;
      setPromoLoading(true);
      setPromoError(null);
      try {
        const result = await promoApi.apply(code, cart._id, cart.totalAmount);
        setAppliedPromoCode(code);
        setPromoDiscount(result.discount ?? 0);
        trackCouponApplied({
          coupon_code: code,
          discount_value: result.discount ?? 0,
          value_before: cart.totalAmount,
          value_after: cart.totalAmount - (result.discount ?? 0),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid or expired promo code';
        setPromoError(mapPromoErrorMessage(msg));
        setAppliedPromoCode(null);
        setPromoDiscount(0);
      } finally {
        setPromoLoading(false);
      }
    },
    [cart?._id, cart?.totalAmount, mapPromoErrorMessage],
  );

  const handlePromoCodeRemove = useCallback(() => {
    setAppliedPromoCode(null);
    setPromoDiscount(0);
    setPromoError(null);
  }, []);

  const handleProceedToPayment = useCallback(async () => {
    if (!cart) return;
    if (!isDigitalOnly && !selectedAddress) {
      setError('Please enter your shipping address');
      return;
    }
    setCreatingOrder(true);
    setError(null);
    try {
      if (!isDigitalOnly && selectedAddress) {
        trackAddShippingInfo({
          shipping_country: selectedAddress.country,
          shipping_method: 'standard',
          value: cart.totalAmount - promoDiscount,
          currency: 'INR',
        });
      }
      trackAddPaymentInfo({
        currency: 'INR',
        value: cart.totalAmount - promoDiscount,
        payment_type: 'Razorpay',
        items: cartItemsToGaItems(cart),
        ...(appliedPromoCode ? { coupon: appliedPromoCode } : {}),
      });
      const orderPayload = {
        ...(isDigitalOnly ? {} : { shippingAddress: selectedAddress }),
        ...(appliedPromoCode && { promoCode: appliedPromoCode, promoDiscount }),
      };
      const orderResponse = (await api.post('/orders', orderPayload)) as OrderResponse;
      if (!orderResponse.success || !orderResponse.data) {
        setError('Failed to create order');
        return;
      }
      setOrder(orderResponse.data);
      const paymentResponse = (await api.post('/payments/create-order', {
        orderId: orderResponse.data._id,
        amount: orderResponse.data.totalAmount,
      })) as PaymentCreateResponse;
      if (paymentResponse.success && paymentResponse.data) {
        setRazorpayOrderId(paymentResponse.data.id);
        if (paymentResponse.data.key_id) setRazorpayKeyId(paymentResponse.data.key_id);
      } else {
        trackPurchaseFailed({
          error_code: 'PAYMENT_INIT_FAILED',
          payment_method: 'Razorpay',
          value: cart.totalAmount - promoDiscount,
          currency: 'INR',
        });
        setError('Failed to initialize payment');
      }
    } catch (err) {
      trackPurchaseFailed({
        error_code: 'ORDER_CREATION_FAILED',
        payment_method: 'Razorpay',
        value: cart ? cart.totalAmount - promoDiscount : 0,
        currency: 'INR',
      });
      setError(err instanceof Error ? err.message : 'Failed to process order');
    } finally {
      setCreatingOrder(false);
    }
  }, [cart, selectedAddress, appliedPromoCode, promoDiscount, isDigitalOnly]);

  return {
    cart,
    order,
    loading,
    error,
    creatingOrder,
    savedAddresses,
    selectedAddress,
    editingAddress,
    isAddressModalOpen,
    setIsAddressModalOpen,
    handleCloseAddressModal,
    handleAddNewAddress,
    handleAddressSubmit,
    handleUseAddress,
    handleEditAddress,
    promoCode,
    setPromoCode,
    appliedPromoCode,
    promoDiscount,
    promoLoading,
    promoError,
    handlePromoCodeApply,
    handlePromoCodeRemove,
    handleProceedToPayment,
    razorpayOrderId,
    razorpayKeyId,
    isDigitalOnly,
  };
}
