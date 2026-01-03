package repository

import "backend/domain/entity"

// ProductRepository - 商品リポジトリインターフェース
type ProductRepository interface {
	FindAll(categorySlug, search string) ([]entity.Product, error)
	FindByID(id string) (*entity.Product, error)
	Create(product *entity.Product) error
	Update(product *entity.Product) error
	Delete(id string) error
	UpdateRating(productID string, rating float64, count int) error
}

// CategoryRepository - カテゴリリポジトリインターフェース
type CategoryRepository interface {
	FindAll() ([]entity.Category, error)
	FindBySlug(slug string) (*entity.Category, error)
}
