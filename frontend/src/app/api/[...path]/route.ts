import { NextRequest } from 'next/server';
import { invokeBackendApi } from '@/api/lambda-client';

// ブラウザからのAPIリクエストをGo Lambdaに中継する
async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiPath = '/api/' + path.join('/');
  const url = new URL(request.url);
  const queryString = url.search;
  const fullPath = apiPath + queryString;

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

  const response = await invokeBackendApi(request.method, fullPath, {
    body,
    headers,
  });

  return response;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
