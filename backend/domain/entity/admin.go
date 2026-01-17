package entity

import "time"

// ロール名の定数
const (
	AdminRoleSuperAdmin = "super_admin"
	AdminRoleAdmin      = "admin"
	AdminRoleModerator  = "moderator"
)

// AdminRole - 管理者ロール
type AdminRole struct {
	ID          int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string    `json:"name" gorm:"uniqueIndex"`
	NameJa      string    `json:"nameJa" gorm:"column:name_ja"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Admin - 管理者
type Admin struct {
	ID        int64      `json:"id" gorm:"primaryKey;autoIncrement"`
	GoogleID  string     `json:"googleId" gorm:"uniqueIndex"`
	Email     string     `json:"email" gorm:"uniqueIndex"`
	Name      string     `json:"name"`
	Avatar    string     `json:"avatar"`
	RoleID    int64      `json:"roleId" gorm:"column:role_id"`
	Role      *AdminRole `json:"role" gorm:"foreignKey:RoleID"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

// IsSuperAdmin - スーパー管理者かどうか
func (a *Admin) IsSuperAdmin() bool {
	return a.Role != nil && a.Role.Name == AdminRoleSuperAdmin
}

// CanManageProducts - 商品管理権限があるか
func (a *Admin) CanManageProducts() bool {
	if a.Role == nil {
		return false
	}
	return a.Role.Name == AdminRoleSuperAdmin || a.Role.Name == AdminRoleAdmin
}

// CanManageReviews - レビュー管理権限があるか
func (a *Admin) CanManageReviews() bool {
	if a.Role == nil {
		return false
	}
	return a.Role.Name == AdminRoleSuperAdmin || a.Role.Name == AdminRoleAdmin || a.Role.Name == AdminRoleModerator
}
