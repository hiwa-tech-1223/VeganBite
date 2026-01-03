package entity

import "time"

// Favorite - お気に入り
type Favorite struct {
	ID        string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID    string    `json:"userId"`
	User      *User     `json:"user" gorm:"foreignKey:UserID"`
	ProductID string    `json:"productId"`
	Product   *Product  `json:"product" gorm:"foreignKey:ProductID"`
	CreatedAt time.Time `json:"createdAt"`
}
