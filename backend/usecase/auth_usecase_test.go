package usecase

import (
	"backend/domain/admin"
	"backend/domain/customer"
	"backend/infrastructure/auth"
	"errors"
	"testing"
	"time"
)

// ===== Mock Repositories =====

type mockAuthCustomerRepository struct {
	byID        map[int64]*customer.Customer
	byGoogleID  map[string]*customer.Customer
	findByIDErr error
	updated     []*customer.Customer
	created     []*customer.Customer
}

func (m *mockAuthCustomerRepository) FindByID(id int64) (*customer.Customer, error) {
	if m.findByIDErr != nil {
		return nil, m.findByIDErr
	}
	c, ok := m.byID[id]
	if !ok {
		return nil, customer.ErrNotFound
	}
	return c, nil
}

func (m *mockAuthCustomerRepository) FindByGoogleID(googleID string) (*customer.Customer, error) {
	c, ok := m.byGoogleID[googleID]
	if !ok {
		return nil, customer.ErrNotFound
	}
	return c, nil
}

func (m *mockAuthCustomerRepository) FindAllWithReviewCount() ([]customer.Customer, map[int64]int, error) {
	return nil, nil, nil
}

func (m *mockAuthCustomerRepository) Create(c *customer.Customer) error {
	m.created = append(m.created, c)
	return nil
}

func (m *mockAuthCustomerRepository) Update(c *customer.Customer) error {
	m.updated = append(m.updated, c)
	return nil
}

type mockAuthAdminRepository struct{}

func (m *mockAuthAdminRepository) FindByID(_ int64) (*admin.Admin, error) {
	return nil, errors.New("not used")
}

func (m *mockAuthAdminRepository) FindByGoogleIDOrEmail(_, _ string) (*admin.Admin, error) {
	return nil, errors.New("not used")
}

func (m *mockAuthAdminRepository) Update(_ *admin.Admin) error {
	return nil
}

var fixedNow = time.Date(2026, 9, 17, 12, 0, 0, 0, time.UTC)

func newTestAuthUsecase(repo *mockAuthCustomerRepository) *AuthUsecase {
	u := NewAuthUsecase(repo, &mockAuthAdminRepository{})
	u.now = func() time.Time { return fixedNow }
	return u
}

// ===== FindOrCreateCustomer =====

func TestFindOrCreateCustomer_RejectsRestrictedCustomers(t *testing.T) {
	future := fixedNow.Add(time.Hour)
	past := fixedNow.Add(-time.Hour)

	tests := []struct {
		name        string
		existing    customer.Customer
		wantErr     error
		wantUpdated bool
	}{
		{name: "有効なカスタマーはログインでき、プロフィールが更新される", existing: customer.Customer{ID: 1, GoogleID: "g", Status: customer.StatusActive}, wantErr: nil, wantUpdated: true},
		{name: "BAN 中はログインできない", existing: customer.Customer{ID: 1, GoogleID: "g", Status: customer.StatusBanned}, wantErr: customer.ErrBanned},
		{name: "一時停止中はログインできない", existing: customer.Customer{ID: 1, GoogleID: "g", Status: customer.StatusSuspended, SuspendedUntil: &future}, wantErr: customer.ErrSuspended},
		{name: "一時停止の期限を過ぎていればログインできる", existing: customer.Customer{ID: 1, GoogleID: "g", Status: customer.StatusSuspended, SuspendedUntil: &past}, wantErr: nil, wantUpdated: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			existing := tt.existing
			repo := &mockAuthCustomerRepository{byGoogleID: map[string]*customer.Customer{"g": &existing}}
			u := newTestAuthUsecase(repo)

			got, err := u.FindOrCreateCustomer(&auth.GoogleUserInfo{ID: "g", Name: "New Name", Picture: "p"})

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("err = %v, want %v", err, tt.wantErr)
			}
			if tt.wantErr != nil {
				if got != nil {
					t.Errorf("customer = %+v, want nil", got)
				}
				if len(repo.updated) != 0 {
					t.Errorf("restricted customer should not be updated")
				}
				return
			}
			if (len(repo.updated) == 1) != tt.wantUpdated {
				t.Errorf("updated = %d, wantUpdated %v", len(repo.updated), tt.wantUpdated)
			}
		})
	}
}

func TestFindOrCreateCustomer_CreatesNewCustomer(t *testing.T) {
	repo := &mockAuthCustomerRepository{byGoogleID: map[string]*customer.Customer{}}
	u := newTestAuthUsecase(repo)

	got, err := u.FindOrCreateCustomer(&auth.GoogleUserInfo{ID: "new", Email: "a@example.com", Name: "A"})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got == nil || len(repo.created) != 1 {
		t.Fatalf("expected a customer to be created")
	}
}

// ===== EnsureCustomerCanAccess =====

func TestEnsureCustomerCanAccess(t *testing.T) {
	future := fixedNow.Add(time.Hour)
	dbErr := errors.New("connection refused")

	tests := []struct {
		name    string
		repo    *mockAuthCustomerRepository
		id      int64
		wantErr error
	}{
		{name: "有効なら許可", repo: &mockAuthCustomerRepository{byID: map[int64]*customer.Customer{1: {ID: 1, Status: customer.StatusActive}}}, id: 1, wantErr: nil},
		{name: "BAN 中は拒否", repo: &mockAuthCustomerRepository{byID: map[int64]*customer.Customer{1: {ID: 1, Status: customer.StatusBanned}}}, id: 1, wantErr: customer.ErrBanned},
		{name: "一時停止中は拒否", repo: &mockAuthCustomerRepository{byID: map[int64]*customer.Customer{1: {ID: 1, Status: customer.StatusSuspended, SuspendedUntil: &future}}}, id: 1, wantErr: customer.ErrSuspended},
		{name: "存在しなければ ErrNotFound", repo: &mockAuthCustomerRepository{byID: map[int64]*customer.Customer{}}, id: 99, wantErr: customer.ErrNotFound},
		{name: "DB エラーはそのまま返す", repo: &mockAuthCustomerRepository{findByIDErr: dbErr}, id: 1, wantErr: dbErr},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := newTestAuthUsecase(tt.repo).EnsureCustomerCanAccess(tt.id)
			if !errors.Is(err, tt.wantErr) {
				t.Errorf("err = %v, want %v", err, tt.wantErr)
			}
		})
	}
}
