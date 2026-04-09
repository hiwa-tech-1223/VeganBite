import { invokeBackendApi } from './lambda-client';

// サーバーサイド（SSR）ではLambda SDK経由、クライアントサイドではfetchを使用
const isServer = typeof window === 'undefined';

// クライアントサイド用のベースURL（CloudFront経由で自身のAPI Routeに到達）
export const API_BASE_URL = '';

// サーバーサイド・クライアントサイド共通のfetch関数
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  // サーバーサイド: AWS SDK経由でGo Lambdaを直接呼び出し
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

  // クライアントサイド: 通常のfetch（CloudFront → Next.js API Route → Go Lambda）
  return fetch(path, options);
}
