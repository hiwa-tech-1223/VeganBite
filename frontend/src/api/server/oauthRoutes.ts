// Google OAuth のログイン開始・コールバック・ログアウトを Vercel（Next.js）側で扱うルートの実装。
// - ログイン開始: ランダムな state を httpOnly Cookie に保存し、同じ値をバックエンドに渡して Google の認可 URL を得る
// - コールバック: Cookie の state と照合（ログイン CSRF 対策）してからバックエンドに中継し、
//   バックエンドが返すリダイレクト先から JWT を取り出して httpOnly Cookie に保存する（JWT を URL やブラウザの JS に出さない）
// - ログアウト: Cookie を削除する
import { NextRequest, NextResponse } from 'next/server';
import { withOriginVerify } from '@/api/originVerify';
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE_PATH,
  OAUTH_STATE_MAX_AGE_SECONDS,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  authCookieOptions,
  extractTokenFromCallbackLocation,
  generateOAuthState,
  isSameOriginWrite,
  isValidOAuthState,
  resolveRequestOrigin,
} from './authSession';

const BACKEND_URL = process.env.API_URL_INTERNAL || 'http://localhost:8080';

export interface OAuthFlow {
  // バックエンドのログイン開始・コールバックのパス
  backendLoginPath: string;
  backendCallbackPath: string;
  // バックエンドが JWT を載せてリダイレクトしてくるページのパス（ブラウザには返さない）
  callbackPagePath: string;
  // ログイン成功後・失敗時の遷移先
  successPath: string;
  loginPagePath: string;
}

export const CUSTOMER_OAUTH_FLOW: OAuthFlow = {
  backendLoginPath: '/api/auth/google',
  backendCallbackPath: '/api/auth/google/callback',
  callbackPagePath: '/auth/callback',
  successPath: '/',
  loginPagePath: '/login',
};

export const ADMIN_OAUTH_FLOW: OAuthFlow = {
  backendLoginPath: '/api/auth/admin/google',
  backendCallbackPath: '/api/auth/admin/google/callback',
  callbackPagePath: '/admin/auth/callback',
  successPath: '/admin/products',
  loginPagePath: '/admin/login',
};

// 自サイト内への遷移は相対パスで返す（コンテナ内の待ち受けアドレスで絶対 URL を組み立てないため）
function redirectToPath(path: string): NextResponse {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}

function redirectToLoginError(flow: OAuthFlow, error: string): NextResponse {
  return redirectToPath(`${flow.loginPagePath}?error=${encodeURIComponent(error)}`);
}

// Next.js のリクエストから、自サイトのオリジン（CSRF 確認用）を求める
export function originOf(request: NextRequest): string {
  return resolveRequestOrigin(
    {
      forwardedHost: request.headers.get('X-Forwarded-Host'),
      host: request.headers.get('Host'),
      forwardedProto: request.headers.get('X-Forwarded-Proto'),
    },
    request.nextUrl.origin,
  );
}

function clearStateCookie(response: NextResponse): NextResponse {
  response.cookies.set(OAUTH_STATE_COOKIE, '', authCookieOptions(0, OAUTH_STATE_COOKIE_PATH));
  return response;
}

// ログイン開始
export function createLoginStartHandler(flow: OAuthFlow) {
  return async function GET(): Promise<Response> {
    const state = generateOAuthState();

    const backendResponse = await fetch(`${BACKEND_URL}${flow.backendLoginPath}?state=${encodeURIComponent(state)}`, {
      headers: withOriginVerify(),
      redirect: 'manual',
    });
    const location = backendResponse.headers.get('Location');
    if (backendResponse.status < 300 || backendResponse.status >= 400 || !location) {
      console.error(`OAuth login start failed: status=${backendResponse.status}`);
      return redirectToLoginError(flow, 'login_start');
    }

    const response = NextResponse.redirect(location, 307);
    response.cookies.set(
      OAUTH_STATE_COOKIE,
      state,
      authCookieOptions(OAUTH_STATE_MAX_AGE_SECONDS, OAUTH_STATE_COOKIE_PATH),
    );
    return response;
  };
}

// Google からのコールバック
export function createCallbackHandler(flow: OAuthFlow) {
  return async function GET(request: NextRequest): Promise<Response> {
    const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
    const actualState = request.nextUrl.searchParams.get('state');
    if (!isValidOAuthState(expectedState, actualState)) {
      return clearStateCookie(redirectToLoginError(flow, 'invalid_state'));
    }

    const backendResponse = await fetch(`${BACKEND_URL}${flow.backendCallbackPath}${request.nextUrl.search}`, {
      headers: withOriginVerify(),
      redirect: 'manual',
    });
    const location = backendResponse.headers.get('Location');

    const token = extractTokenFromCallbackLocation(location, flow.callbackPagePath);
    if (token) {
      const response = redirectToPath(flow.successPath);
      response.cookies.set(SESSION_COOKIE, token, authCookieOptions(SESSION_MAX_AGE_SECONDS));
      return clearStateCookie(response);
    }

    // BAN・一時停止などバックエンドが返したエラーのリダイレクトはそのまま返す
    if (location && backendResponse.status >= 300 && backendResponse.status < 400) {
      return clearStateCookie(NextResponse.redirect(location, 307));
    }

    console.error(`OAuth callback failed: status=${backendResponse.status}`);
    return clearStateCookie(redirectToLoginError(flow, 'callback'));
  };
}

// ログアウト（顧客・管理者共通）
export async function handleLogout(request: NextRequest): Promise<Response> {
  const sameOrigin = isSameOriginWrite(
    request.method,
    { secFetchSite: request.headers.get('Sec-Fetch-Site'), origin: request.headers.get('Origin') },
    originOf(request),
  );
  if (!sameOrigin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const response = NextResponse.json({ message: 'Logged out successfully' });
  response.cookies.set(SESSION_COOKIE, '', authCookieOptions(0));
  return response;
}
