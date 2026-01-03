package repository

import "backend/domain/entity"

// ReviewRepository - レビューリポジトリインターフェース
type ReviewRepository interface {
	FindByProductID(productID string) ([]entity.Review, error)
	FindByUserID(userID string) ([]entity.Review, error)
	FindByID(id string) (*entity.Review, error)
	FindByProductIDAndUserID(productID, userID string) (*entity.Review, error)
	Create(review *entity.Review) error
	Delete(id string) error
	GetProductRatingStats(productID string) (avg float64, count int64, err error)
}
