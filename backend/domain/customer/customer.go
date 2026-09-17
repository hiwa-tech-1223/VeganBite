package customer

import (
	"errors"
	"time"
)

// ステータス定数
const (
	StatusActive    = 0
	StatusBanned    = 1
	StatusSuspended = 2
)

// ドメインエラー
var (
	// ErrNotFound - カスタマーが存在しない
	ErrNotFound = errors.New("customer not found")
	// ErrBanned - BAN されている
	ErrBanned = errors.New("customer is banned")
	// ErrSuspended - 一時停止中
	ErrSuspended = errors.New("customer is suspended")
)

// Customer - 一般カスタマー
type Customer struct {
	ID             int64      `json:"id" gorm:"primaryKey;autoIncrement"`
	GoogleID       string     `json:"googleId" gorm:"uniqueIndex"`
	Email          string     `json:"email" gorm:"uniqueIndex"`
	Name           string     `json:"name"`
	Avatar         string     `json:"avatar"`
	MemberSince    time.Time  `json:"memberSince" gorm:"type:date;default:CURRENT_DATE"`
	Status         int        `json:"status" gorm:"default:0"`
	StatusReason   *string    `json:"statusReason"`
	SuspendedUntil *time.Time `json:"suspendedUntil"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

// TableName - GORMテーブル名
func (Customer) TableName() string {
	return "customers"
}

// CheckAccess - 指定時刻にログインや API 利用が許可されているかを判定する。
// BAN は無期限で拒否する。一時停止は期限まで拒否し、期限を過ぎていれば許可する（解除操作は不要）。
// 期限が未設定の一時停止は、安全側に倒して拒否する
func (c *Customer) CheckAccess(now time.Time) error {
	switch c.Status {
	case StatusBanned:
		return ErrBanned
	case StatusSuspended:
		if c.SuspendedUntil == nil || now.Before(*c.SuspendedUntil) {
			return ErrSuspended
		}
	}
	return nil
}
