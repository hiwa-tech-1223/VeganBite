package customer

import (
	"errors"
	"testing"
	"time"
)

func TestCustomer_CheckAccess(t *testing.T) {
	now := time.Date(2026, 9, 17, 12, 0, 0, 0, time.UTC)
	future := now.Add(24 * time.Hour)
	past := now.Add(-time.Second)

	tests := []struct {
		name    string
		c       Customer
		wantErr error
	}{
		{name: "有効なら許可", c: Customer{Status: StatusActive}, wantErr: nil},
		{name: "BAN は拒否", c: Customer{Status: StatusBanned}, wantErr: ErrBanned},
		{name: "期限前の一時停止は拒否", c: Customer{Status: StatusSuspended, SuspendedUntil: &future}, wantErr: ErrSuspended},
		{name: "期限を過ぎた一時停止は許可", c: Customer{Status: StatusSuspended, SuspendedUntil: &past}, wantErr: nil},
		{name: "期限ちょうどは許可", c: Customer{Status: StatusSuspended, SuspendedUntil: &now}, wantErr: nil},
		{name: "期限未設定の一時停止は拒否", c: Customer{Status: StatusSuspended}, wantErr: ErrSuspended},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.c.CheckAccess(now)
			if !errors.Is(err, tt.wantErr) {
				t.Errorf("CheckAccess() = %v, want %v", err, tt.wantErr)
			}
		})
	}
}
