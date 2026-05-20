import api from '@/lib/axios';
import type { PromoCode } from '@/types/supplement.types';

interface ValidateResponse {
  success: boolean;
  data?: { code: string; discountType: string; discountValue: number; valid: boolean };
  message?: string;
}

interface ApplyResponse {
  success: boolean;
  data?: { discount: number; promoCode?: PromoCode };
  message?: string;
}

export const promoApi = {
  validate: async (
    code: string,
  ): Promise<{ code: string; discountType: string; discountValue: number; valid: boolean }> => {
    const response = (await api.post('/promo/validate', { code })) as ValidateResponse;
    if (response.success && response.data) return response.data;
    throw new Error(response.message ?? 'Invalid promo code');
  },

  apply: async (
    code: string,
    cartId: string,
    cartTotal: number,
  ): Promise<{ discount: number; promoCode?: PromoCode }> => {
    const response = (await api.post('/promo/apply', {
      code,
      cartId,
      cartTotal,
    })) as ApplyResponse;
    if (response.success && response.data) return response.data;
    throw new Error(response.message ?? 'Failed to apply promo code');
  },
};
