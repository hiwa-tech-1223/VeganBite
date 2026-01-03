package entity

import "time"

// Admin - 管理者
type Admin struct {
	ID        string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	GoogleID  string    `json:"googleId" gorm:"uniqueIndex"`
	Email     string    `json:"email" gorm:"uniqueIndex"`
	Name      string    `json:"name"`
	Avatar    string    `json:"avatar"`
	Role      string    `json:"role" gorm:"default:admin"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// User - 一般ユーザー
type User struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	GoogleID    string    `json:"googleId" gorm:"uniqueIndex"`
	Email       string    `json:"email" gorm:"uniqueIndex"`
	Name        string    `json:"name"`
	Avatar      string    `json:"avatar"`
	MemberSince time.Time `json:"memberSince" gorm:"type:date;default:CURRENT_DATE"`
	Phone       *string   `json:"phone"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// GoogleUserInfo - Googleから取得するユーザー情報
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}
