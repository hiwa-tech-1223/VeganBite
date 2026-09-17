import { getAdminLoginErrorMessage } from './adminLoginErrorMessage';

describe('getAdminLoginErrorMessage', () => {
  it('管理者として登録されていない場合の文言を返す', () => {
    expect(getAdminLoginErrorMessage('not_admin')).toBe('管理者として登録されていません');
  });

  it('state の照合に失敗した場合は再試行を促す', () => {
    expect(getAdminLoginErrorMessage('invalid_state')).toContain('もう一度お試しください');
  });

  it('その他のエラーは汎用の文言を返す', () => {
    expect(getAdminLoginErrorMessage('token_exchange')).toBe('ログインに失敗しました');
  });

  it('任意の文字列を渡されても、その文字列を表示しない', () => {
    expect(getAdminLoginErrorMessage('偽のお知らせ: こちらのURLへ')).toBe('ログインに失敗しました');
  });
});
