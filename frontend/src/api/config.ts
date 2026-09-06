const isServer = typeof window === 'undefined';

// サーバーサイド: Go API へ直接リクエスト（Cloud Run の URL、ローカルは 8080）
// クライアントサイド: 未設定なら同一オリジンの /api 中継ルート経由
const SERVER_API_BASE_URL = process.env.API_URL_INTERNAL || 'http://localhost:8080';
const CLIENT_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// サーバーサイド・クライアントサイド共通のfetch関数
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const baseUrl = isServer ? SERVER_API_BASE_URL : CLIENT_API_BASE_URL;
  return fetch(`${baseUrl}${path}`, options);
}

// ブラウザから直接遷移する URL（OAuth ログイン開始など）の組み立て用
export const API_BASE_URL = isServer ? SERVER_API_BASE_URL : CLIENT_API_BASE_URL;
