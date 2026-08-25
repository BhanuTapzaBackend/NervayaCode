'use client';

import { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { deepRestApi } from '@/lib/api/deepRest';
import type { PaymentSuccessDetails } from '@/components/DeepRest/PaymentSuccessScreen';

interface DeepRestPaymentState {
  deepRestOrderId: string | null;
  razorpayOrderId: string | null;
  razorpayKeyId: string | null;
  isCreating: boolean;
  isVerifying: boolean;
  error: string | null;
  showPaymentHandler: boolean;
  /** Set only for the fixed test customer, whose order settled without Razorpay. */
  bypassSuccess: PaymentSuccessDetails | null;
}

export function useDeepRestPayment() {
  const [state, setState] = useState<DeepRestPaymentState>({
    deepRestOrderId: null,
    razorpayOrderId: null,
    razorpayKeyId: null,
    isCreating: false,
    isVerifying: false,
    error: null,
    showPaymentHandler: false,
    bypassSuccess: null,
  });

  const initiatePayment = useCallback(async () => {
    setState((prev) => ({ ...prev, isCreating: true, error: null }));
    try {
      const orderRes = await deepRestApi.createOrder();

      if (!orderRes.success || !orderRes.data) {
        const errorMsg = orderRes.message || 'Failed to create order';
        setState((prev) => ({
          ...prev,
          isCreating: false,
          error: `${errorMsg}. Please try again or contact support if the issue persists.`,
        }));
        return;
      }

      const deepRestOrderId = orderRes.data._id;

      const razorpayRes = await deepRestApi.createRazorpayOrder(deepRestOrderId);

      if (!razorpayRes.success || !razorpayRes.data) {
        const errorMsg = razorpayRes.message || 'Failed to initialize payment';
        setState((prev) => ({
          ...prev,
          isCreating: false,
          error: `${errorMsg}. Please try again or contact support if the issue persists.`,
        }));
        return;
      }

      // Test customer: the server already settled the order, so never mount the
      // Razorpay handler — hand the success details straight to the page.
      if (razorpayRes.data.bypassed) {
        setState({
          deepRestOrderId,
          razorpayOrderId: razorpayRes.data.id,
          razorpayKeyId: null,
          isCreating: false,
          isVerifying: false,
          error: null,
          showPaymentHandler: false,
          bypassSuccess: {
            paymentId: razorpayRes.data.id,
            razorpayOrderId: razorpayRes.data.id,
            orderId: deepRestOrderId,
            amount: orderRes.data.amount,
            date: new Date(),
          },
        });
        return;
      }

      setState({
        deepRestOrderId,
        razorpayOrderId: razorpayRes.data.id,
        razorpayKeyId: razorpayRes.data.key_id ?? null,
        isCreating: false,
        isVerifying: false,
        error: null,
        showPaymentHandler: true,
        bypassSuccess: null,
      });
    } catch (err) {
      let msg = 'Failed to process payment';

      if (err instanceof Error) {
        if (err.message.includes('receipt')) {
          msg = 'Payment system configuration error. Please try again in a few moments.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          msg = 'Network connection issue. Please check your internet connection and try again.';
        } else {
          msg = err.message;
        }
      }

      setState((prev) => ({
        ...prev,
        isCreating: false,
        error: `${msg}. Please try again or contact support if the issue persists.`,
      }));
    }
  }, []);
  const handleVerifyStart = useCallback(() => {
    flushSync(() => {
      setState((prev) => ({ ...prev, isVerifying: true, showPaymentHandler: false }));
    });
  }, []);

  const handleVerifyComplete = useCallback(() => {
    setState((prev) => ({ ...prev, isVerifying: false }));
  }, []);

  const handlePaymentError = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      showPaymentHandler: false,
      isVerifying: false,
      error: message === 'Payment cancelled' ? null : message,
    }));
  }, []);

  return { ...state, initiatePayment, handleVerifyStart, handleVerifyComplete, handlePaymentError };
}
