// ログイン失敗の理由ごとの表示文言（error クエリはバックエンドの OAuth コールバックが付与する）
const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  banned: 'このアカウントは利用停止されています。',
  suspended: 'このアカウントは一時停止中です。期間が終了するとログインできます。',
};

const DEFAULT_LOGIN_ERROR_MESSAGE = 'ログインに失敗しました。もう一度お試しください。';

export function getLoginErrorMessage(error: string): string {
  return LOGIN_ERROR_MESSAGES[error] ?? DEFAULT_LOGIN_ERROR_MESSAGE;
}
