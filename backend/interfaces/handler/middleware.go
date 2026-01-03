package handler

import (
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

// HealthCheck - ヘルスチェック
func HealthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}
