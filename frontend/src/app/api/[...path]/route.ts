import { checkBotId } from 'botid/server';
import { NextRequest, NextResponse } from 'next/server';
import { withOriginVerify } from '@/api/originVerify';
import { SESSION_COOKIE, authCookieOptions, isSameOriginWrite } from '@/api/server/authSession';
import { originOf } from '@/api/server/oauthRoutes';

// 中継先の Go API（Cloud Run の URL、ローカルは 8080）
const BACKEND_URL = process.env.API_URL_INTERNAL || 'http://localhost:8080';

// BotID で検証する書き込み系メソッド。src/instrumentation-client.ts の protect と揃えること
const BOT_PROTECTED_METHODS = new Set(['POST', 'PUT', 'DELETE']);

// 本文を持てない HTTP ステータス
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

// 中継ルートはキャッシュせず毎回バックエンドへ転送する
export const dynamic = 'force-dynamic';

// ブラウザからのAPIリクエストをGo APIに中継する
async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }): Promise<Response> {
  // 認証は Cookie で自動送信されるため、他サイトから送らせた書き込みを拒否する（CSRF 対策）
  const sameOrigin = isSameOriginWrite(
    request.method,
    { secFetchSite: request.headers.get('Sec-Fetch-Site'), origin: request.headers.get('Origin') },
    originOf(request),
  );
  if (!sameOrigin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  // 書き込み系は Bot を弾いてからバックエンドへ送る（ローカル開発では常に isBot: false）
  if (BOT_PROTECTED_METHODS.has(request.method)) {
    const verification = await checkBotId();
    if (verification.isBot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  const { path } = await params;

  // 未ログイン（セッション Cookie なし）のユーザー情報取得はバックエンドを呼ばずに返す。
  // 全ページの読み込み時に呼ばれるため、未ログインの訪問で Cloud Run を起動させない
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken && path.join('/') === 'auth/me') {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }
  const url = new URL(request.url);
  const targetUrl = `${BACKEND_URL}/api/${path.join('/')}${url.search}`;

  const headers: Record<string, string> = {};
  // JWT は httpOnly Cookie から取り出してバックエンドに渡す（ブラウザの JS はトークンを持たない）
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }
  const contentType = request.headers.get('Content-Type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const body = request.method !== 'GET' && request.method !== 'HEAD'
    ? await request.text()
    : undefined;

  // リダイレクトは追従せず、そのままブラウザに返す（OAuth の Google 遷移など）
  // 共有シークレットを付け、Go 側で Vercel 経由のリクエストだと照合できるようにする
  const response = await fetch(targetUrl, {
    method: request.method,
    headers: withOriginVerify(headers),
    body,
    redirect: 'manual',
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('Location');
    if (location) {
      return NextResponse.redirect(location, response.status);
    }
  }

  const responseHeaders = new Headers();
  const responseContentType = response.headers.get('Content-Type');
  if (responseContentType) {
    responseHeaders.set('Content-Type', responseContentType);
  }

  // 204 / 205 / 304 は本文を持てないため、本文を付けずに返す（空文字でも Response の生成が例外になる）
  const responseBody = NULL_BODY_STATUSES.has(response.status) ? null : await response.text();
  const proxied = new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
  // 期限切れ・無効なトークンの Cookie は残しておいても使えないので削除する
  if (sessionToken && response.status === 401) {
    proxied.cookies.set(SESSION_COOKIE, '', authCookieOptions(0));
  }
  return proxied;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
