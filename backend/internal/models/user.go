package models

import (
	"time"

	"gorm.io/gorm"
)

type Role string

const (
	RoleAdmin    Role = "admin"
	RoleEmployee Role = "employee"
)

type SUser struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"size:255" json:"name"`  // Legacy column from Laravel
	Email     string         `gorm:"size:255;index" json:"email"` // Legacy column from Laravel
	UserID    string         `gorm:"size:50;index" json:"user_id"` // Link to legacy SDBFLPASS table
	Username  string         `gorm:"uniqueIndex:idx_users_username,where:username IS NOT NULL;size:100" json:"username"`
	Password  string         `gorm:"not null" json:"-"` // Never export password
	FullName  string         `json:"full_name"`
	Role      Role           `gorm:"type:varchar(20);default:'employee'" json:"role"`
	SDBFLPASS  *SDBFLPASS      `gorm:"foreignKey:UserID;references:USERID;-:migration" json:"dbflpass,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (u *SUser) GetDynamicRole() string {
	if u.SDBFLPASS != nil {
		switch u.SDBFLPASS.TINGKAT {
		case "2":
			return "admin"
		case "1":
			return "pengurus"
		case "0":
			return "karyawan"
		}
	}
	// Fallback to role field
	if u.Role == RoleAdmin {
		return "admin"
	}
	return "karyawan"
}

type SLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type SLoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"` // Unix timestamp (ms) when access_token expires
	SUser         SUser   `json:"user"`
}


func (SUser) TableName() string {
	return "users"
}
