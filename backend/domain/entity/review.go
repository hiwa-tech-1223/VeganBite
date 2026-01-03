package entity

import "time"

// Review - レビュー
type Review struct {
	ID        string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ProductID string    `json:"productId"`
	Product   *Product  `json:"product" gorm:"foreignKey:ProductID"`
	UserID    string    `json:"userId"`
	User      *User     `json:"user" gorm:"foreignKey:UserID"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
