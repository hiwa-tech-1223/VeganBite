// 認証関連のAPI
// 認証は httpOnly Cookie（同一オリジンの /api 中継ルートが Authorization ヘッダーに詰め替える）で行うため、
// ブラウザ側のコードはトークンを扱わない

import { apiFetch, API_BASE_URL } from '../config';

export const authApi = {
  // 現在のユーザー情報を取得（未ログイン・無効なセッションなら null）
  async getCurrentUser() {
    const response = await apiFetch('/api/auth/me');

    if (!response.ok) {
      return null;
    }

    return response.json();
  },

  // ログアウト（セッション Cookie を削除する）
  async logout() {
    const response = await apiFetch('/api/auth/logout', {
      method: 'POST',
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
