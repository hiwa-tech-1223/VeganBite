// ローカル開発用エントリポイント
// HTTPサーバーとして :8080 で起動する
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

	// TCPポート8080でHTTPリクエストを待ち受ける
	log.Println("Server starting on :8080")
	e.Logger.Fatal(e.Start(":8080"))
}
