'use client';

import { useEffect, useState } from 'react';
import { deepRestApi } from '@/lib/api/deepRest';
import { configApi } from '@/lib/api/config';
import { DRIFT_OFF_SESSION_PRICE } from '@/lib/constants/driftOff.constants';
import type { IDriftOffOrder, IDriftOffResponse } from '@/types/driftOff.types';

interface DeepRestPaymentInitState {
  isLoading: boolean;
  error: string | null;
  dynamicPrice: number;
  latestPaidOrder: IDriftOffOrder | null;
  pendingResponse: IDriftOffResponse | null;
}

const INITIAL_STATE: DeepRestPaymentInitState = {
  isLoading: true,
  error: null,
  dynamicPrice: DRIFT_OFF_SESSION_PRICE,
  latestPaidOrder: null,
  pendingResponse: null,
};

export function useDeepRestPaymentInit(enabled: boolean): DeepRestPaymentInitState {
  const [state, setState] = useState<DeepRestPaymentInitState>(INITIAL_STATE);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const run = async () => {
      try {
        const [configRes, ordersRes, responsesRes] = await Promise.all([
          configApi.getPublic(),
          deepRestApi.getOrders(1, 10),
          deepRestApi.getResponses(1, 10),
        ]);

        if (cancelled) return;

        const sessionPrice = configRes.data?.driftOffSessionPrice;
        const dynamicPrice =
          configRes.success && typeof sessionPrice === 'number' ? sessionPrice : DRIFT_OFF_SESSION_PRICE;

        const orders = ordersRes.success && ordersRes.data ? ordersRes.data.data : [];
        const responses = responsesRes.success && responsesRes.data ? responsesRes.data.data : [];

        const latestPaidOrder =
          [...orders]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .find((order) => order.paymentStatus === 'paid') ?? null;

        const pendingResponse = latestPaidOrder
          ? (responses.find(
              (r: IDriftOffResponse) => String(r.driftOffOrderId) === String(latestPaidOrder._id) && !r.completedAt,
            ) ?? null)
          : null;

        setState({
          isLoading: false,
          error: null,
          dynamicPrice,
          latestPaidOrder,
          pendingResponse,
        });
      } catch {
        if (cancelled) return;
        setState({
          isLoading: false,
          error: 'Failed to verify status. Please refresh.',
          dynamicPrice: DRIFT_OFF_SESSION_PRICE,
          latestPaidOrder: null,
          pendingResponse: null,
        });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return enabled ? state : { ...INITIAL_STATE, isLoading: false };
}
