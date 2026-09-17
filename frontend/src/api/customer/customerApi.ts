// カスタマー関連のAPI

import { apiFetch } from '../config';

export const customerApi = {
  // カスタマーのお気に入り一覧を取得
  async getFavorites(customerId: number) {
    const response = await apiFetch(`/api/customers/${customerId}/favorites`);
    if (!response.ok) {
      throw new Error('Failed to fetch favorites');
    }
    return response.json();
  },

  // お気に入りに追加
  async addFavorite(customerId: number, productId: number) {
    const response = await apiFetch(`/api/customers/${customerId}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId }),
    });
    if (!response.ok) {
      throw new Error('Failed to add favorite');
    }
    return response.json();
  },

  // お気に入りから削除
  async removeFavorite(customerId: number, productId: number) {
    const response = await apiFetch(`/api/customers/${customerId}/favorites/${productId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to remove favorite');
    }
  },

  // カスタマーのレビュー一覧を取得
  async getReviews(customerId: number) {
    const response = await apiFetch(`/api/customers/${customerId}/reviews`);
    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }
    return response.json();
  },
};
