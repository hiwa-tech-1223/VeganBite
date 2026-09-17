// 認証セッション（httpOnly Cookie）と OAuth の state を扱うサーバー専用の処理。
// ブラウザ向けのコードから import しないこと（node:crypto を使う）。
import { randomBytes, timingSafeEqual } from 'crypto';

// JWT を保存する Cookie。JavaScript から読めない httpOnly にし、XSS でトークンを盗まれないようにする
export const SESSION_COOKIE = 'vb_session';
// OAuth のログイン CSRF 対策用に、ログイン開始時の state を保存する Cookie
export const OAUTH_STATE_COOKIE = 'vb_oauth_state';

// バックエンドが発行する JWT の有効期限（24 時間）に合わせる
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;
// Google の同意画面から戻るまでの猶予
export const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
// state の Cookie はコールバックでしか使わないので送信範囲を絞る
export const OAUTH_STATE_COOKIE_PATH = '/api/auth';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface AuthCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
}

// 推測できないランダムな state を生成する（32 バイト → base64url で 43 文字）
export function generateOAuthState(): string {
  return randomBytes(32).toString('base64url');
}

// Cookie に保存した state とコールバックで戻ってきた state を定数時間で比較する
export function isValidOAuthState(expected: string | undefined, actual: string | null): boolean {
  if (!expected || !actual) {
    return false;
  }
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

// バックエンドのコールバックが返すリダイレクト先（<frontend>/auth/callback?token=...）から JWT を取り出す。
// 想定したパス以外（エラー時の /login?error=... など）では null を返す
export function extractTokenFromCallbackLocation(location: string | null, callbackPagePath: string): string | null {
  if (!location) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(location);
  } catch {
    return null;
  }
  if (url.pathname !== callbackPagePath) {
    return null;
  }
  const token = url.searchParams.get('token');
  return token ? token : null;
}

// 認証用 Cookie の属性。SameSite=Lax で他サイトからの POST などに Cookie が付かないようにする。
// ローカル開発（http）では Secure を外す
export function authCookieOptions(
  maxAge: number,
  path = '/',
  isProduction: boolean = process.env.NODE_ENV === 'production',
): AuthCookieOptions {
  return { httpOnly: true, secure: isProduction, sameSite: 'lax', path, maxAge };
}

// Cookie 認証で自動送信される書き込み系リクエストが、自サイトのページから送られたものかを判定する（CSRF 対策）。
// ブラウザが付与する Sec-Fetch-Site を優先し、無い古いブラウザでは Origin を自サイトと比較する。
// どちらも無いリクエストはブラウザ以外（被害者の Cookie を持たない）とみなして許可する
export function isSameOriginWrite(
  method: string,
  headers: { secFetchSite: string | null; origin: string | null },
  requestOrigin: string,
): boolean {
  if (!WRITE_METHODS.has(method.toUpperCase())) {
    return true;
  }
  if (headers.secFetchSite) {
    return headers.secFetchSite === 'same-origin';
  }
  if (headers.origin) {
    return headers.origin === requestOrigin;
  }
  return true;
}

// リクエストを受けた自サイトのオリジン。コンテナ内の待ち受けアドレス（0.0.0.0 など）ではなく、
// ブラウザが実際にアクセスしたホスト（プロキシ経由なら X-Forwarded-Host）から組み立てる
export function resolveRequestOrigin(
  headers: { forwardedHost: string | null; host: string | null; forwardedProto: string | null },
  fallbackOrigin: string,
): string {
  const host = headers.forwardedHost?.split(',')[0]?.trim() || headers.host;
  if (!host) {
    return fallbackOrigin;
  }
  const proto = headers.forwardedProto?.split(',')[0]?.trim() || new URL(fallbackOrigin).protocol.replace(':', '');
  return `${proto}://${host}`;
}
