# 本番用（Cloud Run）イメージ
# 開発用ホットリロード環境は Dockerfile.dev を参照

# --- ビルドステージ ---
FROM golang:1.27-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# 静的リンクした単一バイナリを生成（distroless/static で動かすため CGO 無効）
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /server ./cmd/server

# --- 実行ステージ ---
# distroless/static は CA 証明書と tzdata を含むため、Neon（TLS）や Google OAuth への接続に追加設定不要
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /server /server

ENV PORT=8080
EXPOSE 8080

USER nonroot:nonroot

ENTRYPOINT ["/server"]
