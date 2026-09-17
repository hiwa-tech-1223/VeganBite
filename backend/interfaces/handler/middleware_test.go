package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

// newOriginVerifyServer - ミドルウェアを適用した最小の Echo を組み立てる
func newOriginVerifyServer(secret string) *echo.Echo {
	e := echo.New()
	e.Use(OriginVerifyMiddleware(secret))
	e.GET("/api/health", HealthCheck)
	e.GET("/api/products", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})
	return e
}

func TestOriginVerifyMiddleware(t *testing.T) {
	const secret = "s3cr3t-value"

	tests := []struct {
		name       string
		secret     string
		path       string
		header     string
		setHeader  bool
		wantStatus int
	}{
		{
			name:       "シークレット未設定なら照合しない",
			secret:     "",
			path:       "/api/products",
			wantStatus: http.StatusOK,
		},
		{
			name:       "ヘッダーが一致すれば通す",
			secret:     secret,
			path:       "/api/products",
			header:     secret,
			setHeader:  true,
			wantStatus: http.StatusOK,
		},
		{
			name:       "ヘッダーが無ければ拒否する",
			secret:     secret,
			path:       "/api/products",
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "ヘッダーが一致しなければ拒否する",
			secret:     secret,
			path:       "/api/products",
			header:     "wrong-value",
			setHeader:  true,
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "前方一致の値でも拒否する",
			secret:     secret,
			path:       "/api/products",
			header:     "s3cr3t",
			setHeader:  true,
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "ヘルスチェックは照合の対象外",
			secret:     secret,
			path:       "/api/health",
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := newOriginVerifyServer(tt.secret)
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			if tt.setHeader {
				req.Header.Set(OriginVerifyHeader, tt.header)
			}
			rec := httptest.NewRecorder()

			e.ServeHTTP(rec, req)

			if rec.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
		})
	}
}
