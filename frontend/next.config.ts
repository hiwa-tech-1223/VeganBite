import type { NextConfig } from 'next';
import { withBotId } from 'botid/next/config';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    // 商品画像として外部ドメイン（Supabase Storage、楽天アフィリエイト等）を許可
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

// BotID のチャレンジ用スクリプトを同一オリジン経由で配信する（広告ブロッカー等で無効化されないようにするため）
export default withBotId(nextConfig);
