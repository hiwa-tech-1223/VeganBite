import {
  authCookieOptions,
  extractTokenFromCallbackLocation,
  generateOAuthState,
  isSameOriginWrite,
  isValidOAuthState,
  resolveRequestOrigin,
} from './authSession';

describe('generateOAuthState', () => {
  it('バックエンドが受け付ける形式（base64url、32〜128 文字）で生成する', () => {
    const state = generateOAuthState();
    expect(state).toMatch(/^[A-Za-z0-9_-]{32,128}$/);
  });

  it('毎回異なる値を生成する', () => {
    const states = new Set(Array.from({ length: 50 }, () => generateOAuthState()));
    expect(states.size).toBe(50);
  });
});

describe('isValidOAuthState', () => {
  const state = generateOAuthState();

  it('一致すれば true', () => {
    expect(isValidOAuthState(state, state)).toBe(true);
  });

  it('一致しなければ false', () => {
    expect(isValidOAuthState(state, generateOAuthState())).toBe(false);
  });

  it('Cookie が無ければ false（ログイン開始を経ていないコールバック）', () => {
    expect(isValidOAuthState(undefined, state)).toBe(false);
  });

  it('クエリに state が無ければ false', () => {
    expect(isValidOAuthState(state, null)).toBe(false);
  });

  it('長さが違っても例外を投げずに false', () => {
    expect(isValidOAuthState(state, state.slice(0, 10))).toBe(false);
  });
});

describe('extractTokenFromCallbackLocation', () => {
  it('コールバックページへのリダイレクトから JWT を取り出す', () => {
    const location = 'https://veganbite-dev.vercel.app/auth/callback?token=header.payload.sig';
    expect(extractTokenFromCallbackLocation(location, '/auth/callback')).toBe('header.payload.sig');
  });

  it('エラー時のリダイレクト（/login?error=...）では null', () => {
    const location = 'https://veganbite-dev.vercel.app/login?error=banned';
    expect(extractTokenFromCallbackLocation(location, '/auth/callback')).toBeNull();
  });

  it('管理者用と顧客用のパスを取り違えない', () => {
    const location = 'https://veganbite-dev.vercel.app/admin/auth/callback?token=t';
    expect(extractTokenFromCallbackLocation(location, '/auth/callback')).toBeNull();
    expect(extractTokenFromCallbackLocation(location, '/admin/auth/callback')).toBe('t');
  });

  it('token が空なら null', () => {
    expect(extractTokenFromCallbackLocation('https://x.example/auth/callback?token=', '/auth/callback')).toBeNull();
  });

  it('Location が無い、または URL として不正なら null', () => {
    expect(extractTokenFromCallbackLocation(null, '/auth/callback')).toBeNull();
    expect(extractTokenFromCallbackLocation('not a url', '/auth/callback')).toBeNull();
  });
});

describe('authCookieOptions', () => {
  it('本番では httpOnly / Secure / SameSite=Lax', () => {
    expect(authCookieOptions(60, '/', true)).toEqual({ httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 });
  });

  it('ローカル開発では Secure を外す', () => {
    expect(authCookieOptions(60, '/api/auth', false).secure).toBe(false);
  });
});

describe('isSameOriginWrite', () => {
  const origin = 'https://veganbite-dev.vercel.app';

  it('読み取り系メソッドは常に許可', () => {
    expect(isSameOriginWrite('GET', { secFetchSite: 'cross-site', origin: 'https://evil.example' }, origin)).toBe(true);
  });

  it('Sec-Fetch-Site が same-origin なら許可', () => {
    expect(isSameOriginWrite('POST', { secFetchSite: 'same-origin', origin }, origin)).toBe(true);
  });

  it('Sec-Fetch-Site が cross-site なら拒否', () => {
    expect(isSameOriginWrite('DELETE', { secFetchSite: 'cross-site', origin: 'https://evil.example' }, origin)).toBe(false);
  });

  it('Sec-Fetch-Site が same-site（別サブドメイン）でも拒否', () => {
    expect(isSameOriginWrite('PUT', { secFetchSite: 'same-site', origin: 'https://other.vercel.app' }, origin)).toBe(false);
  });

  it('Sec-Fetch-Site が無い古いブラウザでは Origin を比較する', () => {
    expect(isSameOriginWrite('POST', { secFetchSite: null, origin }, origin)).toBe(true);
    expect(isSameOriginWrite('POST', { secFetchSite: null, origin: 'https://evil.example' }, origin)).toBe(false);
  });

  it('どちらのヘッダーも無いリクエスト（ブラウザ以外）は許可', () => {
    expect(isSameOriginWrite('POST', { secFetchSite: null, origin: null }, origin)).toBe(true);
  });
});

describe('resolveRequestOrigin', () => {
  it('Vercel などのプロキシ経由では X-Forwarded-Host と X-Forwarded-Proto を使う', () => {
    expect(
      resolveRequestOrigin(
        { forwardedHost: 'veganbite-dev.vercel.app', host: 'internal:3000', forwardedProto: 'https' },
        'http://0.0.0.0:3000',
      ),
    ).toBe('https://veganbite-dev.vercel.app');
  });

  it('プロキシが無ければ Host ヘッダーと待ち受け側のプロトコルを使う（コンテナの 0.0.0.0 にしない）', () => {
    expect(
      resolveRequestOrigin({ forwardedHost: null, host: 'localhost:3000', forwardedProto: null }, 'http://0.0.0.0:3000'),
    ).toBe('http://localhost:3000');
  });

  it('複数値が入っていれば先頭を使う', () => {
    expect(
      resolveRequestOrigin(
        { forwardedHost: 'a.example, b.example', host: null, forwardedProto: 'https, http' },
        'http://0.0.0.0:3000',
      ),
    ).toBe('https://a.example');
  });

  it('ホストが分からなければ待ち受け側のオリジンを使う', () => {
    expect(resolveRequestOrigin({ forwardedHost: null, host: null, forwardedProto: null }, 'http://0.0.0.0:3000')).toBe(
      'http://0.0.0.0:3000',
    );
  });
});
