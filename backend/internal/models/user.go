package models

import (
	"time"

	"gorm.io/gorm"
)

// Role represents the system role of an internal user (JWT-authenticated website login)
type Role string

const (
	RoleAdmin    Role = "admin"
	RoleEmployee Role = "employee"
)

// SUser is the primary domain model for internal website authentication (users table).
// It is distinct from the legacy SDBFLPASS table used for the admin panel.
type SUser struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"size:255" json:"name"`         // Legacy column from Laravel
	Email     string         `gorm:"size:255;index" json:"email"`  // Legacy column from Laravel
	UserID    string         `gorm:"size:50;index" json:"user_id"` // Link to legacy SDBFLPASS table
	Username  string         `gorm:"uniqueIndex:idx_users_username,where:username IS NOT NULL;size:100" json:"username"`
	Password  string         `gorm:"not null" json:"-"` // Never export password
	FullName  string         `json:"full_name"`
	Role      Role           `gorm:"type:varchar(20);default:'employee'" json:"role"`
	SDBFLPASS *SDBFLPASS     `gorm:"foreignKey:UserID;references:USERID;-:migration" json:"dbflpass,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName explicitly maps SUser to the "users" table, overriding GORM pluralization.
func (SUser) TableName() string {
	return "users"
}

// GetDynamicRole derives a human-readable role string from the linked legacy DBFLPASS record.
// Falls back to the Role field if no DBFLPASS is loaded.
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
	if u.Role == RoleAdmin {
		return "admin"
	}
	return "karyawan"
}
