// 商品関連のAPI

import { ApiCategory, ApiProduct } from './productTypes';
import { apiFetch } from '../config';

export const productApi = {
  // カテゴリ一覧を取得
  async getCategories(): Promise<ApiCategory[]> {
    const response = await apiFetch('/api/categories');
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return response.json();
  },

  // 商品一覧を取得
  async getProducts(params?: { category?: number; search?: string }): Promise<ApiProduct[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) {
      searchParams.append('category', params.category.toString());
    }
    if (params?.search) {
      searchParams.append('search', params.search);
    }

    const queryString = searchParams.toString();
    const url = `/api/products${queryString ? `?${queryString}` : ''}`;

    const response = await apiFetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return response.json();
  },

  // 商品詳細を取得
  async getProduct(id: number): Promise<ApiProduct> {
    const response = await apiFetch(`/api/products/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    return response.json();
  },
};
