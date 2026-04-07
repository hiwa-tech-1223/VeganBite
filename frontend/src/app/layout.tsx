import type { Metadata } from 'next';
import { Providers } from '@/components/common/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'VeganBite - ヴィーガン商品情報サイト',
    template: '%s | VeganBite',
  },
  description:
    'ヴィーガン向けの食品・化粧品などの商品情報、レビューを共有するコミュニティサイト',
  openGraph: {
    title: 'VeganBite - ヴィーガン商品情報サイト',
    description:
      'ヴィーガン向けの食品・化粧品などの商品情報、レビューを共有するコミュニティサイト',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'VeganBite',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VeganBite - ヴィーガン商品情報サイト',
    description:
      'ヴィーガン向けの食品・化粧品などの商品情報、レビューを共有するコミュニティサイト',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
