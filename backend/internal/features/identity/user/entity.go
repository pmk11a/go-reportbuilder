package user

import (
	"time"

	"gorm.io/gorm"
)

// Role represents the system role of an internal user (JWT-authenticated website login).
type Role string

const (
	RoleAdmin    Role = "admin"
	RoleEmployee Role = "employee"
)

// SUser is the primary domain model for internal website authentication
// (the "users" table). It is distinct from the legacy SDBFLPASS table used
// for the admin panel.
type SUser struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"size:255" json:"name"`
	Email     string         `gorm:"size:255;index" json:"email"`
	UserID    string         `gorm:"size:50;index" json:"user_id"` // Link to legacy SDBFLPASS
	Username  string         `gorm:"uniqueIndex:idx_users_username,where:username IS NOT NULL;size:100" json:"username"`
	Password  string         `gorm:"not null" json:"-"`
	FullName  string         `json:"full_name"`
	Role      Role           `gorm:"type:varchar(20);default:'employee'" json:"role"`
	SDBFLPASS *SDBFLPASS     `gorm:"foreignKey:UserID;references:USERID;-:migration" json:"dbflpass,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName explicitly maps SUser to the "users" table, overriding GORM
// pluralization. Without this, GORM would default to "SUsers" (or similar).
func (SUser) TableName() string {
	return "users"
}

// GetDynamicRole derives a human-readable role string used as the JWT
// "role" claim. The modern Role field is the source of truth and is
// checked FIRST: any user with Role == RoleAdmin always resolves to
// "admin", regardless of what the legacy SDBFLPASS.TINGKAT column says.
// This prevents stale/out-of-sync TINGKAT values (e.g. a legacy row
// still set to "0" = karyawan) from overriding a deliberately-promoted
// admin account.
//
// When Role is not admin, SDBFLPASS.TINGKAT is used to distinguish
// pengurus / system_admin / karyawan for legacy admin-panel parity.
// Falls back to "karyawan" if SDBFLPASS is nil or TINGKAT is unmapped.
func (u *SUser) GetDynamicRole() string {
	if u.Role == RoleAdmin {
		return "admin"
	}
	if u.SDBFLPASS != nil {
		switch u.SDBFLPASS.TINGKAT {
		case "2":
			return "admin"
		case "1":
			return "pengurus"
		case "5":
			return "system_admin"
		case "0":
			return "karyawan"
		}
	}
	return "karyawan"
}

// SDBFLPASS is the legacy admin-panel user record. The "users" table
// (SUser) joins to DBFLPASS via UserID for richer role data.
type SDBFLPASS struct {
	USERID    string `gorm:"primaryKey;column:USERID;size:50;not null" json:"user_id"`
	UID       string `gorm:"column:UID;size:50" json:"-"`
	FullName  string `gorm:"column:FullName;size:100" json:"full_name"`
	TINGKAT   string `gorm:"column:TINGKAT;size:2" json:"tingkat"`
	STATUS    string `gorm:"column:STATUS;size:1" json:"status"`
	HOSTID    string `gorm:"column:HOSTID;size:50" json:"host_id"`
	IPAddres  string `gorm:"column:IPAddres;size:50" json:"ip_address"`
	KodeBag   string `gorm:"column:kodeBag;size:10" json:"kode_bag"`
	KodeJab   string `gorm:"column:KodeJab;size:10" json:"kode_jab"`
	KodeKasir string `gorm:"column:KodeKasir;size:10" json:"kode_kasir"`
	Kodegdg   string `gorm:"column:Kodegdg;size:10" json:"kode_gdg"`
	Keynik    string `gorm:"column:keynik;size:50" json:"keynik"`
	UID2      string `gorm:"column:UID2;size:100" json:"-"` // Legacy password hash
}

// TableName explicitly maps SDBFLPASS to the legacy "DBFLPASS" table.
func (SDBFLPASS) TableName() string {
	return "DBFLPASS"
}
