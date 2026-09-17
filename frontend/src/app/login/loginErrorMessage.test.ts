import { getLoginErrorMessage } from './loginErrorMessage';

describe('getLoginErrorMessage', () => {
  it('BAN の場合は利用停止の文言を返す', () => {
    expect(getLoginErrorMessage('banned')).toBe('このアカウントは利用停止されています。');
  });

  it('一時停止の場合は期間終了後にログインできる旨を返す', () => {
    expect(getLoginErrorMessage('suspended')).toContain('一時停止中');
  });

  it('それ以外のエラーは汎用の文言を返す', () => {
    expect(getLoginErrorMessage('token_exchange')).toBe('ログインに失敗しました。もう一度お試しください。');
  });

  it('未知の値でも汎用の文言を返す（クエリに任意の文字列を入れられても表示しない）', () => {
    expect(getLoginErrorMessage('<script>alert(1)</script>')).toBe('ログインに失敗しました。もう一度お試しください。');
  });
});
