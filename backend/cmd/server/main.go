// HTTP サーバーのエントリポイント
// ローカル開発と Cloud Run の両方で使用する。待ち受けポートは PORT 環境変数（既定 8080）
package main

import (
	"log"

	"backend/config"
	"backend/server"
)

func main() {
	cfg := config.Load()

	e, err := server.NewEcho(cfg)
	if err != nil {
		log.Fatal("Failed to initialize server:", err)
	}

	addr := ":" + cfg.Port
	log.Println("Server starting on", addr)
	e.Logger.Fatal(e.Start(addr))
}
