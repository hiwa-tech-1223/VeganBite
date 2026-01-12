// ユーザー関連の型定義
// 注: User型は features/auth/types.ts で定義されています

import { ApiProduct } from '../products/types';

export interface UserFavorite {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

// お気に入り一覧取得時のレスポンス型（商品情報含む）
export interface ApiFavorite {
  id: string;
  userId: string;
  productId: string;
  product: ApiProduct;
  createdAt: string;
}
