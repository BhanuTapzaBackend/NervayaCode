import api from '@/lib/axios';
import type { Review, ReviewsResponse } from '@/types/supplement.types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ReviewableItem {
  itemId: string;
  itemType: string;
  name: string;
  image: string;
  orderId: string;
  orderDate: string;
}

export const reviewsApi = {
  getByProductId: (productId: string, page = 1, limit = 10): Promise<ApiResponse<ReviewsResponse>> => {
    return api.get(`/supplements/${productId}/reviews`, {
      params: { page, limit },
    }) as Promise<ApiResponse<ReviewsResponse>>;
  },

  create: (productId: string, rating: number, comment?: string, itemType?: string): Promise<ApiResponse<Review>> => {
    return api.post('/reviews', {
      productId,
      rating,
      comment: comment ?? '',
      itemType: itemType ?? 'Supplement',
    }) as Promise<ApiResponse<Review>>;
  },

  getReviewableItems: (): Promise<ApiResponse<ReviewableItem[]>> => {
    return api.get('/reviews/reviewable-items') as Promise<ApiResponse<ReviewableItem[]>>;
  },

  getByItemType: (itemType: string, itemId: string, page = 1, limit = 20): Promise<ApiResponse<ReviewsResponse>> => {
    return api.get(`/reviews/${itemType}/${itemId}`, {
      params: { page, limit },
    }) as Promise<ApiResponse<ReviewsResponse>>;
  },
};
