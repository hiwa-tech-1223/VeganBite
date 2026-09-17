package handler

import (
	"crypto/subtle"
	"net/http"
	"strings"

	"backend/infrastructure/auth"

	"github.com/labstack/echo/v4"
)

// JWTMiddleware - JWT認証ミドルウェア
func JWTMiddleware(jwtService *auth.JWTService) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Missing authorization header"})
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			if tokenString == authHeader {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid authorization format"})
			}

			claims, err := jwtService.ValidateToken(tokenString)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid token"})
			}

			// Set user info in context
			c.Set("userId", claims.UserID)
			c.Set("email", claims.Email)
			c.Set("isAdmin", claims.IsAdmin)
			c.Set("role", claims.Role)

			return next(c)
		}
	}
}

// OriginVerifyHeader - フロントエンドの中継が付与する共有シークレットのヘッダー名
const OriginVerifyHeader = "X-Origin-Verify"

// originVerifyExemptPaths - 照合の対象外にするパス。
// ヘルスチェックは DB に触れず情報も返さないため、デプロイ時のスモークテストから直接呼べるようにする
var originVerifyExemptPaths = map[string]struct{}{
	"/api/health": {},
}

// OriginVerifyMiddleware - フロントエンド（Vercel）経由のリクエストだけを受け付けるミドルウェア。
// Cloud Run の URL は公開されているため、Vercel の Firewall（レート制限・Bot 対策）を迂回した直接アクセスをここで拒否する。
// secret が空の場合は照合を行わない（ローカル開発と段階的な有効化のため）
func OriginVerifyMiddleware(secret string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if secret == "" {
				return next(c)
			}
			if _, ok := originVerifyExemptPaths[c.Request().URL.Path]; ok {
				return next(c)
			}

			got := c.Request().Header.Get(OriginVerifyHeader)
			// 比較にかかる時間から値を推測されないよう定数時間で比較する
			if subtle.ConstantTimeCompare([]byte(got), []byte(secret)) != 1 {
				return c.JSON(http.StatusForbidden, map[string]string{"error": "Forbidden"})
			}
			return next(c)
		}
	}
}

// HealthCheck - ヘルスチェック
func HealthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}
