package usecase

import (
	"backend/domain/admin"
	"backend/domain/customer"
	"backend/infrastructure/auth"
	"errors"
	"time"
)

// AuthUsecase - 認証ユースケース
type AuthUsecase struct {
	customerRepo customer.CustomerRepository
	adminRepo    admin.AdminRepository
	// now - 現在時刻の取得（一時停止の期限判定用。テストで差し替える）
	now func() time.Time
}

// NewAuthUsecase - 認証ユースケースの生成
func NewAuthUsecase(customerRepo customer.CustomerRepository, adminRepo admin.AdminRepository) *AuthUsecase {
	return &AuthUsecase{
		customerRepo: customerRepo,
		adminRepo:    adminRepo,
		now:          time.Now,
	}
}

// FindOrCreateCustomer - カスタマー検索または作成。
// BAN・一時停止中の既存カスタマーは customer.ErrBanned / customer.ErrSuspended を返し、ログインさせない
func (u *AuthUsecase) FindOrCreateCustomer(googleUserInfo *auth.GoogleUserInfo) (*customer.Customer, error) {
	existing, err := u.customerRepo.FindByGoogleID(googleUserInfo.ID)
	if err != nil {
		// 新規作成
		newCustomer := &customer.Customer{
			GoogleID:    googleUserInfo.ID,
			Email:       googleUserInfo.Email,
			Name:        googleUserInfo.Name,
			Avatar:      googleUserInfo.Picture,
			MemberSince: time.Now(),
		}
		if err := u.customerRepo.Create(newCustomer); err != nil {
			return nil, err
		}
		return newCustomer, nil
	}
	if err := existing.CheckAccess(u.now()); err != nil {
		return nil, err
	}

	// 既存カスタマー更新
	existing.Name = googleUserInfo.Name
	existing.Avatar = googleUserInfo.Picture
	if err := u.customerRepo.Update(existing); err != nil {
		return nil, err
	}
	return existing, nil
}

// EnsureCustomerCanAccess - ログイン済みカスタマーが API を利用できるかを確認する。
// 発行済みの JWT は取り消せないため、BAN・一時停止をリクエストごとに反映させる目的で使う。
// 存在しない場合は customer.ErrNotFound、BAN・一時停止中は customer.ErrBanned / customer.ErrSuspended を返す
func (u *AuthUsecase) EnsureCustomerCanAccess(customerID int64) error {
	c, err := u.customerRepo.FindByID(customerID)
	if err != nil {
		return err
	}
	return c.CheckAccess(u.now())
}

// FindAndUpdateAdmin - 管理者検索と更新
func (u *AuthUsecase) FindAndUpdateAdmin(googleUserInfo *auth.GoogleUserInfo) (*admin.Admin, error) {
	a, err := u.adminRepo.FindByGoogleIDOrEmail(googleUserInfo.ID, googleUserInfo.Email)
	if err != nil {
		return nil, errors.New("admin not found")
	}

	a.GoogleID = googleUserInfo.ID
	a.Name = googleUserInfo.Name
	a.Avatar = googleUserInfo.Picture
	if err := u.adminRepo.Update(a); err != nil {
		return nil, err
	}
	return a, nil
}

// GetCurrentCustomerOrAdmin - 現在のカスタマーまたは管理者を取得
func (u *AuthUsecase) GetCurrentCustomerOrAdmin(userID int64, isAdmin bool) (interface{}, error) {
	if isAdmin {
		return u.adminRepo.FindByID(userID)
	}
	return u.customerRepo.FindByID(userID)
}
