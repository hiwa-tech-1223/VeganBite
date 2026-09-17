package customer

// CustomerRepository - カスタマーリポジトリインターフェース
type CustomerRepository interface {
	// FindByID - 存在しない場合は ErrNotFound を返す
	FindByID(id int64) (*Customer, error)
	FindByGoogleID(googleID string) (*Customer, error)
	FindAllWithReviewCount() ([]Customer, map[int64]int, error)
	Create(customer *Customer) error
	Update(customer *Customer) error
}
