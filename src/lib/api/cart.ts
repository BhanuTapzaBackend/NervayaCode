import api from '@/lib/axios';
import type { Cart } from '@/types/supplement.types';
import { ITEM_TYPE, type ItemType } from '@/lib/constants/enums';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const cartApi = {
  get: (): Promise<ApiResponse<Cart>> => {
    return api.get('/cart') as Promise<ApiResponse<Cart>>;
  },

  add: (
    itemId: string,
    quantity: number,
    itemType: ItemType = ITEM_TYPE.SUPPLEMENT,
    name?: string,
    price?: number,
    image?: string,
    metadata?: Record<string, unknown>,
  ): Promise<ApiResponse<Cart>> => {
    return api.post('/cart', { itemId, quantity, itemType, name, price, image, metadata }) as Promise<
      ApiResponse<Cart>
    >;
  },

  update: (itemId: string, quantity: number, itemType: ItemType = ITEM_TYPE.SUPPLEMENT): Promise<ApiResponse<Cart>> => {
    return api.put('/cart', { itemId, quantity, itemType }) as Promise<ApiResponse<Cart>>;
  },

  remove: (itemId: string, itemType: ItemType = ITEM_TYPE.SUPPLEMENT): Promise<ApiResponse<Cart>> => {
    return api.delete(`/cart?itemId=${itemId}&itemType=${itemType}`) as Promise<ApiResponse<Cart>>;
  },
};
