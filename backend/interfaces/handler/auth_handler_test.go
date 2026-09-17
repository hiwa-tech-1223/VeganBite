package handler

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"backend/infrastructure/auth"

	"github.com/labstack/echo/v4"
)

func newLoginTestHandler() *AuthHandler {
	oauth := auth.NewOAuthService("client-id", "client-secret", "https://example.com/api/auth/google/callback", "https://example.com/api/auth/admin/google/callback")
	return NewAuthHandler(nil, oauth, nil, "https://example.com")
}

func TestLoginHandlers_UseGivenState(t *testing.T) {
	validState := strings.Repeat("aB3_-", 9) // 45 文字の base64url

	tests := []struct {
		name       string
		call       func(h *AuthHandler, c echo.Context) error
		query      string
		wantStatus int
		wantState  string
	}{
		{name: "カスタマー: 有効な state を Google の認可 URL に載せる", call: (*AuthHandler).HandleGoogleLogin, query: "state=" + validState, wantStatus: http.StatusTemporaryRedirect, wantState: validState},
		{name: "管理者: 有効な state を Google の認可 URL に載せる", call: (*AuthHandler).HandleAdminGoogleLogin, query: "state=" + validState, wantStatus: http.StatusTemporaryRedirect, wantState: validState},
		{name: "state が無ければ 400", call: (*AuthHandler).HandleGoogleLogin, query: "", wantStatus: http.StatusBadRequest},
		{name: "短すぎる state は 400", call: (*AuthHandler).HandleGoogleLogin, query: "state=short", wantStatus: http.StatusBadRequest},
		{name: "使えない文字を含む state は 400", call: (*AuthHandler).HandleAdminGoogleLogin, query: "state=" + url.QueryEscape(strings.Repeat("a", 40)+"&x=1"), wantStatus: http.StatusBadRequest},
		{name: "長すぎる state は 400", call: (*AuthHandler).HandleGoogleLogin, query: "state=" + strings.Repeat("a", 129), wantStatus: http.StatusBadRequest},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, "/api/auth/google?"+tt.query, nil)
			rec := httptest.NewRecorder()

			if err := tt.call(newLoginTestHandler(), e.NewContext(req, rec)); err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
			if tt.wantState == "" {
				return
			}
			loc, err := url.Parse(rec.Header().Get("Location"))
			if err != nil {
				t.Fatalf("invalid Location: %v", err)
			}
			if got := loc.Query().Get("state"); got != tt.wantState {
				t.Errorf("state in auth URL = %q, want %q", got, tt.wantState)
			}
		})
	}
}
