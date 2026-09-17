// 管理者ログイン失敗の理由ごとの表示文言。
// error クエリの値をそのまま画面に出すと、任意の文言を表示させる URL を作れてしまうため、決まった文言に変換する
const ADMIN_LOGIN_ERROR_MESSAGES: Record<string, string> = {
  not_admin: '管理者として登録されていません',
  invalid_state: 'ログインの有効期限が切れました。もう一度お試しください',
};

const DEFAULT_ADMIN_LOGIN_ERROR_MESSAGE = 'ログインに失敗しました';

export function getAdminLoginErrorMessage(error: string): string {
  return ADMIN_LOGIN_ERROR_MESSAGES[error] ?? DEFAULT_ADMIN_LOGIN_ERROR_MESSAGE;
}
