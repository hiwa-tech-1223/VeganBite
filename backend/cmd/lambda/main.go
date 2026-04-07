// AWSデプロイ用エントリポイント
// API Gateway経由のリクエストをEchoに変換して処理する
package main

import (
	"log"

	"backend/config"
	"backend/server"

	"github.com/aws/aws-lambda-go/lambda"
	echoadapter "github.com/awslabs/aws-lambda-go-api-proxy/echo"
)

func main() {
	cfg := config.Load()

	e, err := server.NewEcho(cfg)
	if err != nil {
		log.Fatal("Failed to initialize server:", err)
	}

	// EchoをLambdaアダプターで包み、API GatewayのJSONイベントをHTTPリクエストに変換する
	adapter := echoadapter.NewV2(e)
	// Lambdaランタイムにハンドラーとして登録し、イベント駆動で処理する
	lambda.Start(adapter.ProxyWithContext)
}
