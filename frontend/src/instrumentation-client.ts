import { initBotId } from 'botid/client/core';

// Vercel BotID（Basic、全プラン無料）のクライアント側チャレンジ。
// ここに列挙したリクエストにだけ検証用のヘッダーが付くため、
// サーバー側で checkBotId() を呼ぶルート（src/app/api/[...path]/route.ts の書き込み系メソッド）と必ず揃えること。
initBotId({
  protect: [
    { path: '/api/*', method: 'POST' },
    { path: '/api/*', method: 'PUT' },
    { path: '/api/*', method: 'DELETE' },
  ],
});
