package repository

import "backend/domain/entity"

// FavoriteRepository - お気に入りリポジトリインターフェース
type FavoriteRepository interface {
	FindByUserID(userID string) ([]entity.Favorite, error)
	FindByUserIDAndProductID(userID, productID string) (*entity.Favorite, error)
	Create(favorite *entity.Favorite) error
	Delete(userID, productID string) error
}
