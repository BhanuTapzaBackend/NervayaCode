import { useCallback, useEffect, useRef } from 'react';
import type { RazorpayPaymentResponse, RazorpayOptions } from '@/types/payment.types';

const openedRazorpayOrderIds = new Set<string>();

interface UseRazorpayCheckoutParams {
  razorpayKeyId: string;
  razorpayOrderId: string;
  amount: number;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (response: RazorpayPaymentResponse) => void;
  onError?: (message: string) => void;
  onDismiss?: () => void;
  autoOpen?: boolean;
}

export function useRazorpayCheckout({
  razorpayKeyId,
  razorpayOrderId,
  amount,
  name = 'Nervaya',
  description = '',
  prefill,
  onSuccess,
  onError,
  onDismiss,
  autoOpen = false,
}: UseRazorpayCheckoutParams) {
  const hasOpened = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onDismissRef.current = onDismiss;
  }, [onSuccess, onError, onDismiss]);

  const openPaymentModal = useCallback(() => {
    if (!window.Razorpay) {
      onErrorRef.current?.('Razorpay SDK not loaded');
      return;
    }
    if (openedRazorpayOrderIds.has(razorpayOrderId)) return;
    if (hasOpened.current) return;
    hasOpened.current = true;
    openedRazorpayOrderIds.add(razorpayOrderId);
    let paymentSucceeded = false;

    const options: RazorpayOptions = {
      key: razorpayKeyId,
      amount: Math.round(amount * 100),
      currency: 'INR',
      name,
      description,
      order_id: razorpayOrderId,
      handler: (response: RazorpayPaymentResponse) => {
        paymentSucceeded = true;
        onSuccessRef.current(response);
      },
      prefill: {
        name: prefill?.name || '',
        email: prefill?.email || '',
        contact: prefill?.contact || '',
      },
      theme: { color: 'var(--color-accent)' },
      modal: {
        ondismiss: () => {
          hasOpened.current = false;
          openedRazorpayOrderIds.delete(razorpayOrderId);
          if (!paymentSucceeded) {
            onDismissRef.current?.();
          }
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }, [razorpayKeyId, amount, name, description, razorpayOrderId, prefill]);

  useEffect(() => {
    if (autoOpen && window.Razorpay && razorpayOrderId) {
      openPaymentModal();
    }
  }, [autoOpen, razorpayOrderId, openPaymentModal]);

  return { openPaymentModal };
}
