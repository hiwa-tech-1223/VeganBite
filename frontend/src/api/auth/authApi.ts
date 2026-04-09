// 認証関連のAPI

import { apiFetch } from '../config';

export const authApi = {
  // 現在のユーザー情報を取得
  async getCurrentUser(token: string) {
    const response = await apiFetch('/api/auth/me', {
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
    const response = await apiFetch('/api/auth/logout', {
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
    return '/api/auth/google';
  },

  // 管理者用Google OAuth URLを取得
  getAdminGoogleLoginUrl(): string {
    return '/api/auth/admin/google';
  },
};
