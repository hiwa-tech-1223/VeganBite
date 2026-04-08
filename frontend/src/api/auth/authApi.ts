// 認証関連のAPI

import { API_BASE_URL } from '../config';

export const authApi = {
  // 現在のユーザー情報を取得
  async getCurrentUser(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  },

  // ログアウト
  async logout(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to logout');
    }

    return response.json();
  },

  // Google OAuth URLを取得
  getGoogleLoginUrl(): string {
    return `${API_BASE_URL}/api/auth/google`;
  },

  // 管理者用Google OAuth URLを取得
  getAdminGoogleLoginUrl(): string {
    return `${API_BASE_URL}/api/auth/admin/google`;
  },
};
