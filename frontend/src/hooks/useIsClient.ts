import { useSyncExternalStore } from 'react';

// 購読する外部の変化は無いので、何もしない購読関数を返す
function subscribe(): () => void {
  return () => {};
}

// ブラウザで描画されているかを返す。サーバー描画時とハイドレーション中は false、その後は true。
// createPortal など、サーバーでは使えない処理をハイドレーションの不一致なしに出し分けるために使う
// （useEffect で状態を true にする方法と違い、描画のやり直しが起きない）
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
