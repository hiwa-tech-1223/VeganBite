import { checkBotId } from 'botid/server';
import { NextRequest, NextResponse } from 'next/server';
import { withOriginVerify } from '@/api/originVerify';

// 中継先の Go API（Cloud Run の URL、ローカルは 8080）
const BACKEND_URL = process.env.API_URL_INTERNAL || 'http://localhost:8080';

// BotID で検証する書き込み系メソッド。src/instrumentation-client.ts の protect と揃えること
const BOT_PROTECTED_METHODS = new Set(['POST', 'PUT', 'DELETE']);

// 中継ルートはキャッシュせず毎回バックエンドへ転送する
export const dynamic = 'force-dynamic';

// ブラウザからのAPIリクエストをGo APIに中継する
async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }): Promise<Response> {
  // 書き込み系は Bot を弾いてからバックエンドへ送る（ローカル開発では常に isBot: false）
  if (BOT_PROTECTED_METHODS.has(request.method)) {
    const verification = await checkBotId();
    if (verification.isBot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  const { path } = await params;
  const url = new URL(request.url);
  const targetUrl = `${BACKEND_URL}/api/${path.join('/')}${url.search}`;

  const headers: Record<string, string> = {};
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
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

  return new Response(await response.text(), {
    status: response.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
