// カテゴリ管理関連のAPI

import { CategoryFormData } from './categoryTypes';
import { apiFetch } from '../config';

export const categoryApi = {
  async createCategory(data: CategoryFormData, token: string) {
    const response = await apiFetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create category');
    }
    return response.json();
  },

  async updateCategory(id: number, data: CategoryFormData, token: string) {
    const response = await apiFetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update category');
    }
    return response.json();
  },

  async deleteCategory(id: number, token: string) {
    const response = await apiFetch(`/api/categories/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete category');
    }
  },
};
