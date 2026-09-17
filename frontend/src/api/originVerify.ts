// Go API（Cloud Run）へのサーバーサイドリクエストに付与する共有シークレット。
// Cloud Run の URL は公開されているため、Go 側はこのヘッダーを持たないリクエストを拒否する。
// ブラウザには値を出さないこと（NEXT_PUBLIC_ を付けない。サーバーサイドのコードからのみ呼ぶ）。

export const ORIGIN_VERIFY_HEADER = 'X-Origin-Verify';

// 既存のヘッダーに共有シークレットを追加した Headers を返す。未設定（ローカル開発）の場合は追加しない
export function withOriginVerify(headers?: HeadersInit, secret: string | undefined = process.env.ORIGIN_VERIFY_SECRET): Headers {
  const merged = new Headers(headers);
  if (secret) {
    merged.set(ORIGIN_VERIFY_HEADER, secret);
  }
  return merged;
}
