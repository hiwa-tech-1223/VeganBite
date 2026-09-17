import { ORIGIN_VERIFY_HEADER, withOriginVerify } from './originVerify';

describe('withOriginVerify', () => {
  it('シークレットが設定されていればヘッダーを追加する', () => {
    const headers = withOriginVerify(undefined, 'shared-secret');

    expect(headers.get(ORIGIN_VERIFY_HEADER)).toBe('shared-secret');
  });

  it('シークレットが未設定ならヘッダーを追加しない', () => {
    const headers = withOriginVerify(undefined, undefined);

    expect(headers.has(ORIGIN_VERIFY_HEADER)).toBe(false);
  });

  it('既存のヘッダーを保持する', () => {
    const headers = withOriginVerify(
      { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      'shared-secret',
    );

    expect(headers.get('Authorization')).toBe('Bearer token');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get(ORIGIN_VERIFY_HEADER)).toBe('shared-secret');
  });

  it('呼び出し元が同名のヘッダーを渡しても上書きする', () => {
    const headers = withOriginVerify({ [ORIGIN_VERIFY_HEADER]: 'forged' }, 'shared-secret');

    expect(headers.get(ORIGIN_VERIFY_HEADER)).toBe('shared-secret');
  });
});
