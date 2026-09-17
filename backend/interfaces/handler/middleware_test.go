package handler

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"backend/domain/customer"

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

// fakeAccessChecker - EnsureCustomerCanAccess の結果を固定で返す
type fakeAccessChecker struct {
	err    error
	called bool
}

func (f *fakeAccessChecker) EnsureCustomerCanAccess(_ int64) error {
	f.called = true
	return f.err
}

func TestCustomerStatusMiddleware(t *testing.T) {
	tests := []struct {
		name       string
		isAdmin    bool
		setUserID  bool
		checkErr   error
		wantStatus int
		wantBody   string
		wantCalled bool
	}{
		{name: "有効なカスタマーは通す", setUserID: true, wantStatus: http.StatusOK, wantCalled: true},
		{name: "BAN 中は 403", setUserID: true, checkErr: customer.ErrBanned, wantStatus: http.StatusForbidden, wantBody: "account_banned", wantCalled: true},
		{name: "一時停止中は 403", setUserID: true, checkErr: customer.ErrSuspended, wantStatus: http.StatusForbidden, wantBody: "account_suspended", wantCalled: true},
		{name: "存在しないユーザーは 401", setUserID: true, checkErr: customer.ErrNotFound, wantStatus: http.StatusUnauthorized, wantCalled: true},
		{name: "確認できない場合は 503（ログアウトさせない）", setUserID: true, checkErr: errors.New("db down"), wantStatus: http.StatusServiceUnavailable, wantCalled: true},
		{name: "管理者は確認しない", isAdmin: true, setUserID: true, checkErr: customer.ErrBanned, wantStatus: http.StatusOK, wantCalled: false},
		{name: "ユーザー ID が無ければ 401", setUserID: false, wantStatus: http.StatusUnauthorized, wantCalled: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			checker := &fakeAccessChecker{err: tt.checkErr}
			e := echo.New()
			// JWTMiddleware の代わりにコンテキストへ値を入れる
			e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
				return func(c echo.Context) error {
					c.Set("isAdmin", tt.isAdmin)
					if tt.setUserID {
						c.Set("userId", int64(1))
					}
					return next(c)
				}
			})
			e.Use(CustomerStatusMiddleware(checker))
			e.GET("/api/me", func(c echo.Context) error {
				return c.String(http.StatusOK, "ok")
			})

			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/me", nil))

			if rec.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
			if tt.wantBody != "" && !strings.Contains(rec.Body.String(), tt.wantBody) {
				t.Errorf("body = %q, want to contain %q", rec.Body.String(), tt.wantBody)
			}
			if checker.called != tt.wantCalled {
				t.Errorf("checker called = %v, want %v", checker.called, tt.wantCalled)
			}
		})
	}
}
