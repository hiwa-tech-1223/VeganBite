import { invokeBackendApi } from './lambda-client';

const isServer = typeof window === 'undefined';

// サーバーサイド・クライアントサイド共通のfetch関数
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  // AWS環境: Lambda SDK経由でGo Lambdaを直接呼び出し
  if (isServer && process.env.BACKEND_FUNCTION_NAME) {
    const headers: Record<string, string> = {};
    if (options?.headers) {
      const h = options.headers as Record<string, string>;
      if (h['Authorization']) headers['Authorization'] = h['Authorization'];
      if (h['Content-Type']) headers['Content-Type'] = h['Content-Type'];
    }

    return invokeBackendApi(
      options?.method || 'GET',
      path,
      {
        body: options?.body as string | undefined,
        headers,
      }
    );
  }

  // ローカル開発環境: Go APIに直接リクエスト
  const baseUrl = isServer
    ? process.env.API_URL_INTERNAL || 'http://localhost:8080'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  return fetch(`${baseUrl}${path}`, options);
}

// クライアントサイド用のベースURL（後方互換性のため残す）
export const API_BASE_URL = isServer
  ? process.env.API_URL_INTERNAL || 'http://localhost:8080'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
