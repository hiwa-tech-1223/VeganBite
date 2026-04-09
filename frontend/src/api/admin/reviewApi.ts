// レビュー管理関連のAPI

import { ApiReview } from '../customer/reviewTypes';
import { apiFetch } from '../config';

export const adminReviewApi = {
  // 全レビュー一覧取得
  async getAllReviews(token: string): Promise<ApiReview[]> {
    const response = await apiFetch('/api/reviews', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }
    return response.json();
  },

  // レビューを削除（管理者権限）
  async deleteReview(id: number, token: string): Promise<void> {
    const response = await apiFetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete review');
    }
  },
};
