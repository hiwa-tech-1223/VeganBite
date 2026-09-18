import { withOriginVerify } from './originVerify';

const isServer = typeof window === 'undefined';

// サーバーサイド: Go API へ直接リクエスト（Cloud Run の URL、ローカルは 8080）
// クライアントサイド: 常に同一オリジンの /api 中継ルート経由。
// 認証は httpOnly Cookie を中継ルートが Authorization ヘッダーに詰め替える方式のため、
// ブラウザから Go に直接リクエストすると常に未ログイン扱いになる（本番・ローカル共通）
const SERVER_API_BASE_URL = process.env.API_URL_INTERNAL || 'http://localhost:8080';
const CLIENT_API_BASE_URL = '';

// サーバーサイド・クライアントサイド共通のfetch関数
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  if (isServer) {
    // SSR / ISR からの直接呼び出しにも共有シークレットを付ける（Go 側で Vercel 経由かを照合する）
    return fetch(`${SERVER_API_BASE_URL}${path}`, {
      ...options,
      headers: withOriginVerify(options?.headers),
    });
  }
  return fetch(`${CLIENT_API_BASE_URL}${path}`, options);
}

// ブラウザから直接遷移する URL（OAuth ログイン開始など）の組み立て用
export const API_BASE_URL = isServer ? SERVER_API_BASE_URL : CLIENT_API_BASE_URL;
