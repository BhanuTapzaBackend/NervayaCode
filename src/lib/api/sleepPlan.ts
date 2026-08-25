import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';
import type { Order } from '@/types/supplement.types';

export type PlanServiceKey = 'SUPPLEMENT' | 'THERAPY' | 'GUIDED_AUDIO';

export interface PlanLine {
  service: PlanServiceKey;
  itemType: string;
  name: string;
  unitPrice: number;
  image: string;
  itemId?: string;
}

export interface PlanPricing {
  lines: PlanLine[];
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  total: number;
}

export interface PlanCheckoutBody {
  services: PlanServiceKey[];
  /** Required when the plan includes THERAPY. */
  therapy?: { therapistId: string; date: string; slot: string };
}

export const sleepPlanApi = {
  /** Server-priced quote. Deliberately takes no prices — only which services. */
  getQuote: (services: PlanServiceKey[]): Promise<ApiResponse<PlanPricing>> =>
    api.get(`/sleep-plan/quote?services=${services.join(',')}`) as Promise<ApiResponse<PlanPricing>>,

  /** Creates the pending plan order and holds the therapy slot. */
  checkout: (body: PlanCheckoutBody): Promise<ApiResponse<{ order: Order; pricing: PlanPricing }>> =>
    api.post('/sleep-plan/checkout', body) as Promise<ApiResponse<{ order: Order; pricing: PlanPricing }>>,
};
