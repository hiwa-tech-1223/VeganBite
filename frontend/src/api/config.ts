// サーバーサイド（SSR）ではDocker内部URL、クライアントサイドではブラウザ用URLを使用
export const API_BASE_URL =
  typeof window === 'undefined'
    ? process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
